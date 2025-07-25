import { 
  users, games, odds, recommendations, chatMessages, modelMetrics,
  baseballGames, baseballPlayerStats, baseballGamePredictions, baseballModelTraining,
  userBets, userPicks, userPreferences, userFollows, userFollows,
  type User, type InsertUser, type UpsertUser, type Game, type InsertGame, 
  type Odds, type InsertOdds, type Recommendation, type InsertRecommendation,
  type ChatMessage, type InsertChatMessage, type ModelMetrics, type InsertModelMetrics,
  type BaseballGame, type InsertBaseballGame, type BaseballPlayerStats, type InsertBaseballPlayerStats,
  type BaseballGamePrediction, type InsertBaseballGamePrediction, type BaseballModelTraining, type InsertBaseballModelTraining,
  type UserBet, type InsertUserBet, type UserPick, type InsertUserPick, 
  type UserPreferences, type InsertUserPreferences, type UserFollow, type InsertUserFollow
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users (Updated for Google OAuth and Stripe)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profileData: any): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscriptionStatus(userId: string, status: string, plan: string, endsAt?: Date): Promise<User>;

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

  // User bet tracking methods
  createUserBet(bet: InsertUserBet): Promise<UserBet>;
  getUserBets(userId: string, limit?: number, offset?: number): Promise<UserBet[]>;
  getUserBetsByTeam(userId: string, teamName: string): Promise<UserBet[]>;
  getUserBetsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<UserBet[]>;
  getUserBetsByStatus(userId: string, status: string): Promise<UserBet[]>;
  updateUserBet(betId: number, updates: Partial<UserBet>): Promise<UserBet>;
  getUserBetStats(userId: string): Promise<{
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    totalLost: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    pendingCount: number;
    roi: number;
  }>;

  // User picks persistence methods
  createUserPick(pick: InsertUserPick): Promise<UserPick>;
  getUserPicks(userId: string, limit?: number, offset?: number): Promise<UserPick[]>;
  getUserPicksByStatus(userId: string, status: string): Promise<UserPick[]>;
  updateUserPick(pickId: number, updates: Partial<UserPick>): Promise<UserPick>;
  updatePickVisibility(userId: string, pickId: number, visibility: { showOnProfile?: boolean; showOnFeed?: boolean }): Promise<UserPick | null>;
  deleteUserPick(userId: string, pickId: number): Promise<boolean>;
  getUserPickStats(userId: string): Promise<{
    totalPicks: number;
    pendingPicks: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    totalUnits: number;
    totalWinnings: number;
  }>;

  // User preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Additional methods needed for profile viewing
  getUserPicksPublicFeed(userId: string): Promise<UserPick[]>;
  isUserFollowing(currentUserId: string, targetUserId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<number, Game>;
  private odds: Map<number, Odds>;
  private recommendations: Map<number, Recommendation>;
  private chatMessages: Map<number, ChatMessage>;
  private modelMetrics: Map<number, ModelMetrics>;
  private userBets: Map<number, UserBet>;
  
  private currentUserId: number;
  private currentGameId: number;
  private currentOddsId: number;
  private currentRecommendationId: number;
  private currentChatMessageId: number;
  private currentModelMetricsId: number;
  private currentUserBetId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.odds = new Map();
    this.recommendations = new Map();
    this.chatMessages = new Map();
    this.modelMetrics = new Map();
    this.userBets = new Map();
    
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentOddsId = 1;
    this.currentRecommendationId = 1;
    this.currentChatMessageId = 1;
    this.currentModelMetricsId = 1;
    this.currentUserBetId = 1;
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

  async updateUserProfile(id: string, profileData: any): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    const updated = { ...existingUser, ...profileData };
    this.users.set(id, updated);
    return updated;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (this.currentUserId++).toString();
    const user: User = { 
      ...insertUser, 
      id, 
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      googleId: insertUser.googleId ?? null,
      stripeCustomerId: insertUser.stripeCustomerId ?? null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId ?? null,
      subscriptionStatus: insertUser.subscriptionStatus ?? null,
      subscriptionPlan: insertUser.subscriptionPlan ?? null,
      subscriptionEndsAt: insertUser.subscriptionEndsAt ?? null,
      betUnit: insertUser.betUnit ?? null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
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

  // Stripe subscription stub methods for MemStorage
  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updated = { ...user, stripeCustomerId, stripeSubscriptionId, subscriptionStatus: 'active', subscriptionPlan: 'monthly' };
    this.users.set(user.id, updated);
    return updated;
  }

  async updateUserSubscriptionStatus(userId: string, status: string, plan: string, endsAt?: Date): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updated = { ...user, subscriptionStatus: status, subscriptionPlan: plan, subscriptionEndsAt: endsAt ?? null };
    this.users.set(user.id, updated);
    return updated;
  }

  // Baseball-specific stub methods for MemStorage
  async createBaseballGame(game: InsertBaseballGame): Promise<BaseballGame> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async getBaseballGameByExternalId(externalId: string): Promise<BaseballGame | undefined> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async updateBaseballGameScore(id: number, homeScore: number, awayScore: number): Promise<void> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async createBaseballPlayerStats(stats: InsertBaseballPlayerStats): Promise<BaseballPlayerStats> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async getTeamPlayerStats(team: string, season: number): Promise<BaseballPlayerStats[]> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async createBaseballPrediction(prediction: InsertBaseballGamePrediction): Promise<BaseballGamePrediction> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async getLatestPredictionForGame(gameId: number): Promise<BaseballGamePrediction | undefined> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async createBaseballTrainingRecord(training: InsertBaseballModelTraining): Promise<BaseballModelTraining> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  async getLatestTrainingRecord(): Promise<BaseballModelTraining | undefined> {
    throw new Error('Baseball methods not implemented in MemStorage');
  }

  // User picks methods - basic implementation
  async createUserPick(pick: InsertUserPick): Promise<UserPick> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async getUserPicks(userId: string, limit?: number, offset?: number): Promise<UserPick[]> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async getUserPicksByStatus(userId: string, status: string): Promise<UserPick[]> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async updateUserPick(pickId: number, updates: Partial<UserPick>): Promise<UserPick> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async updatePickVisibility(userId: string, pickId: number, visibility: { showOnProfile?: boolean; showOnFeed?: boolean }): Promise<UserPick | null> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async deleteUserPick(userId: string, pickId: number): Promise<boolean> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  async getUserPickStats(userId: string): Promise<{
    totalPicks: number;
    pendingPicks: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    totalUnits: number;
    totalWinnings: number;
  }> {
    throw new Error('User picks methods not implemented in MemStorage');
  }

  // User bet tracking methods implementation
  async createUserBet(insertBet: InsertUserBet): Promise<UserBet> {
    const id = this.currentUserBetId++;
    const bet: UserBet = { 
      ...insertBet, 
      id, 
      status: insertBet.status || 'pending',
      venue: insertBet.venue ?? null,
      result: insertBet.result ?? null,
      finalScore: insertBet.finalScore ?? null,
      settledAt: insertBet.settledAt ?? null,
      notes: insertBet.notes ?? null,
      profitLoss: insertBet.profitLoss ?? "0.00",
      placedAt: insertBet.placedAt ?? new Date(),
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.userBets.set(id, bet);
    return bet;
  }

  async getUserBets(userId: string, limit: number = 100, offset: number = 0): Promise<UserBet[]> {
    const userBets = Array.from(this.userBets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(offset, offset + limit);
    return userBets;
  }

  async getUserBetsByTeam(userId: string, teamName: string): Promise<UserBet[]> {
    return Array.from(this.userBets.values())
      .filter(bet => bet.userId === userId && bet.teamBet === teamName)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUserBetsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<UserBet[]> {
    return Array.from(this.userBets.values())
      .filter(bet => bet.userId === userId && bet.createdAt && bet.createdAt >= startDate && bet.createdAt <= endDate)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUserBetsByStatus(userId: string, status: string): Promise<UserBet[]> {
    return Array.from(this.userBets.values())
      .filter(bet => bet.userId === userId && bet.status === status)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateUserBet(betId: number, updates: Partial<UserBet>): Promise<UserBet> {
    const bet = this.userBets.get(betId);
    if (!bet) {
      throw new Error(`Bet with id ${betId} not found`);
    }
    
    const updatedBet = { ...bet, ...updates, updatedAt: new Date() };
    this.userBets.set(betId, updatedBet);
    return updatedBet;
  }

  async getUserBetStats(userId: string): Promise<{
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    totalLost: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    pendingCount: number;
    roi: number;
  }> {
    const userBets = Array.from(this.userBets.values()).filter(bet => bet.userId === userId);
    
    const stats = {
      totalBets: userBets.length,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      winCount: 0,
      lossCount: 0,
      pushCount: 0,
      pendingCount: 0,
      roi: 0,
    };

    for (const bet of userBets) {
      stats.totalWagered += parseFloat(bet.stake.toString());
      
      if (bet.status === 'won') {
        stats.winCount++;
        stats.totalWon += parseFloat(bet.toWin.toString());
      } else if (bet.status === 'lost') {
        stats.lossCount++;
        stats.totalLost += parseFloat(bet.stake.toString());
      } else if (bet.status === 'push') {
        stats.pushCount++;
      } else if (bet.status === 'pending') {
        stats.pendingCount++;
      }
    }

    if (stats.totalWagered > 0) {
      stats.roi = ((stats.totalWon - stats.totalLost) / stats.totalWagered) * 100;
    }

    return stats;
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
    // Animal avatar options for server-side assignment - using Dicebear API
    const animalAvatars = [
      'https://api.dicebear.com/7.x/animals/svg?seed=bear&backgroundColor=c0aede',
      'https://api.dicebear.com/7.x/animals/svg?seed=fox&backgroundColor=ffdfbf',
      'https://api.dicebear.com/7.x/animals/svg?seed=owl&backgroundColor=d1d4f9',
      'https://api.dicebear.com/7.x/animals/svg?seed=cat&backgroundColor=ffd5dc',
      'https://api.dicebear.com/7.x/animals/svg?seed=dog&backgroundColor=c0aede',
      'https://api.dicebear.com/7.x/animals/svg?seed=rabbit&backgroundColor=ffdfbf',
      'https://api.dicebear.com/7.x/animals/svg?seed=penguin&backgroundColor=d1d4f9',
      'https://api.dicebear.com/7.x/animals/svg?seed=panda&backgroundColor=ffd5dc',
      'https://api.dicebear.com/7.x/animals/svg?seed=lion&backgroundColor=c0aede',
      'https://api.dicebear.com/7.x/animals/svg?seed=tiger&backgroundColor=ffdfbf',
      'https://api.dicebear.com/7.x/animals/svg?seed=elephant&backgroundColor=d1d4f9',
      'https://api.dicebear.com/7.x/animals/svg?seed=koala&backgroundColor=ffd5dc',
      'https://api.dicebear.com/7.x/animals/svg?seed=monkey&backgroundColor=c0aede',
      'https://api.dicebear.com/7.x/animals/svg?seed=deer&backgroundColor=ffdfbf',
      'https://api.dicebear.com/7.x/animals/svg?seed=wolf&backgroundColor=d1d4f9',
      'https://api.dicebear.com/7.x/animals/svg?seed=sheep&backgroundColor=ffd5dc'
    ];
    
    // If no profile image URL is provided, assign a random animal avatar
    const getRandomAnimalAvatar = () => {
      const randomIndex = Math.floor(Math.random() * animalAvatars.length);
      return animalAvatars[randomIndex];
    };
    
    const userDataWithAvatar = {
      ...userData,
      profileImageUrl: userData.profileImageUrl || getRandomAnimalAvatar()
    };
    
    const [user] = await db
      .insert(users)
      .values(userDataWithAvatar)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userDataWithAvatar,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profileData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
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
    const [newOdds] = await db.insert(odds).values(insertOdds).returning();
    return newOdds;
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

  // Stripe subscription methods
  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscriptionStatus(userId: string, status: string, plan: string, endsAt?: Date): Promise<User> {
    const [user] = await db.update(users)
      .set({
        subscriptionStatus: status,
        subscriptionPlan: plan,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // User bet tracking methods
  async createUserBet(insertBet: InsertUserBet): Promise<UserBet> {
    const [bet] = await db.insert(userBets).values({
      ...insertBet,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return bet;
  }

  async getUserBets(userId: string, limit: number = 100, offset: number = 0): Promise<UserBet[]> {
    return await db.select().from(userBets)
      .where(eq(userBets.userId, userId))
      .orderBy(desc(userBets.placedAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserBetsByTeam(userId: string, teamName: string): Promise<UserBet[]> {
    return await db.select().from(userBets)
      .where(and(
        eq(userBets.userId, userId),
        or(
          eq(userBets.homeTeam, teamName),
          eq(userBets.awayTeam, teamName),
          eq(userBets.teamBet, teamName)
        )
      ))
      .orderBy(desc(userBets.placedAt));
  }

  async getUserBetsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<UserBet[]> {
    return await db.select().from(userBets)
      .where(and(
        eq(userBets.userId, userId),
        gte(userBets.gameDate, startDate),
        lte(userBets.gameDate, endDate)
      ))
      .orderBy(desc(userBets.placedAt));
  }

  async getUserBetsByStatus(userId: string, status: string): Promise<UserBet[]> {
    return await db.select().from(userBets)
      .where(and(
        eq(userBets.userId, userId),
        eq(userBets.status, status)
      ))
      .orderBy(desc(userBets.placedAt));
  }

  async updateUserBet(betId: number, updates: Partial<UserBet>): Promise<UserBet> {
    const [bet] = await db.update(userBets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userBets.id, betId))
      .returning();
    return bet;
  }

  async getUserBetStats(userId: string): Promise<{
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    totalLost: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    pendingCount: number;
    roi: number;
  }> {
    const bets = await db.select().from(userBets)
      .where(eq(userBets.userId, userId));

    const totalBets = bets.length;
    const totalWagered = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
    const totalProfit = bets.reduce((sum, bet) => sum + Number(bet.profitLoss), 0);
    const winCount = bets.filter(bet => bet.result === 'win').length;
    const lossCount = bets.filter(bet => bet.result === 'loss').length;
    const pushCount = bets.filter(bet => bet.result === 'push').length;
    const pendingCount = bets.filter(bet => bet.status === 'pending').length;
    const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

    return {
      totalBets,
      totalWagered,
      totalWon: bets.filter(bet => bet.result === 'win').reduce((sum, bet) => sum + Number(bet.toWin), 0),
      totalLost: bets.filter(bet => bet.result === 'loss').reduce((sum, bet) => sum + Number(bet.stake), 0),
      winCount,
      lossCount,
      pushCount,
      pendingCount,
      roi,
    };
  }

  // User picks persistence methods
  async createUserPick(insertPick: InsertUserPick): Promise<UserPick> {
    const [pick] = await db.insert(userPicks).values({
      ...insertPick,
      createdAt: new Date(),
    }).returning();
    return pick;
  }

  async getUserPicks(userId: string, limit: number = 100, offset: number = 0): Promise<UserPick[]> {
    return await db.select().from(userPicks)
      .where(eq(userPicks.userId, userId))
      .orderBy(desc(userPicks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserPicksByStatus(userId: string, status: string): Promise<UserPick[]> {
    return await db.select().from(userPicks)
      .where(and(
        eq(userPicks.userId, userId),
        eq(userPicks.status, status)
      ))
      .orderBy(desc(userPicks.createdAt));
  }

  async updateUserPick(pickId: number, updates: Partial<UserPick>): Promise<UserPick> {
    const [pick] = await db.update(userPicks)
      .set({
        ...updates,
        gradedAt: updates.status && updates.status !== 'pending' ? new Date() : undefined,
      })
      .where(eq(userPicks.id, pickId))
      .returning();
    return pick;
  }

  async updatePickVisibility(userId: string, pickId: number, visibility: { showOnProfile?: boolean; showOnFeed?: boolean }): Promise<UserPick | null> {
    // Map the visibility properties to the database field
    const dbUpdate: Partial<{ isPublic: boolean }> = {};
    if (visibility.showOnProfile !== undefined) {
      dbUpdate.isPublic = visibility.showOnProfile;
    }
    
    const [pick] = await db.update(userPicks)
      .set(dbUpdate)
      .where(and(
        eq(userPicks.id, pickId),
        eq(userPicks.userId, userId)
      ))
      .returning();
    return pick || null;
  }

  async deleteUserPick(userId: string, pickId: number): Promise<boolean> {
    const result = await db.delete(userPicks)
      .where(and(
        eq(userPicks.id, pickId),
        eq(userPicks.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getUserPickStats(userId: string): Promise<{
    totalPicks: number;
    pendingPicks: number;
    winCount: number;
    lossCount: number;
    pushCount: number;
    totalUnits: number;
    totalWinnings: number;
  }> {
    const picks = await db.select().from(userPicks)
      .where(eq(userPicks.userId, userId));

    const totalPicks = picks.length;
    const pendingPicks = picks.filter(pick => pick.status === 'pending').length;
    const winCount = picks.filter(pick => pick.status === 'win').length;
    const lossCount = picks.filter(pick => pick.status === 'loss').length;
    const pushCount = picks.filter(pick => pick.status === 'push').length;
    const totalUnits = picks.reduce((sum, pick) => sum + (pick.units || 0), 0);
    const totalWinnings = picks
      .filter(pick => pick.status === 'win')
      .reduce((sum, pick) => sum + (pick.winAmount || 0), 0);

    return {
      totalPicks,
      pendingPicks,
      winCount,
      lossCount,
      pushCount,
      totalUnits,
      totalWinnings,
    };
  }

  // User preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async upsertUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(insertPreferences.userId);
    
    if (existing) {
      const [updated] = await db.update(userPreferences)
        .set({
          ...insertPreferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, insertPreferences.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userPreferences)
        .values({
          ...insertPreferences,
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Profile viewing methods
  async getUserPicksPublicFeed(userId: string): Promise<UserPick[]> {
    const picks = await db
      .select()
      .from(userPicks)
      .where(
        and(
          eq(userPicks.userId, userId),
          eq(userPicks.isPublic, true)
        )
      )
      .orderBy(desc(userPicks.createdAt))
      .limit(20);
    return picks;
  }

  async isUserFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const follow = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, currentUserId),
            eq(userFollows.followingId, targetUserId)
          )
        )
        .limit(1);
      
      return follow.length > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
