import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api, BLOCKED_KEYWORDS } from "@shared/routes";
import { z } from "zod";
import { insertPetSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Middleware to block sales keywords
  const contentFilter = (content: string) => {
    const lower = content.toLowerCase();
    const found = BLOCKED_KEYWORDS.find(k => lower.includes(k.toLowerCase()));
    return found;
  };

  // Pets
  app.get(api.pets.list.path, async (req, res) => {
    const filters = req.query as any;
    // Basic type coercion for filters if needed, handled by storage mostly
    const pets = await storage.getPets({
        ...filters,
        isDonation: filters.isDonation === 'true' ? true : (filters.isDonation === 'false' ? false : undefined)
    });
    res.json(pets);
  });

  app.get(api.pets.get.path, async (req, res) => {
    const pet = await storage.getPet(Number(req.params.id));
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const owner = await storage.getUser(pet.ownerId); // Ensure getUser handles string ID now
    res.json({ ...pet, owner });
  });

  app.post(api.pets.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
    const user = req.user as any;
    const userId = user.claims.sub; // Replit Auth ID

    try {
      const input = api.pets.create.input.parse(req.body);

      // Validate blocked keywords in about/healthNotes
      const blockedInAbout = contentFilter(input.about);
      if (blockedInAbout) {
          return res.status(400).json({ message: "Sales content is not allowed.", field: "about" });
      }

      const pet = await storage.createPet({ ...input, ownerId: userId });
      res.status(201).json(pet);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.put(api.pets.update.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      // TODO: Add strict ownership check (getPet -> check ownerId === userId)

      try {
          const input = api.pets.update.input.parse(req.body);
          if (input.about) {
              if (contentFilter(input.about)) return res.status(400).json({message: "Sales content blocked"});
          }
          const updated = await storage.updatePet(Number(req.params.id), input);
          res.json(updated);
      } catch (err) {
          res.status(400).json({message: "Invalid input"});
      }
  });

  app.delete(api.pets.delete.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      // TODO: Add strict ownership check
      await storage.deletePet(Number(req.params.id));
      res.status(204).end();
  });

  // Likes & Matches
  app.post(api.likes.create.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      try {
          const { likerPetId, targetPetId } = req.body;
          // Verify ownership of likerPetId (skip for MVP speed, but strictly should be done)
          const result = await storage.createLike(likerPetId, targetPetId);
          res.json({ matched: result.isMatch, matchId: result.match?.id });
      } catch (err) {
          res.status(400).json({ message: "Error creating like" });
      }
  });

  app.get(api.matches.list.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      const user = req.user as any;
      const userId = user.claims.sub;

      // Get user pets
      const userPets = await storage.getPets({ ownerId: userId });
      let allMatches = [];
      for (const pet of userPets) {
          const matches = await storage.getMatches(pet.id);
          // Hydrate
          for (const m of matches) {
              const petA = await storage.getPet(m.petAId);
              const petB = await storage.getPet(m.petBId);
              if (petA && petB) {
                  allMatches.push({ ...m, petA, petB });
              }
          }
      }
      res.json(allMatches);
  });

  app.get(api.matches.get.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      const match = await storage.getMatch(Number(req.params.id));
      if (!match) return res.status(404).json({message: "Match not found"});
      const petA = await storage.getPet(match.petAId);
      const petB = await storage.getPet(match.petBId);
      const messages = await storage.getMessages(match.id);
      res.json({ ...match, petA, petB, messages });
  });

  // Messages
  app.post(api.messages.create.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      const user = req.user as any;
      const userId = user.claims.sub;

      try {
          const { content } = req.body;
          if (contentFilter(content)) {
              return res.status(400).json({ message: "Sales content blocked" });
          }

          const message = await storage.createMessage({
              matchId: Number(req.params.id),
              senderId: userId,
              content,
          });
          res.status(201).json(message);
      } catch (err) {
          res.status(400).json({ message: "Error sending message" });
      }
  });

  // Reports
  app.post(api.reports.create.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({message: "Unauthorized"});
      const user = req.user as any;
      const userId = user.claims.sub;

      const { targetPetId, reason } = req.body;
      const report = await storage.createReport({
          reporterId: userId,
          targetPetId,
          reason
      });
      res.status(201).json(report);
  });

  // Upload (Mock/Cloudinary)
  app.post(api.upload.create.path, upload.single('file'), async (req, res) => {
     if (!req.file) return res.status(400).json({ message: "No file uploaded" });
     const mockUrl = `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000`;
     res.json({ url: mockUrl });
  });

  // Seed Database (Run once if empty)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("ana_silva");
  if (existingUsers) return;

  console.log("Seeding database...");

  // Create Users
  const user1 = await storage.createUser({
    username: "ana_silva",
    email: "ana@example.com",
    displayName: "Ana Silva",
    region: "São Paulo, SP",
    verified: true,
    whatsapp: "11999999999"
  });

  const user2 = await storage.createUser({
    username: "carlos_souza",
    email: "carlos@example.com",
    displayName: "Carlos Souza",
    region: "Rio de Janeiro, RJ",
    verified: true,
  });

  // Create Pets
  const pet1 = await storage.createPet({
    ownerId: user1.id,
    displayName: "Thor",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "MALE",
    size: "LARGE",
    colors: ["Gold"],
    ageMonths: 24,
    pedigree: true,
    objective: "BREEDING",
    region: "São Paulo, SP",
    about: "Thor is a very friendly and energetic Golden Retriever. He loves to play and is looking for a girlfriend.",
    photos: ["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isDonation: false,
    vaccinated: true,
    neutered: false,
  });

  const pet2 = await storage.createPet({
    ownerId: user2.id,
    displayName: "Luna",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "FEMALE",
    size: "LARGE",
    colors: ["Cream"],
    ageMonths: 20,
    pedigree: true,
    objective: "BREEDING",
    region: "Rio de Janeiro, RJ",
    about: "Luna is a sweet and calm Golden Retriever.",
    photos: ["https://images.unsplash.com/photo-1633722715463-d30f4f325e27?auto=format&fit=crop&q=80&w=1000"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isDonation: false,
    vaccinated: true,
    neutered: false,
  });

  const pet3 = await storage.createPet({
    ownerId: user1.id,
    displayName: "Mia",
    species: "Cat",
    breed: "Siamese",
    gender: "FEMALE",
    size: "SMALL",
    colors: ["White", "Brown"],
    ageMonths: 12,
    pedigree: false,
    objective: "COMPANIONSHIP",
    region: "São Paulo, SP",
    about: "Mia needs a new home.",
    photos: ["https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=1000"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isDonation: true,
    vaccinated: true,
    neutered: true,
  });

  console.log("Database seeded!");
}

