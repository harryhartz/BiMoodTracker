import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  timeOfDay: text("time_of_day").notNull(), // 'morning' | 'evening'
  mood: text("mood").notNull(),
  intensity: integer("intensity").notNull(), // 1-5
  sleepQuality: integer("sleep_quality"), // 1-5
  weight: real("weight"),
  weightUnit: text("weight_unit").default("kg"),
  medicationTaken: boolean("medication_taken").default(false),
  energyLevel: integer("energy_level"), // 1-5 for evening entries
  reflectiveComment: text("reflective_comment"),
  overallDaySummary: text("overall_day_summary"),
  cravingsImpulses: boolean("cravings_impulses").default(false),
  cravingsTags: text("cravings_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const triggerEvents = pgTable("trigger_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventSituation: text("event_situation").notNull(),
  emotion: text("emotion").notNull(),
  actionTaken: text("action_taken").notNull(),
  consequence: text("consequence").notNull(),
  remindLater: boolean("remind_later").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const thoughts = pgTable("thoughts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  moodTags: text("mood_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage"),
  schedule: text("schedule"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.number(),
  date: z.string(),
  timeOfDay: z.enum(['morning', 'evening']),
  mood: z.string().min(1),
  intensity: z.number().min(1).max(5),
  sleepQuality: z.number().min(1).max(5).optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  medicationTaken: z.boolean().default(false),
  energyLevel: z.number().min(1).max(5).optional(),
  reflectiveComment: z.string().optional(),
  overallDaySummary: z.string().optional(),
  cravingsImpulses: z.boolean().default(false),
  cravingsTags: z.array(z.string()).optional(),
});

export const insertTriggerEventSchema = createInsertSchema(triggerEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.number(),
  eventSituation: z.string().min(1),
  emotion: z.string().min(1),
  actionTaken: z.string().min(1),
  consequence: z.string().min(1),
  remindLater: z.boolean().default(false),
});

export const insertThoughtSchema = createInsertSchema(thoughts).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.number(),
  content: z.string().min(1),
  moodTags: z.array(z.string()).optional(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.number(),
  name: z.string().min(1),
  dosage: z.string().optional(),
  schedule: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type TriggerEvent = typeof triggerEvents.$inferSelect;
export type InsertTriggerEvent = z.infer<typeof insertTriggerEventSchema>;
export type Thought = typeof thoughts.$inferSelect;
export type InsertThought = z.infer<typeof insertThoughtSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
