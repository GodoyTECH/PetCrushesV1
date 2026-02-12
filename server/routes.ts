import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api, BLOCKED_KEYWORDS } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";

import { getAuthUser, isOnboardingCompleted, normalizeAuthEmail, requireAuth, requestOtp, verifyOtp } from "./auth";



const upload = multer({ storage: multer.memoryStorage() });


const OTP_REQUEST_SCHEMA = z.object({ email: z.string().email() });
const OTP_VERIFY_SCHEMA = z.object({ email: z.string().email(), code: z.string().length(6) });
const USER_ME_UPDATE_SCHEMA = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  whatsapp: z.string().trim().min(8).max(32).optional(),
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

  app.post("/api/auth/verify-otp", async (req, res) => {
    const parsed = OTP_VERIFY_SCHEMA.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(authError("INVALID_PAYLOAD", "Verifique os dados informados e tente novamente."));

    const result = await verifyOtp(parsed.data.email, parsed.data.code);
    if ("error" in result) {
      const status = result.status ?? 400;
      return res.status(status).json(authError("OTP_INVALID_OR_EXPIRED", "Código inválido ou expirado. Peça um novo."));
    }

    return res.json(result);
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));

    return res.json({ ...user, onboardingCompleted: isOnboardingCompleted(user) });
  });

  app.get("/api/users/me", requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json(authError("UNAUTHORIZED", "Faça login para continuar."));

    return res.json({ ...user, onboardingCompleted: isOnboardingCompleted(user) });
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
      (hasText(input.displayName ?? user.displayName) && hasText(input.whatsapp ?? user.whatsapp) && hasText(input.region ?? user.region));

    try {
      const updatedUser = await storage.updateUser(user.id, {
        ...input,
        onboardingCompleted: computedOnboardingCompleted,
        updatedAt: new Date(),
      });

      return res.json({ ...updatedUser, onboardingCompleted: isOnboardingCompleted(updatedUser) });
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
    });
    res.json(pets);
  });

  app.get(api.pets.get.path, async (req, res) => {
    const pet = await storage.getPet(Number(req.params.id));
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    const owner = await storage.getUser(pet.ownerId);
    res.json({ ...pet, owner });
  });

  app.post(api.pets.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
      const input = api.pets.create.input.parse(req.body);
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
    if (!user) return res.status(401).json({ message: "Unauthorized" });

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
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const pet = await storage.getPet(Number(req.params.id));
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });

    await storage.deletePet(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.likes.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { likerPetId, targetPetId } = api.likes.create.input.parse(req.body);
      if (likerPetId === targetPetId) return res.status(400).json({ message: "Cannot like your own pet" });

      const likerPet = await storage.getPet(Number(likerPetId));
      const targetPet = await storage.getPet(Number(targetPetId));
      if (!likerPet || !targetPet) return res.status(404).json({ message: "Pet not found" });
      if (likerPet.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });
      if (targetPet.ownerId === user.id) return res.status(400).json({ message: "Cannot like your own pet" });

      const result = await storage.createLike(likerPetId, targetPetId);
      res.json({ matched: result.isMatch, matchId: result.match?.id });
    } catch {
      res.status(400).json({ message: "Error creating like" });
    }
  });

  app.get(api.matches.list.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userPets = await storage.getPets({ ownerId: user.id });
    const allMatches: any[] = [];
    for (const pet of userPets) {
      const petMatches = await storage.getMatches(pet.id);
      for (const m of petMatches) {
        const petA = await storage.getPet(m.petAId);
        const petB = await storage.getPet(m.petBId);
        if (petA && petB) allMatches.push({ ...m, petA, petB });
      }
    }
    res.json(allMatches);
  });

  app.get(api.matches.get.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const match = await storage.getMatch(Number(req.params.id));
    if (!match) return res.status(404).json({ message: "Match not found" });
    const petA = await storage.getPet(match.petAId);
    const petB = await storage.getPet(match.petBId);
    if (!petA || !petB) return res.status(404).json({ message: "Match pets not found" });
    if (petA.ownerId !== user.id && petB.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });

    const messages = await storage.getMessages(match.id);
    res.json({ ...match, petA, petB, messages });
  });

  app.post(api.messages.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { content } = req.body;
      if (contentFilter(content)) return res.status(400).json({ message: "Sales content blocked" });

      const match = await storage.getMatch(Number(req.params.id));
      if (!match) return res.status(404).json({ message: "Match not found" });
      const petA = await storage.getPet(match.petAId);
      const petB = await storage.getPet(match.petBId);
      if (!petA || !petB) return res.status(404).json({ message: "Match pets not found" });
      if (petA.ownerId !== user.id && petB.ownerId !== user.id) return res.status(403).json({ error: "FORBIDDEN" });

      const message = await storage.createMessage({ matchId: Number(req.params.id), senderId: user.id, content });
      res.status(201).json(message);
    } catch {
      res.status(400).json({ message: "Error sending message" });
    }
  });

  app.post(api.reports.create.path, requireAuth, async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { targetPetId, reason } = req.body;
    const report = await storage.createReport({ reporterId: user.id, targetPetId, reason });
    res.status(201).json(report);
  });

  app.post("/api/media/upload", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) return res.status(400).json({ message: "Only image/video files are allowed" });

    const maxBytes = isImage ? 10 * 1024 * 1024 : 60 * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return res.status(400).json({ message: isImage ? "Image must be <= 10MB" : "Video must be <= 60MB" });
    }

    const resourceType = isImage ? "image" : "video";

    let uploaded: any;
    try {
      uploaded = await uploadToCloudinary(req.file, resourceType);
    } catch (error) {
      console.error("[media-upload]", error);
      return res.status(503).json(authError("MEDIA_UPLOAD_UNAVAILABLE", "Não foi possível enviar a mídia agora. Tente novamente em instantes."));
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
