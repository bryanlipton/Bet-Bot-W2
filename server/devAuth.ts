import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Mock user for development
const mockUser = {
  id: "dev-user-1",
  email: "dev@example.com",
  firstName: "Dev",
  lastName: "User",
  profileImageUrl: null,
  googleId: "dev-user-1",
  createdAt: new Date(),
};

// Development authentication middleware
export const isDevAuthenticated: RequestHandler = async (req, res, next) => {
  // Always authenticated in development
  (req as any).user = {
    claims: {
      sub: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.firstName,
      last_name: mockUser.lastName,
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };
  
  // Ensure mock user exists in database
  try {
    await storage.upsertUser(mockUser);
  } catch (error) {
    console.log("Mock user already exists or created");
  }
  
  next();
};

export function setupDevAuth(app: Express) {
  console.log("🔧 Setting up development authentication (mock)");
  
  // Mock authentication endpoints for development
  app.get("/api/login", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/");
  });

  // Mock user endpoint
  app.get("/api/auth/user", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching mock user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

// Export the middleware for use in other routes
export const isAuthenticated = isDevAuthenticated;