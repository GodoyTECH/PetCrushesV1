import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { sendOtpEmail } from "./email";

const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const OTP_RATE_LIMIT_MAX_REQUESTS = 3;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return secret;
}

function getOtpSecret() {
  return process.env.OTP_SECRET || getJwtSecret();
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf-8");
}

function signJwt(payload: Record<string, unknown>) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const signature = base64UrlEncode(crypto.createHmac("sha256", getJwtSecret()).update(data).digest());
  return `${data}.${signature}`;
}

function verifyJwt(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const data = `${header}.${payload}`;
  const expectedSignature = base64UrlEncode(crypto.createHmac("sha256", getJwtSecret()).update(data).digest());
  if (signature !== expectedSignature) return null;

  const decoded = JSON.parse(base64UrlDecode(payload)) as { sub?: string; exp?: number };
  if (decoded.exp && Date.now() >= decoded.exp * 1000) return null;
  return decoded;
}

function getOtpTtlMs() {
  const minutes = Number(process.env.OTP_TTL_MINUTES ?? 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60_000 : 10 * 60_000;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtpCode(email: string, code: string) {
  return crypto
    .createHash("sha256")
    .update(`${getOtpSecret()}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

export function signToken(userId: string) {
  const expiresInSeconds = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  return signJwt({ sub: userId, exp: expiresInSeconds });
}

export async function requestOtp(emailInput: string, requestIp = "unknown") {
  const email = normalizeEmail(emailInput);
  const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS);
  const recentRequests = await storage.countRecentOtpRequests(`${email}|${requestIp}`, windowStart);

  if (recentRequests >= OTP_RATE_LIMIT_MAX_REQUESTS) {
    return { error: "Too many OTP requests. Try again later.", status: 429 } as const;
  }

  const previousOtp = await storage.getLatestPendingOtpByEmail(email);
  await storage.invalidatePendingOtpsByEmail(email);

  const expiresAt = new Date(Date.now() + getOtpTtlMs());

  let code = generateOtpCode();
  if (previousOtp) {
    for (let i = 0; i < 3; i += 1) {
      const hash = hashOtpCode(email, code);
      if (hash !== previousOtp.codeHash) break;
      code = generateOtpCode();
    }
  }

  const codeHash = hashOtpCode(email, code);
  await storage.createOtpCode({ email, codeHash, expiresAt });
  await storage.createOtpCode({ email: `${email}|${requestIp}`, codeHash, expiresAt });

  const delivery = await sendOtpEmail(email, code, expiresAt);

  return {
    ok: true,
    expiresAt: expiresAt.toISOString(),
    delivery,
  } as const;
}

export async function verifyOtp(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const otp = await storage.getLatestPendingOtpByEmail(email);

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    if (otp) await storage.markOtpAsUsed(otp.id);
    return { error: "OTP expired or not found", status: 400 } as const;
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await storage.markOtpAsUsed(otp.id);
    return { error: "OTP attempts exceeded", status: 429 } as const;
  }

  const codeHash = hashOtpCode(email, code.trim());
  if (otp.codeHash !== codeHash) {
    const updatedOtp = await storage.incrementOtpAttempts(otp.id);
    if ((updatedOtp?.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await storage.markOtpAsUsed(otp.id);
      return { error: "OTP attempts exceeded", status: 429 } as const;
    }
    return { error: "Invalid OTP code", status: 400 } as const;
  }

  await storage.markOtpAsUsed(otp.id);

  let user = await storage.getUserByEmail(email);
  if (!user) {
    user = await storage.createUser({
      email,
      username: email,
      displayName: null,
      verified: "true",
    });
  } else if (user.verified !== "true") {
    user = await storage.updateUser(user.id, { verified: "true" });
  }

  const token = signToken(user.id);
  return { token, user } as const;
}

export async function getUserFromToken(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const payload = verifyJwt(token);
  if (!payload?.sub) return null;
  return await storage.getUser(payload.sub);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getUserFromToken(req.header("authorization") ?? undefined);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  (req as Request & { authUser?: Awaited<ReturnType<typeof storage.getUser>> }).authUser = user;
  next();
}

export function getAuthUser(req: Request) {
  return (req as Request & { authUser?: Awaited<ReturnType<typeof storage.getUser>> }).authUser;
}
