import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api, BLOCKED_KEYWORDS } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";

import { getAuthUser, hashOtpCodeForEmail, normalizeAuthEmail, requireAuth, requestOtp, signToken, toPublicUser } from "./auth";



const upload = multer({ storage: multer.memoryStorage() });


const OTP_REQUEST_SCHEMA = z.object({ email: z.string().email() });
const RESET_PASSWORD_SCHEMA = z.object({
  email: z.string().email(),
  otp: z.string().trim().length(6),
  newPassword: z.string(),
});
const USER_ME_UPDATE_SCHEMA = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  whatsapp: z.string().trim().min(0).max(40).optional(),
  region: z.string().trim().min(2).max(160).optional(),
  profileImageUrl: z.string().url().optional(),
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  onboardingCompleted: z.boolean().optional(),
});

function authError(code: string, message: string) {
  return { error: { code, message } };
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}



function validatePassword(password: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

const authRateLimit = new Map<string, number[]>();

function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (authRateLimit.get(key) ?? []).filter((timestamp) => timestamp >= windowStart);
  if (hits.length >= limit) {
    authRateLimit.set(key, hits);
    return true;
  }
  hits.push(now);
  authRateLimit.set(key, hits);
  return false;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

async function uploadToCloudinary(file: Express.Multer.File, resourceType: "image" | "video") {
  const config = getCloudinaryConfig();
  if (!config) throw new Error("Cloudinary is not configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "petcrushes";
  const signBase = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto.createHash("sha1").update(signBase).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([file.buffer]), file.originalname);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudinary upload failed: ${body}`);
  }

  return response.json();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, name: "petcrushesv2-api" });
  });

  app.get("/api/auth/exists", async (req, res) => {
    const emailQuery = typeof req.query.email === "string" ? req.query.email : "";
    const normalizedEmail = normalizeAuthEmail(emailQuery);
    const parsed = OTP_REQUEST_SCHEMA.safeParse({ email: normalizedEmail });
    if (!parsed.success) {
      return res.status(400).json(authError("INVALID_EMAIL", "Verifique seu e-mail e tente novamente."));
    }

    const user = await storage.getUserByEmail(parsed.data.email);
    return res.json({ exists: !!user });
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    const parsed = OTP_REQUEST_SCHEMA.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_EMAIL", "Verifique seu e-mail e tente novamente."));

    const result = await requestOtp(parsed.data.email, req.ip);
    if ("error" in result) {
      const status = result.status ?? 400;
      return res.status(status).json(authError("OTP_REQUEST_FAILED", "Não conseguimos enviar o código agora. Tente novamente em alguns instantes."));
    }
    return res.json(result);
  });

  app.post("/api/auth/verify-otp", async (_req, res) => {
    return res.status(410).json(authError("OTP_AUTH_DISABLED", "O código por e-mail agora é usado apenas para redefinir sua senha."));
  });


  app.post("/api/auth/signup", async (req, res) => {
    const parsed = z.object({ email: z.string().email(), password: z.string(), confirmPassword: z.string().optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Revise os dados e tente novamente."));
    const email = normalizeAuthEmail(parsed.data.email);
    if (isRateLimited(`signup:${req.ip}:${email}`, 6, 10 * 60_000)) {
      return res.status(429).json(authError("RATE_LIMITED", "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente."));
    }
    if (typeof parsed.data.confirmPassword === "string" && parsed.data.password !== parsed.data.confirmPassword) {
      return res.status(400).json(authError("PASSWORD_MISMATCH", "A confirmação da senha não confere."));
    }
    if (!validatePassword(parsed.data.password)) return res.status(400).json(authError("WEAK_PASSWORD", "Sua senha precisa ter no mínimo 8 caracteres, letra, número e símbolo."));

    const exists = await storage.getUserByEmail(email);
    if (exists?.passwordHash) return res.status(400).json(authError("EMAIL_ALREADY_REGISTERED", "Este e-mail já possui cadastro com senha."));

    const user = exists
      ? await storage.updateUser(exists.id, { passwordHash: hashPassword(parsed.data.password), authProvider: "email", verified: "true", lastLoginAt: new Date(), updatedAt: new Date() })
      : await storage.createUser({ email, username: email, passwordHash: hashPassword(parsed.data.password), authProvider: "email", verified: "true", onboardingCompleted: false });

    return res.json({ token: signToken(user.id), user: toPublicUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Revise os dados e tente novamente."));
    const email = normalizeAuthEmail(parsed.data.email);
    if (isRateLimited(`login:${req.ip}:${email}`, 10, 10 * 60_000)) {
      return res.status(429).json(authError("RATE_LIMITED", "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente."));
    }
    const user = await storage.getUserByEmail(email);
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return res.status(400).json(authError("INVALID_CREDENTIALS", "E-mail ou senha inválidos."));
    }
    const updated = await storage.updateUser(user.id, { lastLoginAt: new Date(), updatedAt: new Date() });
    return res.json({ token: signToken(updated.id), user: toPublicUser(updated) });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const parsed = OTP_REQUEST_SCHEMA.safeParse(req.body);
    if (!parsed.success) {
      return res.json({ message: "Se existir uma conta com este e-mail, enviaremos um código." });
    }

    const email = normalizeAuthEmail(parsed.data.email);
    if (isRateLimited(`forgot:${req.ip}:${email}`, 4, 15 * 60_000)) {
      return res.json({ message: "Se existir uma conta com este e-mail, enviaremos um código." });
    }

    const existingUser = await storage.getUserByEmail(email);
    if (!existingUser) {
      return res.json({ message: "Se existir uma conta com este e-mail, enviaremos um código." });
    }

    const result = await requestOtp(email, req.ip);
    if ("error" in result) {
      if (result.status === 503) {
        return res.status(503).json(authError("EMAIL_SERVICE_UNAVAILABLE", "Nosso serviço de e-mail está temporariamente indisponível. Tente novamente em alguns instantes."));
      }
      return res.status(429).json(authError("OTP_REQUEST_FAILED", "Não conseguimos enviar o código agora. Tente novamente em alguns instantes."));
    }

    return res.json({ message: "Se existir uma conta com este e-mail, enviaremos um código." });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const parsed = RESET_PASSWORD_SCHEMA.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Revise os dados e tente novamente."));

    const email = normalizeAuthEmail(parsed.data.email);
    if (isRateLimited(`reset:${req.ip}:${email}`, 6, 15 * 60_000)) {
      return res.status(429).json(authError("RATE_LIMITED", "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente."));
    }
    if (!validatePassword(parsed.data.newPassword)) {
      return res.status(400).json(authError("WEAK_PASSWORD", "Sua nova senha precisa ter no mínimo 8 caracteres, letra, número e símbolo."));
    }

    const otp = await storage.getLatestPendingOtpByEmail(email);
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      if (otp) await storage.markOtpAsUsed(otp.id);
      return res.status(400).json(authError("OTP_INVALID_OR_EXPIRED", "Código inválido ou expirado. Solicite um novo código."));
    }

    if (otp.attempts >= 5) {
      await storage.markOtpAsUsed(otp.id);
      return res.status(429).json(authError("OTP_ATTEMPTS_EXCEEDED", "Você excedeu as tentativas. Solicite um novo código."));
    }

    const otpHash = hashOtpCodeForEmail(email, parsed.data.otp.trim());

    if (otpHash !== otp.codeHash) {
      const updatedOtp = await storage.incrementOtpAttempts(otp.id);
      if ((updatedOtp?.attempts ?? 0) >= 5) {
        await storage.markOtpAsUsed(otp.id);
      }
      return res.status(400).json(authError("OTP_INVALID_OR_EXPIRED", "Código inválido ou expirado. Solicite um novo código."));
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      await storage.markOtpAsUsed(otp.id);
      return res.status(400).json(authError("RESET_FAILED", "Não foi possível redefinir sua senha. Solicite um novo código."));
    }

    await storage.markOtpAsUsed(otp.id);
    await storage.updateUser(user.id, { passwordHash: hashPassword(parsed.data.newPassword), authProvider: "email", updatedAt: new Date() });

    return res.json({ message: "Senha atualizada com sucesso. Faça login com sua nova senha." });
  });

  app.post("/api/auth/google", async (req, res) => {
    const parsed = z.object({ idToken: z.string().min(10) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Token inválido."));

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json(authError("GOOGLE_AUTH_NOT_CONFIGURED", "Google login em configuração. Use e-mail e senha por enquanto."));
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.idToken)}`);
    if (!response.ok) return res.status(400).json(authError("INVALID_GOOGLE_TOKEN", "Não foi possível validar o Google login."));
    const payload = await response.json() as { sub?: string; email?: string; aud?: string; email_verified?: string };
    if (!payload.email || !payload.sub) return res.status(400).json(authError("INVALID_GOOGLE_TOKEN", "Token do Google inválido."));
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return res.status(400).json(authError("INVALID_GOOGLE_AUDIENCE", "Configuração Google inválida."));

    const email = normalizeAuthEmail(payload.email);
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({ email, username: email, googleId: payload.sub, authProvider: "google", verified: payload.email_verified === "true" ? "true" : "false", onboardingCompleted: false, lastLoginAt: new Date() });
    } else {
      user = await storage.updateUser(user.id, { googleId: payload.sub, authProvider: "google", verified: "true", lastLoginAt: new Date(), updatedAt: new Date() });
    }

    return res.json({ token: signToken(user.id), user: toPublicUser(user) });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));

    return res.json(toPublicUser(user));
  });

  app.get("/api/users/me", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));

    return res.json(toPublicUser(user));
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));

    const parsed = USER_ME_UPDATE_SCHEMA.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(authError("INVALID_USER_DATA", "Revise os dados do perfil e tente novamente."));
    }

    const input = parsed.data;
    const computedOnboardingCompleted =
      input.onboardingCompleted ??
      (hasText(input.displayName ?? user.displayName) && hasText(input.region ?? user.region));

    try {
      const updatedUser = await storage.updateUser(user.id, {
        ...input,
        onboardingCompleted: computedOnboardingCompleted,
        updatedAt: new Date(),
      });

      return res.json(toPublicUser(updatedUser));
    } catch (error) {
      console.error("[users-me-patch]", error);
      return res.status(500).json(authError("PROFILE_UPDATE_FAILED", "Não foi possível salvar seu perfil agora. Tente novamente em instantes."));
    }
  });

  const contentFilter = (content: string) => BLOCKED_KEYWORDS.find((k) => content.toLowerCase().includes(k.toLowerCase()));

  app.get(api.pets.list.path, async (req, res) => {
    const filters = req.query as any;
    const pets = await storage.getPets({
      ...filters,
      isDonation: filters.isDonation === "true" ? true : filters.isDonation === "false" ? false : undefined,
      limit: filters.limit ? Number(filters.limit) : undefined,
      page: filters.page ? Number(filters.page) : undefined,
    });
    res.json(pets);
  });

  app.get("/api/pets/mine", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const pets = await storage.getPets({ ownerId: user.id, limit: 50, page: 1 });
    return res.json(pets);
  });

  app.get("/api/pets/mine/default", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const activePet = await storage.getMyActivePet(user.id);
    return res.json(activePet);
  });

  app.get(api.pets.mineActive.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const activePet = await storage.getMyActivePet(user.id);
    return res.json(activePet);
  });

  app.patch(api.pets.setMineActive.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    try {
      const { petId } = api.pets.setMineActive.input.parse(req.body);
      const activePet = await storage.setActivePet(user.id, petId);
      return res.json(activePet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Escolha um pet válido. / Pick a valid pet." });
      }
      if (error instanceof Error && error.message === "PET_NOT_FOUND_OR_NOT_OWNED") {
        return res.status(404).json({ message: "Pet não encontrado na sua conta. / Pet not found in your account." });
      }
      return res.status(500).json({ message: "Não foi possível atualizar o pet ativo agora. / We couldn't update your active pet right now." });
    }
  });

  app.get("/api/feed", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const query = req.query as any;
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const mode = query.mode === "friends" ? "friends" : "crushes";
    const baseItems = await storage.getPets({
      species: query.species,
      gender: query.gender,
      objective: query.objective,
      region: query.region,
      size: query.size,
      excludeOwnerId: user.id,
      page,
      limit: Math.min(50, Math.max(1, limit)) * 2,
    });
    let items = baseItems;
    if (mode === "crushes") {
      items = baseItems.filter((pet) => !pet.neutered);
    } else {
      items = [...baseItems].sort((a, b) => Number((b.neutered || b.objective === "SOCIALIZATION")) - Number((a.neutered || a.objective === "SOCIALIZATION")));
    }
    items = items.slice(0, Math.min(50, Math.max(1, limit)));

    return res.json({
      items,
      page,
      limit,
      hasMore: items.length === Math.min(50, Math.max(1, limit)),
    });
  });

  app.get(api.pets.get.path, async (req, res) => {
    const pet = await storage.getPet(Number(req.params.id));
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    const owner = await storage.getUser(pet.ownerId);
    res.json({ ...pet, owner: owner ? toPublicUser(owner) : undefined });
  });

  app.post(api.pets.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    try {
      const input = api.pets.create.input.parse(req.body);
      if (!input.photos || input.photos.length < 3) {
        return res.status(400).json({ message: "Envie pelo menos 3 fotos do pet. / Please upload at least 3 photos." });
      }
      if (!input.videoUrl) {
        return res.status(400).json({ message: "Adicione 1 vídeo para continuar. / Please add 1 video to continue." });
      }
      if (contentFilter(input.about)) {
        return res.status(400).json({ message: "Sales content is not allowed.", field: "about" });
      }

      const pet = await storage.createPet({ ...input, ownerId: user.id });
      res.status(201).json(pet);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.pets.update.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    try {
      const pet = await storage.getPet(Number(req.params.id));
      if (!pet) return res.status(404).json({ message: "Pet not found" });
      if (pet.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });

      const input = api.pets.update.input.parse(req.body);
      if (input.about && contentFilter(input.about)) return res.status(400).json({ message: "Sales content blocked" });
      const updated = await storage.updatePet(Number(req.params.id), input);
      res.json(updated);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.pets.delete.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const pet = await storage.getPet(Number(req.params.id));
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });

    await storage.deletePet(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.likes.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    try {
      const { likerPetId, targetPetId } = api.likes.create.input.parse(req.body);
      if (likerPetId === targetPetId) return res.status(400).json({ message: "Você não pode curtir seu próprio pet. / You cannot like your own pet." });

      const likerPet = await storage.getPet(Number(likerPetId));
      const targetPet = await storage.getPet(Number(targetPetId));
      if (!likerPet || !targetPet) return res.status(404).json({ message: "Pet não encontrado. / Pet not found." });
      if (likerPet.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });
      if (targetPet.ownerId === user.id) return res.status(400).json({ message: "Você não pode curtir seu próprio pet. / You cannot like your own pet." });

      const result = await storage.createLike(likerPetId, targetPetId);
      res.json({ matched: result.isMatch, matchId: result.match?.id });
    } catch {
      res.status(400).json({ message: "Não foi possível registrar esse like agora. / Could not save this like right now." });
    }
  });

  app.get(api.matches.list.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const userPets = await storage.getPets({ ownerId: user.id });
    const allMatches = new Map<number, any>();
    for (const pet of userPets) {
      const petMatches = await storage.getMatches(pet.id);
      for (const m of petMatches) {
        if (allMatches.has(m.id)) continue;
        const petA = await storage.getPet(m.petAId);
        const petB = await storage.getPet(m.petBId);
        if (petA && petB) allMatches.set(m.id, { ...m, petA, petB });
      }
    }
    res.json(Array.from(allMatches.values()));
  });

  app.get(api.matches.get.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const match = await storage.getMatch(Number(req.params.id));
    if (!match) return res.status(404).json({ message: "Match não encontrado. / Match not found." });
    const petA = await storage.getPet(match.petAId);
    const petB = await storage.getPet(match.petBId);
    if (!petA || !petB) return res.status(404).json({ message: "Pets do match não encontrados. / Match pets not found." });
    if (petA.ownerId !== user.id && petB.ownerId !== user.id) return res.status(403).json({ message: "Você não participa desta conversa. / You are not part of this chat." });

    const messages = await storage.getMessages(match.id);
    res.json({ ...match, petA, petB, messages });
  });

  app.post(api.messages.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    try {
      const { content } = req.body;
      if (contentFilter(content)) return res.status(400).json({ message: "Conversas sobre venda/pagamento não são permitidas. / Sales/payment talk is not allowed." });

      const match = await storage.getMatch(Number(req.params.id));
      if (!match) return res.status(404).json({ message: "Match não encontrado. / Match not found." });
      const petA = await storage.getPet(match.petAId);
      const petB = await storage.getPet(match.petBId);
      if (!petA || !petB) return res.status(404).json({ message: "Pets do match não encontrados. / Match pets not found." });
      if (petA.ownerId !== user.id && petB.ownerId !== user.id) return res.status(403).json({ message: "Você não participa desta conversa. / You are not part of this chat." });

      const message = await storage.createMessage({ matchId: Number(req.params.id), senderId: user.id, content });
      res.status(201).json(message);
    } catch {
      res.status(400).json({ message: "Não foi possível enviar a mensagem agora. / Could not send your message right now." });
    }
  });

  app.post(api.reports.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Faça login para continuar. / Please sign in to continue." });

    const { targetPetId, reason } = req.body;
    const report = await storage.createReport({ reporterId: user.id, targetPetId, reason });
    res.status(201).json(report);
  });


  app.get("/api/adoptions", async (req, res) => {
    const page = Number((req.query as any).page || 1);
    const limit = Number((req.query as any).limit || 12);
    const items = await storage.getAdoptionPosts(page, limit);
    return res.json({ items, page, limit, hasMore: items.length === Math.min(50, Math.max(1, limit)) });
  });

  app.post("/api/adoptions", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));
    const parsed = api.adoptions.create.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Revise os dados da adoção e tente novamente."));
    if (contentFilter(parsed.data.description)) return res.status(400).json(authError("BLOCKED_CONTENT", "Remova termos de venda da descrição."));
    const created = await storage.createAdoptionPost({ ...parsed.data, ownerId: user.id });
    return res.status(201).json(created);
  });

  app.patch("/api/adoptions/:id", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));
    const id = Number(req.params.id);
    const existing = await storage.getAdoptionPost(id);
    if (!existing) return res.status(404).json(authError("NOT_FOUND", "Post não encontrado."));
    if (existing.ownerId !== user.id) return res.status(403).json(authError("FORBIDDEN", "Você só pode editar seus posts."));
    const parsed = api.adoptions.update.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Revise os dados da adoção e tente novamente."));
    if (parsed.data.description && contentFilter(parsed.data.description)) return res.status(400).json(authError("BLOCKED_CONTENT", "Remova termos de venda da descrição."));
    const updated = await storage.updateAdoptionPost(id, parsed.data);
    return res.json(updated);
  });

  app.post("/api/media/upload", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json(authError("MEDIA_FILE_REQUIRED", "Selecione um arquivo para enviar."));

    if (!getCloudinaryConfig()) {
      return res.status(503).json(authError("CLOUDINARY_NOT_CONFIGURED", "Upload de mídia temporariamente indisponível. Tente novamente em instantes."));
    }
    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) return res.status(400).json(authError("INVALID_MEDIA_TYPE", "Envie apenas imagem ou vídeo."));

    const maxBytes = isImage ? 10 * 1024 * 1024 : 60 * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return res.status(400).json(authError("MEDIA_FILE_TOO_LARGE", isImage ? "A imagem deve ter até 10MB." : "O vídeo deve ter até 60MB."));
    }

    const resourceType = isImage ? "image" : "video";

    let uploaded: any;
    try {
      uploaded = await uploadToCloudinary(req.file, resourceType);
    } catch (error) {
      console.error("[media-upload]", error);
      return res.status(503).json(authError("MEDIA_UPLOAD_UNAVAILABLE", "Não foi possível enviar a mídia agora. Tente novamente em instantes."));
    }

    if (resourceType === "video" && Number(uploaded.duration ?? 0) < 5) {
      return res.status(400).json(authError("VIDEO_TOO_SHORT", "O vídeo precisa ter ao menos 5 segundos. / Video must be at least 5 seconds long."));
    }

    res.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      resourceType,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      duration: uploaded.duration,
    });
  });

  const shouldSeedDatabase = process.env.NODE_ENV !== "production" && process.env.SKIP_DB_SEED !== "true";
  if (shouldSeedDatabase) await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("ana_silva");
  if (existingUsers) return;

  const user1 = await storage.createUser({ username: "ana_silva", email: "ana@example.com", displayName: "Ana Silva", region: "São Paulo, SP", verified: "true", whatsapp: "11999999999" });
  const user2 = await storage.createUser({ username: "carlos_souza", email: "carlos@example.com", displayName: "Carlos Souza", region: "Rio de Janeiro, RJ", verified: "true" });

  await storage.createPet({ ownerId: user1.id, displayName: "Thor", species: "Dog", breed: "Golden Retriever", gender: "MALE", size: "LARGE", colors: ["Gold"], ageMonths: 24, pedigree: true, objective: "BREEDING", region: "São Paulo, SP", about: "Thor is a very friendly and energetic Golden Retriever.", photos: ["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000"], videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", isDonation: false, vaccinated: true, neutered: false });
  await storage.createPet({ ownerId: user2.id, displayName: "Luna", species: "Dog", breed: "Golden Retriever", gender: "FEMALE", size: "LARGE", colors: ["Cream"], ageMonths: 20, pedigree: true, objective: "BREEDING", region: "Rio de Janeiro, RJ", about: "Luna is a sweet and calm Golden Retriever.", photos: ["https://images.unsplash.com/photo-1633722715463-d30f4f325e27?auto=format&fit=crop&q=80&w=1000"], videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", isDonation: false, vaccinated: true, neutered: false });
}
