// Authentication adapter that provides the correct middleware based on environment
import type { RequestHandler } from "express";

let authMiddleware: RequestHandler;

// Export the middleware that will be set up during initialization
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!authMiddleware) {
    return res.status(500).json({ message: "Authentication not initialized" });
  }
  return authMiddleware(req, res, next);
};

// Initialize authentication based on environment
export function initializeAuth(middleware: RequestHandler) {
  authMiddleware = middleware;
}