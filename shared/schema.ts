import { users } from "./models/auth";
export { users };
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Users table is imported from ./models/auth

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(), // Changed to varchar to match Replit Auth UUID
  displayName: text("display_name").notNull(),
  species: text("species").notNull(),
  breed: text("breed").notNull(),
  gender: text("gender", { enum: ["MALE", "FEMALE"] }).notNull(),
  size: text("size", { enum: ["SMALL", "MEDIUM", "LARGE"] }), // Optional depending on species
  colors: text("colors").array().notNull(), // Array of strings
  ageMonths: integer("age_months").notNull(),
  pedigree: boolean("pedigree").notNull().default(false),
  vaccinated: boolean("vaccinated").default(false),
  neutered: boolean("neutered").default(false),
  healthNotes: text("health_notes"),
  objective: text("objective", { enum: ["BREEDING", "COMPANIONSHIP", "SOCIALIZATION"] }).notNull(),
  isDonation: boolean("is_donation").default(false),
  region: text("region").notNull(),
  about: text("about").notNull(),
  photos: text("photos").array().notNull(), // Array of URLs
  videoUrl: text("video_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  likerPetId: integer("liker_pet_id").references(() => pets.id).notNull(),
  targetPetId: integer("target_pet_id").references(() => pets.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  petAId: integer("pet_a_id").references(() => pets.id).notNull(),
  petBId: integer("pet_b_id").references(() => pets.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(), // Changed to varchar
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(), // Changed to varchar
  targetPetId: integer("target_pet_id").references(() => pets.id).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["PENDING", "RESOLVED", "DISMISSED"] }).default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  pets: many(pets),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  owner: one(users, {
    fields: [pets.ownerId],
    references: [users.id],
  }),
  likesGiven: many(likes, { relationName: "likesGiven" }),
  likesReceived: many(likes, { relationName: "likesReceived" }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  petA: one(pets, { fields: [matches.petAId], references: [pets.id] }),
  petB: one(pets, { fields: [matches.petBId], references: [pets.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, isAdmin: true });
export const insertPetSchema = createInsertSchema(pets).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, status: true });

// === EXPLICIT API TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;

export type Like = typeof likes.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Report = typeof reports.$inferSelect;

// API Requests
export type CreatePetRequest = InsertPet;
export type UpdatePetRequest = Partial<InsertPet>;
export type CreateLikeRequest = { likerPetId: number; targetPetId: number };
export type CreateReportRequest = { targetPetId: number; reason: string };

// API Responses
export type PetResponse = Pet & { owner?: User };
export type MatchResponse = Match & { petA: Pet; petB: Pet; lastMessage?: Message };

// Custom Validations
export const BLOCKED_KEYWORDS = [
  "R$", "$", "vendo", "venda", "valor", "preço", "preco", "pagamento", "pix",
  "cobro", "cobrando", "frete", "parcelado", "entrego", "aceito", "usd", "cash"
];
