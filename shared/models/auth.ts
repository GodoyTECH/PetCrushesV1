import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session table (legacy).
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(), // Added missing field
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Additional fields for PetCrushes
  displayName: varchar("display_name"),
  whatsapp: varchar("whatsapp"),
  region: varchar("region"),
  verified: varchar("verified"),
  isAdmin: varchar("is_admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
