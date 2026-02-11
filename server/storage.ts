import { db } from "./db";
import {
  pets, likes, matches, messages, reports, otpCodes,
  type Pet, type InsertPet,
  type Match, type Message, type InsertMessage, type Report, type OtpCode
} from "@shared/schema";
import { users, type User, type UpsertUser } from "@shared/models/auth";
import { eq, or, and, desc, isNull, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;

  // Pets
  getPet(id: number): Promise<Pet | undefined>;
  getPets(filters?: {
    species?: string;
    breed?: string;
    gender?: Pet["gender"];
    objective?: Pet["objective"];
    region?: string;
    isDonation?: boolean;
    ownerId?: string; // For "My Pets" - changed to string
  }): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet>;
  deletePet(id: number): Promise<void>;

  // Likes & Matches
  createLike(likerPetId: number, targetPetId: number): Promise<{ like: { id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }; isMatch: boolean; match?: Match }>;
  getMatches(petId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;

  // Messages
  getMessages(matchId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Reports
  createReport(report: { reporterId: string; targetPetId: number; reason: string }): Promise<Report>;

  // OTP
  invalidatePendingOtpsByEmail(email: string): Promise<void>;
  createOtpCode(data: { email: string; codeHash: string; expiresAt: Date }): Promise<OtpCode>;
  getLatestPendingOtpByEmail(email: string): Promise<OtpCode | undefined>;
  incrementOtpAttempts(id: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  countRecentOtpRequests(email: string, from: Date): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
      const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return user;
  }

  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async getPets(filters?: {
    species?: string;
    breed?: string;
    gender?: Pet["gender"];
    objective?: Pet["objective"];
    region?: string;
    isDonation?: boolean;
    ownerId?: string;
  }): Promise<Pet[]> {
    const conditions = [];
    if (filters?.species) conditions.push(eq(pets.species, filters.species));
    if (filters?.breed) conditions.push(eq(pets.breed, filters.breed));
    if (filters?.gender) conditions.push(eq(pets.gender, filters.gender)); // Type cast if needed
    if (filters?.objective) conditions.push(eq(pets.objective, filters.objective));
    if (filters?.region) conditions.push(eq(pets.region, filters.region));
    if (filters?.isDonation !== undefined) conditions.push(eq(pets.isDonation, filters.isDonation));
    if (filters?.ownerId) conditions.push(eq(pets.ownerId, filters.ownerId));

    return await db.select().from(pets).where(and(...conditions)).orderBy(desc(pets.createdAt));
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const [pet] = await db.insert(pets).values(insertPet).returning();
    return pet;
  }

  async updatePet(id: number, updates: Partial<InsertPet>): Promise<Pet> {
    const [pet] = await db.update(pets).set(updates).where(eq(pets.id, id)).returning();
    return pet;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async createLike(likerPetId: number, targetPetId: number): Promise<{ like: { id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }; isMatch: boolean; match?: Match }> {
    const [existingLike] = await db.select().from(likes).where(and(
      eq(likes.likerPetId, likerPetId),
      eq(likes.targetPetId, targetPetId),
    ));

    if (existingLike) {
      const [existingMatch] = await db.select().from(matches).where(or(
        and(eq(matches.petAId, likerPetId), eq(matches.petBId, targetPetId)),
        and(eq(matches.petAId, targetPetId), eq(matches.petBId, likerPetId)),
      ));
      return { like: existingLike, isMatch: !!existingMatch, match: existingMatch };
    }

    // 1. Create Like
    const [like] = await db.insert(likes).values({ likerPetId, targetPetId }).returning();

    // 2. Check Reciprocity (Does target already like liker?)
    const [reciprocal] = await db.select().from(likes).where(and(
      eq(likes.likerPetId, targetPetId),
      eq(likes.targetPetId, likerPetId)
    ));

    if (reciprocal) {
      // 3. Create Match
      const [match] = await db.insert(matches).values({
        petAId: likerPetId,
        petBId: targetPetId,
      }).returning();
      return { like, isMatch: true, match };
    }

    return { like, isMatch: false };
  }

  async getMatches(petId: number): Promise<Match[]> {
    return await db.select().from(matches).where(or(
      eq(matches.petAId, petId),
      eq(matches.petBId, petId)
    ));
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMessages(matchId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async createReport(report: { reporterId: string; targetPetId: number; reason: string }): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async invalidatePendingOtpsByEmail(email: string): Promise<void> {
    await db.update(otpCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(otpCodes.email, email), isNull(otpCodes.usedAt)));
  }

  async createOtpCode(data: { email: string; codeHash: string; expiresAt: Date }): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values(data).returning();
    return otp;
  }

  async getLatestPendingOtpByEmail(email: string): Promise<OtpCode | undefined> {
    const [otp] = await db.select().from(otpCodes)
      .where(and(eq(otpCodes.email, email), isNull(otpCodes.usedAt)))
      .orderBy(desc(otpCodes.createdAt));
    return otp;
  }

  async incrementOtpAttempts(id: string): Promise<OtpCode | undefined> {
    const [otp] = await db.update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, id))
      .returning();
    return otp;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otpCodes).set({ usedAt: new Date() }).where(eq(otpCodes.id, id));
  }

  async countRecentOtpRequests(email: string, from: Date): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), gte(otpCodes.createdAt, from)));
    return result[0]?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
