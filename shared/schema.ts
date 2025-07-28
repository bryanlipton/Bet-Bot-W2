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
  // Social profile features
  username: text("username").unique(),
  bio: text("bio"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  // Privacy settings for stats
  totalPicksPublic: boolean("total_picks_public").default(true),
  pendingPicksPublic: boolean("pending_picks_public").default(true), 
  winRatePublic: boolean("win_rate_public").default(true),
  winStreakPublic: boolean("win_streak_public").default(true),
  profilePublic: boolean("profile_public").default(true),
  // Stripe subscription fields
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, canceled, past_due
  subscriptionPlan: text("subscription_plan").default("free"), // free, monthly, annual
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  // User preferences
  betUnit: decimal("bet_unit", { precision: 10, scale: 2 }).default("10.00"), // Default $10 bet unit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User follows/friends relationship table
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id").references(() => users.id).notNull(),
  followingId: text("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_follower").on(table.followerId),
  index("idx_following").on(table.followingId),
]);

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

// Removed duplicate userPicks table - comprehensive version defined below

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

// Persistent grade storage for Pro picks 
export const proPickGrades = pgTable("pro_pick_grades", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(), // Unique per game per day
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  pickTeam: text("pick_team").notNull(),
  grade: text("grade").notNull(), // A+, A, A-, B+, B, B-, C+, C, C-, D+, D
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning").notNull(),
  analysis: json("analysis").notNull(), // Complete analysis factors
  odds: integer("odds"),
  gameTime: timestamp("game_time").notNull(),
  pickDate: text("pick_date").notNull(), // YYYY-MM-DD format for daily grouping
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pick_date").on(table.pickDate),
  index("idx_game_id").on(table.gameId),
]);

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
  status: text("status").default("pending"), // "pending", "won", "lost"
  finalScore: text("final_score"), // Final game score when completed
  gradedAt: timestamp("graded_at"), // When the pick was graded
  createdAt: timestamp("created_at").defaultNow(),
});

// Logged-in lock picks for authenticated users
export const loggedInLockPicks = pgTable("logged_in_lock_picks", {
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
  status: text("status").default("pending"), // "pending", "won", "lost"
  finalScore: text("final_score"), // Final game score when completed
  gradedAt: timestamp("graded_at"), // When the pick was graded
  createdAt: timestamp("created_at").defaultNow(),
});

// User picks storage table - persistent across sessions with grading
export const userPicks = pgTable("user_picks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  gameId: text("game_id").notNull(),
  homeTeam: text("home_team").notNull(), // Home team name
  awayTeam: text("away_team").notNull(), // Away team name
  selection: text("selection").notNull(), // Team or outcome selected
  game: text("game").notNull(), // "Team A @ Team B" format
  market: text("market").notNull(), // "moneyline", "spread", "total", "parlay"
  line: text("line"), // Point spread or total line (e.g., "-1.5", "8.5")
  odds: integer("odds").default(0), // American odds format
  units: real("units").notNull().default(1), // Number of units bet
  betUnitAtTime: real("bet_unit_at_time").default(10.00), // Bet unit value when pick was created
  bookmaker: text("bookmaker").notNull().default("manual"), // Bookmaker key or "manual"
  bookmakerDisplayName: text("bookmaker_display_name").notNull().default("Manual Entry"),
  status: text("status").notNull().default("pending"), // "pending", "win", "loss", "push"
  result: text("result"), // Game result details when graded
  winAmount: real("win_amount"), // Calculated win amount when graded
  parlayLegs: json("parlay_legs"), // Array of parlay legs if market is "parlay"
  isPublic: boolean("is_public").default(true), // Single toggle for public visibility (replaces showOnProfile and showOnFeed)
  createdAt: timestamp("created_at").defaultNow(),
  gameDate: timestamp("game_date"), // When the game is/was played
  gradedAt: timestamp("graded_at"), // When the pick was graded
});

