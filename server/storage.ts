import { db } from "./db";
import {
  pets, likes, matches, messages, reports, otpCodes, adoptionPosts,
  type Pet, type InsertPet,
  type Match, type Message, type InsertMessage, type Report, type OtpCode, type AdoptionPost, type InsertAdoptionPost
} from "@shared/schema";
import { users, type User, type UpsertUser } from "@shared/models/auth";
import { eq, or, and, desc, isNull, gte, sql, ne, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;

  // Pets
  getPet(id: number): Promise<Pet | undefined>;
  getPets(filters?: {
    species?: string;
    breed?: string;
    gender?: Pet["gender"];
    objective?: Pet["objective"];
    size?: Pet["size"];
    region?: string;
    isDonation?: boolean;
    ownerId?: string; // For "My Pets" - changed to string
    excludeOwnerId?: string;
    limit?: number;
    page?: number;
  }): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet>;
  getMyActivePet(ownerId: string): Promise<Pet | null>;
  setActivePet(ownerId: string, petId: number): Promise<Pet>;
  deletePet(id: number): Promise<void>;

  // Likes & Matches
  createLike(likerPetId: number, targetPetId: number): Promise<{ like: { id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }; isMatch: boolean; match?: Match }>;
  getMatches(petId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  getReceivedLikes(targetPetId: number): Promise<Array<{ id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }>>;
  hasLike(likerPetId: number, targetPetId: number): Promise<boolean>;
  findMatchBetweenPets(petAId: number, petBId: number): Promise<Match | undefined>;

  // Messages
  getMessages(matchId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Reports
  createReport(report: { reporterId: string; targetPetId: number; reason: string }): Promise<Report>;

  // Adoptions
  getAdoptionPost(id: number): Promise<AdoptionPost | undefined>;
  getAdoptionPosts(page: number, limit: number): Promise<AdoptionPost[]>;
  createAdoptionPost(post: InsertAdoptionPost): Promise<AdoptionPost>;
  updateAdoptionPost(id: number, post: Partial<InsertAdoptionPost>): Promise<AdoptionPost>;

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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
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
    size?: Pet["size"];
    region?: string;
    isDonation?: boolean;
    ownerId?: string;
    excludeOwnerId?: string;
    limit?: number;
    page?: number;
  }): Promise<Pet[]> {
    const conditions = [];
    if (filters?.species) conditions.push(eq(pets.species, filters.species));
    if (filters?.breed) conditions.push(eq(pets.breed, filters.breed));
    if (filters?.gender) conditions.push(eq(pets.gender, filters.gender)); // Type cast if needed
    if (filters?.objective) conditions.push(eq(pets.objective, filters.objective));
    if (filters?.size) conditions.push(eq(pets.size, filters.size));
    if (filters?.region) conditions.push(eq(pets.region, filters.region));
    if (filters?.isDonation !== undefined) conditions.push(eq(pets.isDonation, filters.isDonation));
    if (filters?.ownerId) conditions.push(eq(pets.ownerId, filters.ownerId));
    if (filters?.excludeOwnerId) conditions.push(ne(pets.ownerId, filters.excludeOwnerId));

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters?.limit ?? 20));
    const offset = (page - 1) * limit;

    return await db.select().from(pets).where(and(...conditions)).orderBy(desc(pets.createdAt)).limit(limit).offset(offset);
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    return await db.transaction(async (tx) => {
      const ownerPets = await tx.select({ id: pets.id }).from(pets).where(eq(pets.ownerId, insertPet.ownerId)).limit(1);
      const [pet] = await tx.insert(pets).values({ ...insertPet, isActive: ownerPets.length === 0 }).returning();
      return pet;
    });
  }

  async getMyActivePet(ownerId: string): Promise<Pet | null> {
    const [activePet] = await db.select().from(pets).where(and(eq(pets.ownerId, ownerId), eq(pets.isActive, true))).limit(1);
    if (activePet) return activePet;

    const [firstPet] = await db.select().from(pets).where(eq(pets.ownerId, ownerId)).orderBy(asc(pets.id)).limit(1);
    if (!firstPet) return null;

    await db.update(pets).set({ isActive: false }).where(eq(pets.ownerId, ownerId));
    const [selected] = await db.update(pets).set({ isActive: true }).where(eq(pets.id, firstPet.id)).returning();
    return selected ?? firstPet;
  }

  async setActivePet(ownerId: string, petId: number): Promise<Pet> {
    return await db.transaction(async (tx) => {
      const [ownedPet] = await tx.select().from(pets).where(and(eq(pets.id, petId), eq(pets.ownerId, ownerId))).limit(1);
      if (!ownedPet) {
        throw new Error("PET_NOT_FOUND_OR_NOT_OWNED");
      }

      await tx.update(pets).set({ isActive: false }).where(eq(pets.ownerId, ownerId));
      const [selected] = await tx.update(pets).set({ isActive: true }).where(eq(pets.id, petId)).returning();
      if (!selected) throw new Error("PET_NOT_FOUND_OR_NOT_OWNED");
      return selected;
    });
  }

  async updatePet(id: number, updates: Partial<InsertPet>): Promise<Pet> {
    const [pet] = await db.update(pets).set(updates).where(eq(pets.id, id)).returning();
    return pet;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async createLike(likerPetId: number, targetPetId: number): Promise<{ like: { id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }; isMatch: boolean; match?: Match }> {
    const petLowId = Math.min(likerPetId, targetPetId);
    const petHighId = Math.max(likerPetId, targetPetId);

    const [existingLike] = await db.select().from(likes).where(and(
      eq(likes.likerPetId, likerPetId),
      eq(likes.targetPetId, targetPetId),
    ));

    if (existingLike) {
      const [existingMatch] = await db.select().from(matches).where(and(
        eq(matches.petLowId, petLowId),
        eq(matches.petHighId, petHighId),
      ));
      return { like: existingLike, isMatch: !!existingMatch, match: existingMatch };
    }

    const [like] = await db.insert(likes).values({ likerPetId, targetPetId }).returning();

    const [reciprocal] = await db.select().from(likes).where(and(
      eq(likes.likerPetId, targetPetId),
      eq(likes.targetPetId, likerPetId)
    ));

    if (reciprocal) {
      await db.insert(matches).values({
        petAId: likerPetId,
        petBId: targetPetId,
        petLowId,
        petHighId,
      }).onConflictDoNothing({ target: [matches.petLowId, matches.petHighId] });

      const [match] = await db.select().from(matches).where(and(
        eq(matches.petLowId, petLowId),
        eq(matches.petHighId, petHighId),
      ));
      return { like, isMatch: true, match };
    }

    return { like, isMatch: false };
  }


  async getReceivedLikes(targetPetId: number): Promise<Array<{ id: number; likerPetId: number; targetPetId: number; createdAt: Date | null }>> {
    return db.select().from(likes).where(eq(likes.targetPetId, targetPetId)).orderBy(desc(likes.createdAt));
  }

  async hasLike(likerPetId: number, targetPetId: number): Promise<boolean> {
    const [row] = await db.select({ id: likes.id }).from(likes).where(and(eq(likes.likerPetId, likerPetId), eq(likes.targetPetId, targetPetId))).limit(1);
    return !!row;
  }

  async findMatchBetweenPets(petAId: number, petBId: number): Promise<Match | undefined> {
    const petLowId = Math.min(petAId, petBId);
    const petHighId = Math.max(petAId, petBId);
    const [row] = await db.select().from(matches).where(and(eq(matches.petLowId, petLowId), eq(matches.petHighId, petHighId))).limit(1);
    return row;
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


  async getAdoptionPost(id: number): Promise<AdoptionPost | undefined> {
    const [post] = await db.select().from(adoptionPosts).where(eq(adoptionPosts.id, id));
    return post;
  }

  async getAdoptionPosts(page: number, limit: number): Promise<AdoptionPost[]> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    return db.select().from(adoptionPosts).orderBy(desc(adoptionPosts.createdAt)).limit(safeLimit).offset((safePage - 1) * safeLimit);
  }

  async createAdoptionPost(post: InsertAdoptionPost): Promise<AdoptionPost> {
    const [created] = await db.insert(adoptionPosts).values(post).returning();
    return created;
  }

  async updateAdoptionPost(id: number, post: Partial<InsertAdoptionPost>): Promise<AdoptionPost> {
    const [updated] = await db.update(adoptionPosts).set(post).where(eq(adoptionPosts.id, id)).returning();
    return updated;
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
