interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private dailyApiCallCount = 0;
  private lastResetDate = new Date().toDateString();
  private readonly DAILY_API_LIMIT = 645;
  
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    this.cache.set(key, entry);
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  // Get cached data even if expired (used when daily quota is reached)
  getExpiredOk<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Return the data regardless of expiration
    return entry.data as T;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Daily API call tracking methods
  incrementApiCallCount(): void {
    this.resetDailyCountIfNeeded();
    this.dailyApiCallCount++;
    console.log(`📊 Daily API calls: ${this.dailyApiCallCount}/${this.DAILY_API_LIMIT}`);
  }

  // Force reset API call count for new API key
  resetApiCallCount(): void {
    this.dailyApiCallCount = 0;
    this.clear(); // Also clear all cached data
    console.log(`🔄 API call count reset to 0 and cache cleared`);
  }

  canMakeApiCall(customLimit?: number): boolean {
    this.resetDailyCountIfNeeded();
    const limit = customLimit || this.DAILY_API_LIMIT;
    return this.dailyApiCallCount < limit;
  }

  getDailyApiCallCount(): number {
    this.resetDailyCountIfNeeded();
    return this.dailyApiCallCount;
  }

  private resetDailyCountIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyApiCallCount = 0;
      this.lastResetDate = today;
      console.log(`🔄 Daily API call counter reset for ${today}`);
    }
  }

  getStats(): { size: number; keys: string[]; dailyApiCalls: number; dailyLimit: number } {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    
    this.resetDailyCountIfNeeded();
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      dailyApiCalls: this.dailyApiCallCount,
      dailyLimit: this.DAILY_API_LIMIT
    };
  }
}

export const cacheService = new CacheService();