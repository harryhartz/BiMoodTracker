import { 
  users, moodEntries, triggerEvents, thoughts, medications,
  type User, type InsertUser, type MoodEntry, type InsertMoodEntry,
  type TriggerEvent, type InsertTriggerEvent, type Thought, type InsertThought,
  type Medication, type InsertMedication
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private triggerEvents: Map<number, TriggerEvent>;
  private thoughts: Map<number, Thought>;
  private medications: Map<number, Medication>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.triggerEvents = new Map();
    this.thoughts = new Map();
    this.medications = new Map();
    this.currentId = 1;

    // Create a default user for demo purposes
    this.createUser({ username: "demo", password: "demo" });
  }



  private getNextId(): number {
    return this.currentId++;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Mood entry methods
  async getMoodEntries(userId: number, date?: string): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values()).filter(
      (entry) => entry.userId === userId && (!date || entry.date === date)
    );
    return entries.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getMoodEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values()).filter(
      (entry) => entry.userId === userId && entry.date >= startDate && entry.date <= endDate
    );
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.getNextId();
    const entry: MoodEntry = { 
      ...insertEntry, 
      id, 
      createdAt: new Date(),
      cravingsTags: insertEntry.cravingsTags || []
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async updateMoodEntry(id: number, updateData: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const entry = this.moodEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updateData };
    this.moodEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteMoodEntry(id: number, userId: number): Promise<boolean> {
    const entry = this.moodEntries.get(id);
    if (!entry || entry.userId !== userId) return false;
    
    return this.moodEntries.delete(id);
  }

  // Trigger event methods
  async getTriggerEvents(userId: number): Promise<TriggerEvent[]> {
    const events = Array.from(this.triggerEvents.values()).filter(
      (event) => event.userId === userId
    );
    return events.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTriggerEvent(insertEvent: InsertTriggerEvent): Promise<TriggerEvent> {
    const id = this.getNextId();
    const event: TriggerEvent = { 
      ...insertEvent, 
      id, 
      createdAt: new Date()
    };
    this.triggerEvents.set(id, event);
    return event;
  }

  async updateTriggerEvent(id: number, updateData: Partial<InsertTriggerEvent>): Promise<TriggerEvent | undefined> {
    const event = this.triggerEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updateData };
    this.triggerEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteTriggerEvent(id: number, userId: number): Promise<boolean> {
    const event = this.triggerEvents.get(id);
    if (!event || event.userId !== userId) return false;
    
    return this.triggerEvents.delete(id);
  }

  // Thought methods
  async getThoughts(userId: number): Promise<Thought[]> {
    const userThoughts = Array.from(this.thoughts.values()).filter(
      (thought) => thought.userId === userId
    );
    return userThoughts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createThought(insertThought: InsertThought): Promise<Thought> {
    const id = this.getNextId();
    const thought: Thought = { 
      ...insertThought, 
      id, 
      createdAt: new Date(),
      moodTags: insertThought.moodTags || []
    };
    this.thoughts.set(id, thought);
    return thought;
  }

  async updateThought(id: number, updateData: Partial<InsertThought>): Promise<Thought | undefined> {
    const thought = this.thoughts.get(id);
    if (!thought) return undefined;
    
    const updatedThought = { ...thought, ...updateData };
    this.thoughts.set(id, updatedThought);
    return updatedThought;
  }

  async deleteThought(id: number, userId: number): Promise<boolean> {
    const thought = this.thoughts.get(id);
    if (!thought || thought.userId !== userId) return false;
    
    return this.thoughts.delete(id);
  }

  // Medication methods
  async getMedications(userId: number): Promise<Medication[]> {
    const userMedications = Array.from(this.medications.values()).filter(
      (medication) => medication.userId === userId
    );
    return userMedications.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const id = this.getNextId();
    const medication: Medication = { 
      ...insertMedication, 
      id, 
      createdAt: new Date()
    };
    this.medications.set(id, medication);
    return medication;
  }

  async updateMedication(id: number, updateData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const medication = this.medications.get(id);
    if (!medication) return undefined;
    
    const updatedMedication = { ...medication, ...updateData };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }

  async deleteMedication(id: number, userId: number): Promise<boolean> {
    const medication = this.medications.get(id);
    if (!medication || medication.userId !== userId) return false;
    
    return this.medications.delete(id);
  }
}

export const storage = new MemStorage();
