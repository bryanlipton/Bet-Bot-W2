// Database-backed storage service for user picks and preferences
import { apiRequest } from '@/lib/queryClient';
import { Pick, PickStorageService } from '@/types/picks';

class DatabasePickStorageService implements PickStorageService {
  private generateId(): string {
    return `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async savePick(pickData: Omit<Pick, 'id' | 'timestamp'>): Promise<void> {
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
        bookmaker: pickData.bookmaker || 'manual',
        bookmakerDisplayName: pickData.bookmakerDisplayName || 'Manual Entry',
        gameDate: pickData.gameDate,
        gameTime: pickData.gameTime || null,
        odds: pickData.odds?.toString() || '0',
        parlayLegs: pickData.parlayLegs ? JSON.stringify(pickData.parlayLegs) : null
      };

      await apiRequest('POST', '/api/user/picks', dbPickData);

      // Trigger custom event for pick tracking
      const pick: Pick = {
        ...pickData,
        id: this.generateId(),
        timestamp: Date.now(),
        status: 'pending'
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
      
      // Convert database picks to frontend Pick format
      return dbPicks.map((dbPick: any) => ({
        id: dbPick.id.toString(),
        timestamp: new Date(dbPick.createdAt).getTime(),
        gameInfo: {
          awayTeam: dbPick.awayTeam,
          homeTeam: dbPick.homeTeam,
          gameTime: dbPick.gameTime || dbPick.gameDate,
          sport: 'baseball_mlb',
          venue: 'TBD'
        },
        betInfo: {
          selection: dbPick.selection,
          market: dbPick.market,
          line: dbPick.line,
          odds: parseFloat(dbPick.odds) || 0,
          units: parseFloat(dbPick.units) || 1,
          parlayLegs: dbPick.parlayLegs ? JSON.parse(dbPick.parlayLegs) : undefined
        },
        bookmaker: {
          key: dbPick.bookmaker,
          title: dbPick.bookmakerDisplayName,
          displayName: dbPick.bookmakerDisplayName,
          url: '#'
        },
        status: dbPick.status,
        result: dbPick.result ? {
          outcome: dbPick.status,
          payout: dbPick.winAmount?.toString() || '0',
          details: dbPick.result
        } : undefined
      }));
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