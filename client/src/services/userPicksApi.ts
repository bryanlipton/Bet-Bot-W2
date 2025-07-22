interface UserPickFromDB {
  id: number;
  user_id: string;
  game_id: string;
  home_team: string;
  away_team: string;
  selection: string;
  game: string;
  market: string;
  line: string | null;
  odds: number;
  units: number;
  bookmaker: string;
  bookmaker_display_name: string;
  status: 'pending' | 'win' | 'loss' | 'push';
  result: string | null;
  win_amount: number | null;
  game_date: string;
  created_at: string;
  bet_unit_at_time: number;
}

interface UserPickDisplay {
  id: number;
  gameInfo: {
    awayTeam: string;
    homeTeam: string;
    game: string;
    gameDate: string;
  };
  betInfo: {
    selection: string;
    market: string;
    line?: string;
    odds: number;
    units: number;
  };
  bookmaker: {
    key: string;
    displayName: string;
  };
  status: 'pending' | 'win' | 'loss' | 'push';
  result?: string;
  winAmount?: number;
  wagerAmount: number;
  potentialPayout: number;
  betUnitAtTime: number;
  createdAt: string;
}

export class UserPicksAPI {
  private baseURL = '/api/user/picks';

  async getUserPicks(): Promise<UserPickDisplay[]> {
    const response = await fetch(this.baseURL, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch picks: ${response.status}`);
    }
    
    const picks: UserPickFromDB[] = await response.json();
    return picks.map(this.transformPick);
  }

  async updatePickOdds(pickId: number, odds: number): Promise<UserPickDisplay> {
    const response = await fetch(`${this.baseURL}/${pickId}/odds`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ odds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update odds: ${response.status}`);
    }
    
    const pick: UserPickFromDB = await response.json();
    return this.transformPick(pick);
  }

  async updatePickUnits(pickId: number, units: number): Promise<UserPickDisplay> {
    const response = await fetch(`${this.baseURL}/${pickId}/units`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ units })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update units: ${response.status}`);
    }
    
    const pick: UserPickFromDB = await response.json();
    return this.transformPick(pick);
  }

  async deletePick(pickId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/${pickId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete pick: ${response.status}`);
    }
  }

  private transformPick(pick: UserPickFromDB): UserPickDisplay {
    const wagerAmount = pick.units * pick.bet_unit_at_time;
    const potentialPayout = this.calculatePayout(wagerAmount, pick.odds);
    
    return {
      id: pick.id,
      gameInfo: {
        awayTeam: pick.away_team,
        homeTeam: pick.home_team,
        game: pick.game,
        gameDate: pick.game_date
      },
      betInfo: {
        selection: pick.selection,
        market: pick.market,
        line: pick.line || undefined,
        odds: pick.odds,
        units: pick.units
      },
      bookmaker: {
        key: pick.bookmaker,
        displayName: pick.bookmaker_display_name
      },
      status: pick.status,
      result: pick.result || undefined,
      winAmount: pick.win_amount || undefined,
      wagerAmount,
      potentialPayout,
      betUnitAtTime: pick.bet_unit_at_time,
      createdAt: pick.created_at
    };
  }

  private calculatePayout(wager: number, odds: number): number {
    if (odds === 0) return wager;
    
    if (odds > 0) {
      // Positive odds: payout = wager + (wager * (odds/100))
      return wager + (wager * (odds / 100));
    } else {
      // Negative odds: payout = wager + (wager * (100/Math.abs(odds)))
      return wager + (wager * (100 / Math.abs(odds)));
    }
  }
}

export const userPicksAPI = new UserPicksAPI();