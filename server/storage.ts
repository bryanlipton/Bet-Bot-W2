import { 
  users, games, odds, recommendations, chatMessages, modelMetrics,
  baseballGames, baseballPlayerStats, baseballGamePredictions, baseballModelTraining,
  type User, type InsertUser, type UpsertUser, type Game, type InsertGame, 
  type Odds, type InsertOdds, type Recommendation, type InsertRecommendation,
  type ChatMessage, type InsertChatMessage, type ModelMetrics, type InsertModelMetrics,
  type BaseballGame, type InsertBaseballGame, type BaseballPlayerStats, type InsertBaseballPlayerStats,
  type BaseballGamePrediction, type InsertBaseballGamePrediction, type BaseballModelTraining, type InsertBaseballModelTraining
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users (Updated for Google OAuth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Games
  getGame(id: number): Promise<Game | undefined>;
  getGameByExternalId(externalId: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameStatus(id: number, status: string): Promise<void>;
  getGamesBySport(sportKey: string): Promise<Game[]>;
  getLiveGames(): Promise<Game[]>;
  getTodaysGames(): Promise<Game[]>;

  // Odds
  createOdds(odds: InsertOdds): Promise<Odds>;
  getLatestOddsByGame(gameId: number): Promise<Odds[]>;
  getOddsByBookmaker(gameId: number, bookmaker: string): Promise<Odds[]>;

  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getActiveRecommendations(): Promise<Recommendation[]>;
  getRecommendationsBySport(sportKey: string): Promise<Recommendation[]>;
  updateRecommendationStatus(id: number, status: string): Promise<void>;

  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(limit?: number): Promise<ChatMessage[]>;

  // Model Metrics
  createOrUpdateModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics>;
  getModelMetricsBySport(sportKey: string): Promise<ModelMetrics | undefined>;

  // Baseball-specific methods
  createBaseballGame(game: InsertBaseballGame): Promise<BaseballGame>;
  getBaseballGameByExternalId(externalId: string): Promise<BaseballGame | undefined>;
  updateBaseballGameScore(id: number, homeScore: number, awayScore: number): Promise<void>;
  
  createBaseballPlayerStats(stats: InsertBaseballPlayerStats): Promise<BaseballPlayerStats>;
  getTeamPlayerStats(team: string, season: number): Promise<BaseballPlayerStats[]>;
  
  createBaseballPrediction(prediction: InsertBaseballGamePrediction): Promise<BaseballGamePrediction>;
  getLatestPredictionForGame(gameId: number): Promise<BaseballGamePrediction | undefined>;
  
  createBaseballTrainingRecord(training: InsertBaseballModelTraining): Promise<BaseballModelTraining>;
  getLatestTrainingRecord(): Promise<BaseballModelTraining | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private odds: Map<number, Odds>;
  private recommendations: Map<number, Recommendation>;
  private chatMessages: Map<number, ChatMessage>;
  private modelMetrics: Map<number, ModelMetrics>;
  
  private currentUserId: number;
  private currentGameId: number;
  private currentOddsId: number;
  private currentRecommendationId: number;
  private currentChatMessageId: number;
  private currentModelMetricsId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.odds = new Map();
    this.recommendations = new Map();
    this.chatMessages = new Map();
    this.modelMetrics = new Map();
    
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentOddsId = 1;
    this.currentRecommendationId = 1;
    this.currentChatMessageId = 1;
    this.currentModelMetricsId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.id === id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id!);
    if (existingUser) {
      const updated = { ...existingUser, ...userData };
      this.users.set(existingUser.id, updated);
      return updated;
    } else {
      const user: User = { ...userData, id: userData.id! } as User;
      this.users.set(user.id, user);
      return user;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByExternalId(externalId: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.externalId === externalId);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = { 
      ...insertGame, 
      id, 
      status: insertGame.status || "upcoming",
      createdAt: new Date() 
    };
    this.games.set(id, game);
    return game;
  }

  async updateGameStatus(id: number, status: string): Promise<void> {
    const game = this.games.get(id);
    if (game) {
      this.games.set(id, { ...game, status });
    }
  }

  async getGamesBySport(sportKey: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.sportKey === sportKey);
  }

  async getLiveGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === "live");
  }

  async getTodaysGames(): Promise<Game[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.games.values()).filter(game => {
      const gameDate = new Date(game.commenceTime);
      return gameDate >= today && gameDate < tomorrow;
    });
  }

  async createOdds(insertOdds: InsertOdds): Promise<Odds> {
    const id = this.currentOddsId++;
    const odds: Odds = { ...insertOdds, id };
    this.odds.set(id, odds);
    return odds;
  }

  async getLatestOddsByGame(gameId: number): Promise<Odds[]> {
    return Array.from(this.odds.values())
      .filter(odds => odds.gameId === gameId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getOddsByBookmaker(gameId: number, bookmaker: string): Promise<Odds[]> {
    return Array.from(this.odds.values())
      .filter(odds => odds.gameId === gameId && odds.bookmaker === bookmaker);
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.currentRecommendationId++;
    const recommendation: Recommendation = { 
      ...insertRecommendation, 
      id, 
      status: insertRecommendation.status || "active",
      createdAt: new Date() 
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async getActiveRecommendations(): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.status === "active")
      .sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
  }

  async getRecommendationsBySport(sportKey: string): Promise<Recommendation[]> {
    const games = await this.getGamesBySport(sportKey);
    const gameIds = games.map(game => game.id);
    
    return Array.from(this.recommendations.values())
      .filter(rec => gameIds.includes(rec.gameId) && rec.status === "active");
  }

  async updateRecommendationStatus(id: number, status: string): Promise<void> {
    const recommendation = this.recommendations.get(id);
    if (recommendation) {
      this.recommendations.set(id, { ...recommendation, status });
    }
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      isBot: insertMessage.isBot || false,
      metadata: insertMessage.metadata || null,
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .slice(-limit);
  }

  async createOrUpdateModelMetrics(insertMetrics: InsertModelMetrics): Promise<ModelMetrics> {
    const existing = Array.from(this.modelMetrics.values())
      .find(metrics => metrics.sportKey === insertMetrics.sportKey);
    
    if (existing) {
      const updated = { ...existing, ...insertMetrics };
      this.modelMetrics.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentModelMetricsId++;
      const metrics: ModelMetrics = { ...insertMetrics, id };
      this.modelMetrics.set(id, metrics);
      return metrics;
    }
  }

  async getModelMetricsBySport(sportKey: string): Promise<ModelMetrics | undefined> {
    return Array.from(this.modelMetrics.values())
      .find(metrics => metrics.sportKey === sportKey);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations (Updated for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameByExternalId(externalId: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.externalId, externalId));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async updateGameStatus(id: number, status: string): Promise<void> {
    await db.update(games).set({ status }).where(eq(games.id, id));
  }

  async getGamesBySport(sportKey: string): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.sportKey, sportKey));
  }

  async getLiveGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, 'live'));
  }

  async getTodaysGames(): Promise<Game[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(games).where(
      sql`DATE(${games.commenceTime}) = ${today}`
    );
  }

  async createOdds(insertOdds: InsertOdds): Promise<Odds> {
    const [odds] = await db.insert(odds).values(insertOdds).returning();
    return odds;
  }

  async getLatestOddsByGame(gameId: number): Promise<Odds[]> {
    return await db.select().from(odds)
      .where(eq(odds.gameId, gameId))
      .orderBy(desc(odds.timestamp));
  }

  async getOddsByBookmaker(gameId: number, bookmaker: string): Promise<Odds[]> {
    return await db.select().from(odds)
      .where(and(eq(odds.gameId, gameId), eq(odds.bookmaker, bookmaker)));
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db.insert(recommendations).values(insertRecommendation).returning();
    return recommendation;
  }

  async getActiveRecommendations(): Promise<Recommendation[]> {
    return await db.select().from(recommendations).where(eq(recommendations.status, 'active'));
  }

  async getRecommendationsBySport(sportKey: string): Promise<Recommendation[]> {
    return await db.select().from(recommendations)
      .innerJoin(games, eq(recommendations.gameId, games.id))
      .where(eq(games.sportKey, sportKey))
      .then(rows => rows.map(row => row.recommendations));
  }

  async updateRecommendationStatus(id: number, status: string): Promise<void> {
    await db.update(recommendations).set({ status }).where(eq(recommendations.id, id));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createOrUpdateModelMetrics(insertMetrics: InsertModelMetrics): Promise<ModelMetrics> {
    const existing = await db.select().from(modelMetrics)
      .where(eq(modelMetrics.sportKey, insertMetrics.sportKey));

    if (existing.length > 0) {
      const [updated] = await db.update(modelMetrics)
        .set(insertMetrics)
        .where(eq(modelMetrics.sportKey, insertMetrics.sportKey))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(modelMetrics).values(insertMetrics).returning();
      return created;
    }
  }

  async getModelMetricsBySport(sportKey: string): Promise<ModelMetrics | undefined> {
    const [metrics] = await db.select().from(modelMetrics)
      .where(eq(modelMetrics.sportKey, sportKey));
    return metrics || undefined;
  }

  // Baseball-specific implementations
  async createBaseballGame(insertGame: InsertBaseballGame): Promise<BaseballGame> {
    const [game] = await db.insert(baseballGames).values(insertGame).returning();
    return game;
  }

  async getBaseballGameByExternalId(externalId: string): Promise<BaseballGame | undefined> {
    const [game] = await db.select().from(baseballGames)
      .where(eq(baseballGames.externalId, externalId));
    return game || undefined;
  }

  async updateBaseballGameScore(id: number, homeScore: number, awayScore: number): Promise<void> {
    await db.update(baseballGames)
      .set({ homeScore, awayScore, gameStatus: 'completed' })
      .where(eq(baseballGames.id, id));
  }

  async createBaseballPlayerStats(insertStats: InsertBaseballPlayerStats): Promise<BaseballPlayerStats> {
    const [stats] = await db.insert(baseballPlayerStats).values(insertStats).returning();
    return stats;
  }

  async getTeamPlayerStats(team: string, season: number): Promise<BaseballPlayerStats[]> {
    return await db.select().from(baseballPlayerStats)
      .where(and(
        eq(baseballPlayerStats.team, team),
        eq(baseballPlayerStats.seasonYear, season)
      ));
  }

  async createBaseballPrediction(insertPrediction: InsertBaseballGamePrediction): Promise<BaseballGamePrediction> {
    const [prediction] = await db.insert(baseballGamePredictions).values(insertPrediction).returning();
    return prediction;
  }

  async getLatestPredictionForGame(gameId: number): Promise<BaseballGamePrediction | undefined> {
    const [prediction] = await db.select().from(baseballGamePredictions)
      .where(eq(baseballGamePredictions.gameId, gameId))
      .orderBy(desc(baseballGamePredictions.createdAt))
      .limit(1);
    return prediction || undefined;
  }

  async createBaseballTrainingRecord(insertTraining: InsertBaseballModelTraining): Promise<BaseballModelTraining> {
    const [training] = await db.insert(baseballModelTraining).values(insertTraining).returning();
    return training;
  }

  async getLatestTrainingRecord(): Promise<BaseballModelTraining | undefined> {
    const [training] = await db.select().from(baseballModelTraining)
      .orderBy(desc(baseballModelTraining.trainedAt))
      .limit(1);
    return training || undefined;
  }
}

export const storage = new DatabaseStorage();
