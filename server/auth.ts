import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "./storage";

const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const OTP_MAX_ATTEMPTS = 5;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return secret;
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

export function signToken(userId: string) {
  const expiresInSeconds = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  return signJwt({ sub: userId, exp: expiresInSeconds });
}

export async function requestOtp(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const code = generateOtpCode();
  otpStore.set(email, { code, expiresAt: Date.now() + getOtpTtlMs(), attempts: 0 });
  if (process.env.NODE_ENV !== "production") console.log(`[auth] OTP for ${email}: ${code}`);
  return { ok: true };
}

export async function verifyOtp(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const otp = otpStore.get(email);
  if (!otp || otp.expiresAt < Date.now()) {
    otpStore.delete(email);
    return { error: "OTP expired or not found" } as const;
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(email);
    return { error: "OTP attempts exceeded" } as const;
  }
  if (otp.code !== code.trim()) {
    otp.attempts += 1;
    otpStore.set(email, otp);
    return { error: "Invalid OTP code" } as const;
  }

  otpStore.delete(email);
  let user = await storage.getUserByEmail(email);
  if (!user) {
    user = await storage.createUser({ email, username: email, displayName: email.split("@")[0] });
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
