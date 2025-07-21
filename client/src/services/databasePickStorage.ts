// Database-backed storage service for user picks and preferences
import { apiRequest } from '@/lib/queryClient';
import { Pick, PickStorageService } from '@/types/picks';

interface DatabasePickData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  market: string;
  line?: number | null;
  units: number;
  betUnitAtTime?: number;
  bookmaker: string;
  bookmakerDisplayName: string;
  gameDate: string;
  gameTime?: string | null;
  odds: string;
  parlayLegs?: any[] | null;
}

class DatabasePickStorageService implements PickStorageService {
  private generateId(): string {
    return `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async savePick(pickData: DatabasePickData): Promise<void> {
    try {
      // Convert Pick data to match database schema
      const dbPickData = {
        gameId: pickData.gameId,
        homeTeam: pickData.homeTeam,
        awayTeam: pickData.awayTeam,
        selection: pickData.selection,
        market: pickData.market,
        line: pickData.line || null,
        units: pickData.units || 1,
        betUnitAtTime: pickData.betUnitAtTime || 10.00,
        bookmaker: pickData.bookmaker || 'manual',
        bookmakerDisplayName: pickData.bookmakerDisplayName || 'Manual Entry',
        gameDate: pickData.gameDate,
        gameTime: pickData.gameTime || null,
        odds: pickData.odds?.toString() || '0',
        parlayLegs: pickData.parlayLegs ? JSON.stringify(pickData.parlayLegs) : null
      };

      await apiRequest('POST', '/api/user/picks', dbPickData);

      // Trigger custom event for pick tracking - create a proper Pick object
      const pick: Pick = {
        id: this.generateId(),
        timestamp: Date.now(),
        gameInfo: {
          awayTeam: pickData.awayTeam,
          homeTeam: pickData.homeTeam,
          gameTime: pickData.gameTime || '',
          sport: 'baseball_mlb',
          venue: 'TBD'
        },
        betInfo: {
          market: pickData.market,
          selection: pickData.selection,
          line: pickData.line || undefined,
          odds: parseFloat(pickData.odds) || 0,
          units: pickData.units,
          parlayLegs: pickData.parlayLegs || undefined
        },
        bookmaker: {
          key: pickData.bookmaker,
          title: pickData.bookmakerDisplayName,
          displayName: pickData.bookmakerDisplayName,
          url: '#'
        },
        status: 'pending',
        betUnitAtTime: pickData.betUnitAtTime
      };
      window.dispatchEvent(new CustomEvent('pickSaved', { detail: pick }));
    } catch (error) {
      console.error('Error saving pick to database:', error);
      throw error;
    }
  }

  async getPicks(): Promise<Pick[]> {
    try {
      const response = await apiRequest('GET', '/api/user/picks');
      const dbPicks = await response.json();
      
      console.log('Raw database picks:', dbPicks);
      
      // Convert database picks to frontend Pick format  
      return dbPicks.map((dbPick: any) => {
        console.log('Processing pick:', dbPick);
        
        // Parse team names from game field (e.g., "Cincinnati Reds @ New York Mets")
        let awayTeam = 'TBD';
        let homeTeam = 'TBD';
        if (dbPick.game && dbPick.game.includes(' @ ')) {
          const teams = dbPick.game.split(' @ ');
          awayTeam = teams[0]?.trim() || 'TBD';
          homeTeam = teams[1]?.trim() || 'TBD';
        }
        
        const mappedPick = {
        id: dbPick.id.toString(),
        timestamp: new Date(dbPick.createdAt || dbPick.created_at).getTime(),
        gameInfo: {
          awayTeam: awayTeam,
          homeTeam: homeTeam,
          gameTime: dbPick.gameTime || dbPick.game_time || dbPick.gameDate || dbPick.game_date,
          sport: 'baseball_mlb',
          venue: 'TBD'
        },
        betInfo: {
          selection: dbPick.selection,
          market: dbPick.market,
          line: dbPick.line,
          odds: parseFloat(dbPick.odds) || 0,
          units: parseFloat(dbPick.units) || 1,
          parlayLegs: dbPick.parlayLegs || dbPick.parlay_legs ? JSON.parse(dbPick.parlayLegs || dbPick.parlay_legs) : undefined
        },
        bookmaker: {
          key: dbPick.bookmaker,
          title: dbPick.bookmakerDisplayName || dbPick.bookmaker_display_name || 'Manual Entry',
          displayName: dbPick.bookmakerDisplayName || dbPick.bookmaker_display_name || 'Manual Entry',
          url: '#'
        },
        status: dbPick.status,
        betUnitAtTime: parseFloat(dbPick.betUnitAtTime || dbPick.bet_unit_at_time) || undefined,
        result: dbPick.result ? {
          outcome: dbPick.status,
          payout: (dbPick.winAmount || dbPick.win_amount)?.toString() || '0',
          details: dbPick.result
        } : undefined
        };
        console.log('Mapped pick:', mappedPick);
        return mappedPick;
      });
    } catch (error) {
      console.error('Error fetching picks from database:', error);
      return [];
    }
  }

  async getPickById(id: string): Promise<Pick | undefined> {
    const picks = await this.getPicks();
    return picks.find(pick => pick.id === id);
  }

  async updatePickOdds(id: string, odds: string): Promise<void> {
    try {
      await apiRequest(`/api/user/picks/${id}/odds`, {
        method: 'PUT',
        body: JSON.stringify({ odds }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error updating pick odds:', error);
      throw error;
    }
  }

  async updatePickStatus(id: string, status: Pick['status'], result?: Pick['result']): Promise<void> {
    // For now, just trigger the event since status updates aren't fully implemented in backend
    window.dispatchEvent(new CustomEvent('pickStatusUpdated', { 
      detail: { id, status, result } 
    }));
  }

  async deletePick(id: string): Promise<void> {
    try {
      const response = await apiRequest('DELETE', `/api/user/picks/${id}`);
    } catch (error) {
      console.error('Error deleting pick:', error);
      throw error;
    }
  }

  async updateAllPicks(picks: Pick[]): Promise<void> {
    // For bulk updates, we'd need to implement a batch endpoint
    // For now, this is used for localStorage compatibility
    console.warn('updateAllPicks not implemented for database storage');
  }

  // User preferences methods
  async getBetUnit(): Promise<number> {
    try {
      const response = await apiRequest('GET', '/api/user/preferences');
      const data = await response.json();
      return data.betUnit || 10.00;
    } catch (error) {
      console.error('Error fetching bet unit:', error);
      return 10.00; // fallback
    }
  }

  async setBetUnit(betUnit: number): Promise<void> {
    try {
      await apiRequest('/api/user/bet-unit', {
        method: 'PUT',
        body: JSON.stringify({ betUnit }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error updating bet unit:', error);
      throw error;
    }
  }
}

export const databasePickStorage = new DatabasePickStorageService();