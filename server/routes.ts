import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  insertMoodEntrySchema, insertTriggerEventSchema, 
  insertThoughtSchema, insertMedicationSchema,
  insertUserSchema, loginSchema
} from "@shared/schema";
import { z } from "zod";
import { authMiddleware, generateToken } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        token
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          }))
        });
      } else {
        res.status(400).json({ message: error.message || "Failed to create account" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        token
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          }))
        });
      } else {
        res.status(400).json({ message: error.message || "Failed to sign in" });
      }
    }
  });

  // Apply authMiddleware to all protected routes
  app.use("/api/mood-entries", authMiddleware);
  app.use("/api/trigger-events", authMiddleware);
  app.use("/api/thoughts", authMiddleware);
  app.use("/api/medications", authMiddleware);

  // Mood entries routes - now properly secured by user
  app.get("/api/mood-entries", async (req, res) => {
    try {
      const userId = req.userId!;
      const { date, startDate, endDate } = req.query;
      
      let entries;
      if (startDate && endDate) {
        entries = await storage.getMoodEntriesByDateRange(
          userId, 
          startDate as string, 
          endDate as string
        );
      } else {
        entries = await storage.getMoodEntries(userId, date as string);
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ 
        message: "Failed to fetch mood entries",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  app.post("/api/mood-entries", async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: req.userId
      });
      
      const entry = await storage.createMoodEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          }))
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create mood entry",
          error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
      }
    }
  });

  app.put("/api/mood-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMoodEntrySchema.partial().parse(req.body);
      
      const entry = await storage.updateMoodEntry(id, validatedData);
      if (!entry) {
        res.status(404).json({ message: "Mood entry not found" });
        return;
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update mood entry" });
      }
    }
  });

  app.delete("/api/mood-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMoodEntry(id, DEMO_USER_ID);
      
      if (!success) {
        res.status(404).json({ message: "Mood entry not found" });
        return;
      }
      
      res.json({ message: "Mood entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mood entry" });
    }
  });

  // Trigger events routes
  app.get("/api/trigger-events", async (req, res) => {
    try {
      const events = await storage.getTriggerEvents(DEMO_USER_ID);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trigger events" });
    }
  });

  app.post("/api/trigger-events", async (req, res) => {
    try {
      const validatedData = insertTriggerEventSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const event = await storage.createTriggerEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create trigger event" });
      }
    }
  });

  app.put("/api/trigger-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTriggerEventSchema.partial().parse(req.body);
      
      const event = await storage.updateTriggerEvent(id, validatedData);
      if (!event) {
        res.status(404).json({ message: "Trigger event not found" });
        return;
      }
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update trigger event" });
      }
    }
  });

  app.delete("/api/trigger-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTriggerEvent(id, DEMO_USER_ID);
      
      if (!success) {
        res.status(404).json({ message: "Trigger event not found" });
        return;
      }
      
      res.json({ message: "Trigger event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trigger event" });
    }
  });

  // Thoughts routes
  app.get("/api/thoughts", async (req, res) => {
    try {
      const thoughts = await storage.getThoughts(DEMO_USER_ID);
      res.json(thoughts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch thoughts" });
    }
  });

  app.post("/api/thoughts", async (req, res) => {
    try {
      const validatedData = insertThoughtSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const thought = await storage.createThought(validatedData);
      res.json(thought);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create thought" });
      }
    }
  });

  app.put("/api/thoughts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertThoughtSchema.partial().parse(req.body);
      
      const thought = await storage.updateThought(id, validatedData);
      if (!thought) {
        res.status(404).json({ message: "Thought not found" });
        return;
      }
      
      res.json(thought);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update thought" });
      }
    }
  });

  app.delete("/api/thoughts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteThought(id, DEMO_USER_ID);
      
      if (!success) {
        res.status(404).json({ message: "Thought not found" });
        return;
      }
      
      res.json({ message: "Thought deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete thought" });
    }
  });

  // Medications routes
  app.get("/api/medications", async (req, res) => {
    try {
      const medications = await storage.getMedications(DEMO_USER_ID);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const medication = await storage.createMedication(validatedData);
      res.json(medication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create medication" });
      }
    }
  });

  return httpServer;
}
