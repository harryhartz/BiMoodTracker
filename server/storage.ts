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
    
    // Add sample data for insights
    this.addSampleData();
  }

  private addSampleData() {
    const today = new Date();
    const userId = 1;
    
    // Add mood entries for the past 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Morning entry
      const morningId = this.getNextId();
      const morningEntry = {
        id: morningId,
        userId,
        date: dateStr,
        timeOfDay: 'morning',
        mood: ['happy', 'calm', 'anxious', 'tired', 'content'][Math.floor(Math.random() * 5)],
        intensity: Math.floor(Math.random() * 3) + 3, // 3-5
        hoursSlept: 6 + Math.random() * 3, // 6-9 hours
        sleepQuality: null,
        weight: i === 0 ? 72.5 : null, // Only recent weight
        weightUnit: 'kg',
        morningMedication: Math.random() > 0.2, // 80% compliance
        eveningMedication: false,
        energyLevel: null,
        reflectiveComment: null,
        overallDaySummary: null,
        cravingsImpulses: false,
        cravingsTags: [],
        createdAt: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      };
      this.moodEntries.set(morningId, morningEntry);
      
      // Evening entry
      const eveningId = this.getNextId();
      const eveningEntry = {
        id: eveningId,
        userId,
        date: dateStr,
        timeOfDay: 'evening',
        mood: ['content', 'tired', 'frustrated', 'peaceful', 'hopeful'][Math.floor(Math.random() * 5)],
        intensity: Math.floor(Math.random() * 3) + 2, // 2-4
        hoursSlept: null,
        sleepQuality: Math.floor(Math.random() * 3) + 3, // 3-5
        weight: null,
        weightUnit: 'kg',
        morningMedication: false,
        eveningMedication: Math.random() > 0.15, // 85% compliance
        energyLevel: Math.floor(Math.random() * 4) + 2, // 2-5
        reflectiveComment: i < 5 ? 'Reflecting on the day...' : null,
        overallDaySummary: ['productive', 'challenging', 'peaceful', 'overwhelming'][Math.floor(Math.random() * 4)],
        cravingsImpulses: Math.random() > 0.8,
        cravingsTags: Math.random() > 0.8 ? ['sugar', 'caffeine'] : [],
        createdAt: new Date(date.getTime() + 20 * 60 * 60 * 1000), // 8 PM
      };
      this.moodEntries.set(eveningId, eveningEntry);
    }
    
    // Add trigger events
    const triggerEmotions = ['anger', 'anxiety', 'frustration', 'overwhelm', 'sadness'];
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - Math.floor(Math.random() * 14));
      
      const triggerId = this.getNextId();
      const trigger = {
        id: triggerId,
        userId,
        eventSituation: [
          'Work deadline stress',
          'Argument with family member',
          'Social gathering anxiety',
          'Financial concerns',
          'Health appointment',
          'Traffic jam delay',
          'Technology issues'
        ][Math.floor(Math.random() * 7)],
        emotion: triggerEmotions[Math.floor(Math.random() * triggerEmotions.length)],
        actionTaken: [
          'Deep breathing exercises',
          'Called a friend',
          'Went for a walk',
          'Listened to music',
          'Practiced meditation',
          'Wrote in journal'
        ][Math.floor(Math.random() * 6)],
        consequence: [
          'Felt much better afterward',
          'Situation resolved peacefully',
          'Gained new perspective',
          'Stress decreased significantly',
          'Found a solution'
        ][Math.floor(Math.random() * 5)],
        remindLater: Math.random() > 0.7,
        createdAt: date,
      };
      this.triggerEvents.set(triggerId, trigger);
    }
    
    // Add thoughts
    const thoughtContents = [
      'Today was challenging but I handled it well. Proud of my progress.',
      'Feeling grateful for the support system I have.',
      'Need to remember to take breaks more often during work.',
      'The morning routine really helps set a positive tone for the day.',
      'Noticed I feel better when I get enough sleep.',
      'Therapy techniques are becoming more natural to use.',
      'Looking forward to the weekend plans.',
    ];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - Math.floor(Math.random() * 10));
      
      const thoughtId = this.getNextId();
      const thought = {
        id: thoughtId,
        userId,
        content: thoughtContents[i],
        moodTags: i % 2 === 0 ? ['grateful', 'hopeful'] : ['reflective'],
        createdAt: date,
      };
      this.thoughts.set(thoughtId, thought);
    }
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
