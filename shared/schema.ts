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
  overallMoodIntensity: integer("overall_mood_intensity").notNull(), // -2 to +2
  hoursSlept: real("hours_slept"), // For morning entries
  sleepQuality: integer("sleep_quality"), // 0-4 for evening entries only
  weight: real("weight"),
  weightUnit: text("weight_unit").default("kg"),
  morningMedication: boolean("morning_medication").default(false),
  eveningMedication: boolean("evening_medication").default(false),
  energyLevel: integer("energy_level"), // 0-4 for evening entries
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
  emotions: text("emotions").array().notNull(),
  actionTaken: text("action_taken").notNull(),
  consequences: text("consequences").array().notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date"), // YYYY-MM-DD format, can be null for ongoing
  durationDays: integer("duration_days"), // auto-calculated
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
  overallMoodIntensity: z.number().min(-2).max(2),
  hoursSlept: z.number().positive().optional(),
  sleepQuality: z.number().min(0).max(4).optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  morningMedication: z.boolean().default(false),
  eveningMedication: z.boolean().default(false),
  energyLevel: z.number().min(0).max(4).optional(),
  reflectiveComment: z.string().optional(),
  overallDaySummary: z.string().optional(),
  cravingsImpulses: z.boolean().default(false),
  cravingsTags: z.array(z.string()).optional(),
});

export const insertTriggerEventSchema = createInsertSchema(triggerEvents).omit({
  id: true,
  createdAt: true,
  durationDays: true, // auto-calculated
}).extend({
  userId: z.number(),
  eventSituation: z.string().min(1),
  emotions: z.array(z.string()).min(1, "At least one emotion is required"),
  actionTaken: z.string().min(1),
  consequences: z.array(z.string()).min(1, "At least one consequence is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
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
