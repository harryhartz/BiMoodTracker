import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  timeOfDay: text("time_of_day").notNull(), // 'morning' | 'evening'
  mood: text("mood").notNull(),
  overallMoodIntensity: integer("overall_mood_intensity").notNull(), // -3 to +3
  hoursSlept: real("hours_slept"), // For morning entries
  sleepQuality: integer("sleep_quality"), // 1-5 for evening entries only
  weight: real("weight"),
  weightUnit: text("weight_unit").default("kg"),
  morningMedication: boolean("morning_medication").default(false),
  eveningMedication: boolean("evening_medication").default(false),
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
  name: true,
  email: true,
  password: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
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
  hoursSlept: z.number().positive().optional(),
  sleepQuality: z.number().min(1).max(5).optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  morningMedication: z.boolean().default(false),
  eveningMedication: z.boolean().default(false),
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
