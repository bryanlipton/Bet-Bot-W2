import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, real, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for secure authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for secure user management
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(), // Replit user ID
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Baseball-specific tables for AI training
export const baseballGames = pgTable("baseball_games", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  date: text("date").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  inning: integer("inning"),
  gameStatus: text("game_status").notNull().default("scheduled"),
  weather: text("weather"),
  temperature: integer("temperature"),
  windSpeed: integer("wind_speed"),
  windDirection: text("wind_direction"),
  humidity: integer("humidity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const baseballPlayerStats = pgTable("baseball_player_stats", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  playerName: text("player_name").notNull(),
  team: text("team").notNull(),
  position: text("position").notNull(),
  // Batting stats
  battingAverage: real("batting_average"),
  onBasePercentage: real("on_base_percentage"),
  sluggingPercentage: real("slugging_percentage"),
  homeRuns: integer("home_runs"),
  rbis: integer("rbis"),
  runs: integer("runs"),
  hits: integer("hits"),
  atBats: integer("at_bats"),
  // Pitching stats
  era: real("era"),
  whip: real("whip"),
  strikeouts: integer("strikeouts"),
  walks: integer("walks"),
  wins: integer("wins"),
  losses: integer("losses"),
  saves: integer("saves"),
  inningsPitched: real("innings_pitched"),
  // Date for historical tracking
  seasonYear: integer("season_year").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const baseballGamePredictions = pgTable("baseball_game_predictions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => baseballGames.id),
  homeWinProbability: real("home_win_probability").notNull(),
  awayWinProbability: real("away_win_probability").notNull(),
  overProbability: real("over_probability").notNull(),
  underProbability: real("under_probability").notNull(),
  predictedTotal: real("predicted_total").notNull(),
  homeSpreadProbability: real("home_spread_probability").notNull(),
  awaySpreadProbability: real("away_spread_probability").notNull(),
  confidence: real("confidence").notNull(),
  modelVersion: text("model_version").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const baseballModelTraining = pgTable("baseball_model_training", {
  id: serial("id").primaryKey(),
  modelVersion: text("model_version").notNull(),
  trainingDataSize: integer("training_data_size").notNull(),
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  f1Score: real("f1_score").notNull(),
  trainedAt: timestamp("trained_at").defaultNow(),
  features: text("features").array(), // JSON array of feature names
  hyperparameters: text("hyperparameters"), // JSON string
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const upsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true });
export const insertOddsSchema = createInsertSchema(odds).omit({ id: true });
export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertModelMetricsSchema = createInsertSchema(modelMetrics).omit({ id: true });

// Baseball-specific insert schemas
export const insertBaseballGameSchema = createInsertSchema(baseballGames).omit({ id: true, createdAt: true });
export const insertBaseballPlayerStatsSchema = createInsertSchema(baseballPlayerStats).omit({ id: true, lastUpdated: true });
export const insertBaseballGamePredictionSchema = createInsertSchema(baseballGamePredictions).omit({ id: true, createdAt: true });
export const insertBaseballModelTrainingSchema = createInsertSchema(baseballModelTraining).omit({ id: true, trainedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
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

// Baseball-specific types
export type BaseballGame = typeof baseballGames.$inferSelect;
export type InsertBaseballGame = z.infer<typeof insertBaseballGameSchema>;
export type BaseballPlayerStats = typeof baseballPlayerStats.$inferSelect;
export type InsertBaseballPlayerStats = z.infer<typeof insertBaseballPlayerStatsSchema>;
export type BaseballGamePrediction = typeof baseballGamePredictions.$inferSelect;
export type InsertBaseballGamePrediction = z.infer<typeof insertBaseballGamePredictionSchema>;
export type BaseballModelTraining = typeof baseballModelTraining.$inferSelect;
export type InsertBaseballModelTraining = z.infer<typeof insertBaseballModelTrainingSchema>;