// User preferences table - stores betting unit size and other preferences
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().notNull().references(() => users.id),
  betUnit: real("bet_unit").notNull().default(50), // Default $50 unit size
  currency: text("currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User bet tracking table
export const userBets = pgTable("user_bets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  gameId: text("game_id").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  teamBet: text("team_bet").notNull(), // Team name or "Over"/"Under"
  betType: text("bet_type").notNull(), // "moneyline", "spread", "total", "over", "under"
  odds: integer("odds").notNull(), // American odds format
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(), // Amount wagered
  toWin: decimal("to_win", { precision: 10, scale: 2 }).notNull(), // Potential winnings
  status: text("status").notNull().default("pending"), // "pending", "won", "lost", "cancelled"
  result: text("result"), // "win", "loss", "push"
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }).default("0.00"), // Net profit/loss
  gameDate: timestamp("game_date").notNull(),
  placedAt: timestamp("placed_at").defaultNow(),
  settledAt: timestamp("settled_at"),
  notes: text("notes"), // Optional user notes
  venue: text("venue"), // Stadium/arena name
  finalScore: text("final_score"), // e.g., "Yankees 7, Red Sox 4"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Confirmed bets table - tracks when users confirm they placed a bet through a sportsbook
export const confirmedBets = pgTable("confirmed_bets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  gameId: text("game_id").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  selection: text("selection").notNull(), // Team or outcome selected
  market: text("market").notNull(), // "moneyline", "spread", "total"
  line: text("line"), // Point spread or total line (e.g., "-1.5", "8.5") 
  odds: integer("odds").notNull(), // American odds format
  units: real("units").notNull(), // Number of units bet
  betUnitAtTime: real("bet_unit_at_time").notNull(), // Bet unit value when confirmed
  dollarAmount: decimal("dollar_amount", { precision: 10, scale: 2 }).notNull(), // Calculated dollar amount (units * betUnitAtTime)
  bookmaker: text("bookmaker").notNull(), // Sportsbook used
  bookmakerDisplayName: text("bookmaker_display_name").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "won", "lost", "push"
  result: text("result"), // Game result details when graded
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }), // Calculated win amount when graded
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }), // Net profit/loss when graded
  isPublic: boolean("is_public").default(true), // Show on public profile
  gameDate: timestamp("game_date").notNull(),
  confirmedAt: timestamp("confirmed_at").defaultNow(),
  gradedAt: timestamp("graded_at"), // When the bet was graded
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
export const insertLoggedInLockPickSchema = createInsertSchema(loggedInLockPicks).omit({ createdAt: true });
export const insertUserPickSchema = createInsertSchema(userPicks).omit({ id: true, createdAt: true, gradedAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ updatedAt: true });
export const insertUserBetSchema = createInsertSchema(userBets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConfirmedBetSchema = createInsertSchema(confirmedBets).omit({ id: true, createdAt: true, gradedAt: true });
export const insertUserFollowSchema = createInsertSchema(userFollows).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

// Add profile update type for social features
export type UpdateUserProfile = {
  username?: string;
  bio?: string;
  profileImageUrl?: string;
  totalPicksPublic?: boolean;
  pendingPicksPublic?: boolean;
  winRatePublic?: boolean;
  winStreakPublic?: boolean;
  profilePublic?: boolean;
};
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
export type LoggedInLockPick = typeof loggedInLockPicks.$inferSelect;
export type InsertLoggedInLockPick = z.infer<typeof insertLoggedInLockPickSchema>;
export type UserPick = typeof userPicks.$inferSelect;
export type InsertUserPick = z.infer<typeof insertUserPickSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserBet = typeof userBets.$inferSelect;
export type InsertUserBet = z.infer<typeof insertUserBetSchema>;
export type ConfirmedBet = typeof confirmedBets.$inferSelect;
export type InsertConfirmedBet = z.infer<typeof insertConfirmedBetSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;

// Daily pick analysis interface for enhanced model factors
export interface DailyPickAnalysis {
  offensiveProduction: number;     // 0-100 scale - Team's run-scoring capability based on advanced metrics
  pitchingMatchup: number;         // 0-100 scale - Starting pitcher advantage and effectiveness
  situationalEdge: number;         // 0-100 scale - Ballpark factors, travel, rest, conditions
  teamMomentum: number;            // 0-100 scale - Recent performance and current form trends
  marketInefficiency: number;      // 0-100 scale - Betting value relative to true probability
  systemConfidence: number;        // 0-100 scale - Model certainty based on data quality and consensus
  confidence: number;              // 60-100 normalized scale - Overall recommendation strength
}
