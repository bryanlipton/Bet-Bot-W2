// Local storage service for tracking user picks

import { Pick, PickStorageService } from '@/types/picks';

const STORAGE_KEY = 'bet-bot-picks';

class LocalPickStorageService implements PickStorageService {
  private generateId(): string {
    return `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStoredPicks(): Pick[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading picks from localStorage:', error);
      return [];
    }
  }

  private setStoredPicks(picks: Pick[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch (error) {
      console.error('Error saving picks to localStorage:', error);
    }
  }

  savePick(pickData: Omit<Pick, 'id' | 'timestamp'>): void {
    const pick: Pick = {
      ...pickData,
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'pending'
    };

    const picks = this.getStoredPicks();
    picks.unshift(pick); // Add to beginning for newest first
    this.setStoredPicks(picks);

    // Trigger custom event for pick tracking
    window.dispatchEvent(new CustomEvent('pickSaved', { detail: pick }));
  }

  getPicks(): Pick[] {
    return this.getStoredPicks();
  }

  getPickById(id: string): Pick | undefined {
    const picks = this.getStoredPicks();
    return picks.find(pick => pick.id === id);
  }

  updatePickStatus(id: string, status: Pick['status'], result?: Pick['result']): void {
    const picks = this.getStoredPicks();
    const pickIndex = picks.findIndex(pick => pick.id === id);
    
    if (pickIndex !== -1) {
      picks[pickIndex].status = status;
      if (result) {
        picks[pickIndex].result = {
          ...picks[pickIndex].result,
          ...result
        };
      }
      this.setStoredPicks(picks);

      // Trigger custom event for status update
      window.dispatchEvent(new CustomEvent('pickStatusUpdated', { 
        detail: { id, status, result } 
      }));
    }
  }

  updatePick(id: string, updates: Partial<Pick>): void {
    const picks = this.getStoredPicks();
    const pickIndex = picks.findIndex(pick => pick.id === id);
    
    if (pickIndex !== -1) {
      picks[pickIndex] = { ...picks[pickIndex], ...updates };
      this.setStoredPicks(picks);

      // Trigger custom event for pick update
      window.dispatchEvent(new CustomEvent('pickUpdated', { 
        detail: { id, updates } 
      }));
    }
  }

  deletePick(id: string): void {
    const picks = this.getStoredPicks();
    const filteredPicks = picks.filter(pick => pick.id !== id);
    this.setStoredPicks(filteredPicks);

    // Trigger custom event for pick deletion
    window.dispatchEvent(new CustomEvent('pickDeleted', { detail: { id } }));
  }

  clearAllPicks(): void {
    localStorage.removeItem(STORAGE_KEY);
    
    // Trigger custom event for clearing all picks
    window.dispatchEvent(new CustomEvent('allPicksCleared'));
  }

  // Utility methods
  getPicksCount(): number {
    return this.getStoredPicks().length;
  }

  getPicksByStatus(status: Pick['status']): Pick[] {
    return this.getStoredPicks().filter(pick => pick.status === status);
  }

  getRecentPicks(limit: number = 10): Pick[] {
    return this.getStoredPicks().slice(0, limit);
  }

  // Bet unit methods
  getBetUnit(): number {
    try {
      const saved = localStorage.getItem('bet-bot-bet-unit');
      return saved ? parseFloat(saved) : 10;
    } catch (error) {
      console.error('Error reading bet unit from localStorage:', error);
      return 10;
    }
  }

  setBetUnit(amount: number): void {
    try {
      localStorage.setItem('bet-bot-bet-unit', amount.toString());
    } catch (error) {
      console.error('Error saving bet unit to localStorage:', error);
    }
  }
}

// Export singleton instance
export const pickStorage = new LocalPickStorageService();