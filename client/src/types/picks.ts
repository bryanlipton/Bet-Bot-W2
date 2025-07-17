// Types for the pick tracking system

export interface Pick {
  id: string;
  timestamp: number;
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    gameId?: string | number;
    sport: string;
    gameTime?: string;
  };
  betInfo: {
    market: 'moneyline' | 'spread' | 'total' | 'over' | 'under';
    selection: string; // Team name or "Over"/"Under"
    odds: number;
    line?: number; // For spread/total bets
  };
  bookmaker: {
    key: string;
    displayName: string;
    url: string;
  };
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
  result?: {
    finalScore?: {
      home: number;
      away: number;
    };
    settledAt?: number;
    payout?: number;
  };
}

export interface PickStorageService {
  savePick(pick: Omit<Pick, 'id' | 'timestamp'>): void;
  getPicks(): Pick[];
  getPickById(id: string): Pick | undefined;
  updatePickStatus(id: string, status: Pick['status'], result?: Pick['result']): void;
  deletePick(id: string): void;
  clearAllPicks(): void;
}