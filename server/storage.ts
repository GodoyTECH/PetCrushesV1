import { db } from "./db";
import {
  pets, likes, matches, messages, reports,
  type Pet, type InsertPet,
  type Match, type Message, type InsertMessage, type Report
} from "@shared/schema";
import { users, type User, type UpsertUser } from "@shared/models/auth";
import { eq, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // Replit ID
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: Replit Auth doesn't have a 'username' column in the default blueprint users table
    // It has email, firstName, lastName, etc.
    // If you need username lookup, ensure your blueprint/schema supports it or map to email/id.
    // Assuming 'email' or 'id' for now based on the provided blueprint.
    // If you extended the table with 'username', fine.
    // The previous schema I generated had 'username', but the blueprint overwrote it likely.
    // I see in shared/models/auth.ts I added 'username'.
    const [user] = await db.select().from(users).where(eq(users.username, username));
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
}

export const storage = new DatabaseStorage();
