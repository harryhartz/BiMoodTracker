import { 
  users, moodEntries, triggerEvents, thoughts, medications,
  type User, type InsertUser, type MoodEntry, type InsertMoodEntry,
  type TriggerEvent, type InsertTriggerEvent, type Thought, type InsertThought,
  type Medication, type InsertMedication
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mood entry methods
  getMoodEntries(userId: number, date?: string): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  updateMoodEntry(id: number, entry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;
  deleteMoodEntry(id: number, userId: number): Promise<boolean>;

  // Trigger event methods
  getTriggerEvents(userId: number): Promise<TriggerEvent[]>;
  createTriggerEvent(event: InsertTriggerEvent): Promise<TriggerEvent>;
  updateTriggerEvent(id: number, event: Partial<InsertTriggerEvent>): Promise<TriggerEvent | undefined>;
  deleteTriggerEvent(id: number, userId: number): Promise<boolean>;

  // Thought methods
  getThoughts(userId: number): Promise<Thought[]>;
  createThought(thought: InsertThought): Promise<Thought>;
  updateThought(id: number, thought: Partial<InsertThought>): Promise<Thought | undefined>;
  deleteThought(id: number, userId: number): Promise<boolean>;

  // Medication methods
  getMedications(userId: number): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number, userId: number): Promise<boolean>;
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Mood entry methods
  async getMoodEntries(userId: number, date?: string): Promise<MoodEntry[]> {
    if (date) {
      const entries = await db
        .select()
        .from(moodEntries)
        .where(and(eq(moodEntries.userId, userId), eq(moodEntries.date, date)))
        .orderBy(desc(moodEntries.createdAt));
      return entries;
    } else {
      const entries = await db
        .select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId))
        .orderBy(desc(moodEntries.createdAt));
      return entries;
    }
  }

  async getMoodEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<MoodEntry[]> {
    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.date, startDate),
          lte(moodEntries.date, endDate)
        )
      )
      .orderBy(desc(moodEntries.createdAt));
    return entries;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db
      .insert(moodEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateMoodEntry(id: number, updateData: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .update(moodEntries)
      .set(updateData)
      .where(eq(moodEntries.id, id))
      .returning();
    return entry || undefined;
  }

  async deleteMoodEntry(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(moodEntries)
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Trigger event methods
  async getTriggerEvents(userId: number): Promise<TriggerEvent[]> {
    const events = await db
      .select()
      .from(triggerEvents)
      .where(eq(triggerEvents.userId, userId))
      .orderBy(desc(triggerEvents.createdAt));
    return events;
  }

  async createTriggerEvent(insertEvent: InsertTriggerEvent): Promise<TriggerEvent> {
    // Calculate duration if both start and end dates are provided
    let durationDays = null;
    if (insertEvent.startDate && insertEvent.endDate) {
      const start = new Date(insertEvent.startDate);
      const end = new Date(insertEvent.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const [event] = await db
      .insert(triggerEvents)
      .values({
        ...insertEvent,
        durationDays
      })
      .returning();
    return event;
  }

  async updateTriggerEvent(id: number, updateData: Partial<InsertTriggerEvent>): Promise<TriggerEvent | undefined> {
    const [event] = await db
      .update(triggerEvents)
      .set(updateData)
      .where(eq(triggerEvents.id, id))
      .returning();
    return event || undefined;
  }

  async deleteTriggerEvent(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(triggerEvents)
      .where(and(eq(triggerEvents.id, id), eq(triggerEvents.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Thought methods
  async getThoughts(userId: number): Promise<Thought[]> {
    const thoughtList = await db
      .select()
      .from(thoughts)
      .where(eq(thoughts.userId, userId))
      .orderBy(desc(thoughts.createdAt));
    return thoughtList;
  }

  async createThought(insertThought: InsertThought): Promise<Thought> {
    const [thought] = await db
      .insert(thoughts)
      .values(insertThought)
      .returning();
    return thought;
  }

  async updateThought(id: number, updateData: Partial<InsertThought>): Promise<Thought | undefined> {
    const [thought] = await db
      .update(thoughts)
      .set(updateData)
      .where(eq(thoughts.id, id))
      .returning();
    return thought || undefined;
  }

  async deleteThought(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(thoughts)
      .where(and(eq(thoughts.id, id), eq(thoughts.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Medication methods
  async getMedications(userId: number): Promise<Medication[]> {
    const medicationList = await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.createdAt));
    return medicationList;
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const [medication] = await db
      .insert(medications)
      .values(insertMedication)
      .returning();
    return medication;
  }

  async updateMedication(id: number, updateData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [medication] = await db
      .update(medications)
      .set(updateData)
      .where(eq(medications.id, id))
      .returning();
    return medication || undefined;
  }

  async deleteMedication(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(medications)
      .where(and(eq(medications.id, id), eq(medications.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();