import { 
  users, games, odds, recommendations, chatMessages, modelMetrics,
  type User, type InsertUser, type Game, type InsertGame, 
  type Odds, type InsertOdds, type Recommendation, type InsertRecommendation,
  type ChatMessage, type InsertChatMessage, type ModelMetrics, type InsertModelMetrics
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
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

export const storage = new MemStorage();
