import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  sportKey: text("sport_key").notNull(),
  sportTitle: text("sport_title").notNull(),
  commenceTime: timestamp("commence_time").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const odds = pgTable("odds", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  bookmaker: text("bookmaker").notNull(),
  market: text("market").notNull(), // h2h, spreads, totals
  outcomes: json("outcomes").notNull(), // JSON array of outcome objects
  lastUpdate: timestamp("last_update").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  market: text("market").notNull(),
  bet: text("bet").notNull(),
  edge: decimal("edge", { precision: 5, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  modelProbability: decimal("model_probability", { precision: 5, scale: 2 }).notNull(),
  impliedProbability: decimal("implied_probability", { precision: 5, scale: 2 }).notNull(),
  bestOdds: text("best_odds").notNull(),
  bookmaker: text("bookmaker").notNull(),
  status: text("status").notNull().default("active"), // active, expired, won, lost
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  metadata: json("metadata"), // For storing additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  sportKey: text("sport_key").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).notNull(),
  edgeDetectionRate: decimal("edge_detection_rate", { precision: 5, scale: 2 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(),
  gamesAnalyzed: integer("games_analyzed").notNull(),
  lastUpdate: timestamp("last_update").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true });
export const insertOddsSchema = createInsertSchema(odds).omit({ id: true });
export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertModelMetricsSchema = createInsertSchema(modelMetrics).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Odds = typeof odds.$inferSelect;
export type InsertOdds = z.infer<typeof insertOddsSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ModelMetrics = typeof modelMetrics.$inferSelect;
export type InsertModelMetrics = z.infer<typeof insertModelMetricsSchema>;
