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
  id: text("id").primaryKey().notNull(), // Replit user ID (sub claim)
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  googleId: text("google_id").unique(), // For backwards compatibility
  // Stripe subscription fields
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, canceled, past_due
  subscriptionPlan: text("subscription_plan").default("free"), // free, monthly, annual
  subscriptionEndsAt: timestamp("subscription_ends_at"),
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
  // Umpire data
  homeUmpireName: text("home_umpire_name"),
  homeUmpireId: text("home_umpire_id"),
  umpireStrikeZoneAccuracy: real("umpire_strike_zone_accuracy"),
  umpireConsistencyRating: real("umpire_consistency_rating"),
  umpireHitterFriendly: real("umpire_hitter_friendly"), // Percentage tendency
  umpirePitcherFriendly: real("umpire_pitcher_friendly"), // Percentage tendency
  umpireRunsImpact: real("umpire_runs_impact"), // Historical runs affected per game
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

// Training data tracking - stores all inputs and actual results for continuous learning
export const baseballTrainingData = pgTable("baseball_training_data", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => baseballGames.id).notNull(),
  // All input features used for prediction
  inputFeatures: json("input_features").notNull(),
  // AI prediction data
  predictedHomeWin: real("predicted_home_win"),
  predictedAwayWin: real("predicted_away_win"),
  predictedTotal: real("predicted_total"),
  predictedOverProb: real("predicted_over_prob"),
  predictedUnderProb: real("predicted_under_prob"),
  // Actual game results
  actualHomeScore: integer("actual_home_score"),
  actualAwayScore: integer("actual_away_score"),
  actualTotal: integer("actual_total"),
  actualHomeWin: boolean("actual_home_win"),
  actualOver: boolean("actual_over"), // Based on predicted total line
  // Model performance metrics for this prediction
  homeWinAccuracy: real("home_win_accuracy"), // How close prediction was
  totalAccuracy: real("total_accuracy"), // How close total prediction was
  // Market data at time of prediction
  marketHomeOdds: real("market_home_odds"),
  marketAwayOdds: real("market_away_odds"),
  marketTotalLine: real("market_total_line"),
  marketOverOdds: real("market_over_odds"),
  marketUnderOdds: real("market_under_odds"),
  // Umpire factors
  umpireName: text("umpire_name"),
  umpireStrikeZoneAccuracy: real("umpire_strike_zone_accuracy"),
  umpireConsistencyRating: real("umpire_consistency_rating"),
  umpireRunsImpact: real("umpire_runs_impact"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Umpire statistics and tendencies
export const baseballUmpires = pgTable("baseball_umpires", {
  id: serial("id").primaryKey(),
  umpireName: text("umpire_name").notNull().unique(),
  umpireId: text("umpire_id").unique(),
  // Strike zone metrics
  strikeZoneAccuracy: real("strike_zone_accuracy"), // Overall accuracy percentage
  consistencyRating: real("consistency_rating"), // Game-to-game consistency
  // Tendencies
  hitterFriendlyPercentage: real("hitter_friendly_percentage"), // % of games favoring hitters
  pitcherFriendlyPercentage: real("pitcher_friendly_percentage"), // % of games favoring pitchers
  averageRunsPerGame: real("average_runs_per_game"), // Avg runs in games they umpire
  runsImpactPerGame: real("runs_impact_per_game"), // Historical runs affected by calls
  // Zone tendencies
  expandedStrikeZone: real("expanded_strike_zone"), // % larger than average zone
  tightStrikeZone: real("tight_strike_zone"), // % smaller than average zone
  // Statistics
  gamesUmpired: integer("games_umpired"),
  gamesUmpiredThisSeason: integer("games_umpired_this_season"),
  lastGameDate: timestamp("last_game_date"),
  // Data sources and reliability
  dataSource: text("data_source"), // Where we get the data (UmpScores, etc.)
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily picks for free users (Pick of the Day)
export const dailyPicks = pgTable("daily_picks", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  pickTeam: text("pick_team").notNull(),
  pickType: text("pick_type").notNull().default("moneyline"),
  odds: integer("odds").notNull(),
  grade: text("grade").notNull(), // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning").notNull(),
  analysis: json("analysis").notNull(), // DailyPickAnalysis object
  gameTime: timestamp("game_time").notNull(),
  venue: text("venue").notNull(),
  probablePitchers: json("probable_pitchers").notNull(),
  pickDate: timestamp("pick_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
export const insertBaseballTrainingDataSchema = createInsertSchema(baseballTrainingData).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBaseballUmpireSchema = createInsertSchema(baseballUmpires).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertDailyPickSchema = createInsertSchema(dailyPicks).omit({ createdAt: true });

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
export type BaseballTrainingData = typeof baseballTrainingData.$inferSelect;
export type InsertBaseballTrainingData = z.infer<typeof insertBaseballTrainingDataSchema>;
export type BaseballUmpire = typeof baseballUmpires.$inferSelect;
export type InsertBaseballUmpire = z.infer<typeof insertBaseballUmpireSchema>;
export type DailyPick = typeof dailyPicks.$inferSelect;
export type InsertDailyPick = z.infer<typeof insertDailyPickSchema>;
