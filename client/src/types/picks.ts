// Types for the pick tracking system

export interface Pick {
  id: string;
  timestamp: string;
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    gameId?: string | number;
    sport: string;
    gameTime?: string;
  };
  betInfo: {
    market: 'moneyline' | 'spread' | 'total' | 'over' | 'under' | 'parlay';
    selection: string; // Team name or "Over"/"Under"
    odds: number;
    line?: number; // For spread/total bets
    units?: number; // Number of units wagered
    parlayLegs?: Array<{
      game: string;
      market: 'moneyline' | 'spread' | 'total' | 'over' | 'under';
      selection: string;
      line?: number;
      odds: number;
    }>;
  };
  bookmaker: {
    key: string;
    displayName: string;
    url: string;
  };
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
  betUnitAtTime?: number; // Bet unit value when pick was created
  showOnProfile?: boolean; // Whether to show this pick on user profile
  showOnFeed?: boolean; // Whether to show this pick on public feed
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