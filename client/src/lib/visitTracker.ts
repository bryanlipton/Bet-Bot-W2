// Visit tracking utility for pick cycle management
export interface VisitData {
  pickId: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
}

const STORAGE_KEY = 'betbot_pick_visits';

// Get visit data for a specific pick
export function getPickVisitData(pickId: string): VisitData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const allVisits: Record<string, VisitData> = JSON.parse(stored);
    return allVisits[pickId] || null;
  } catch (error) {
    console.error('Error reading visit data:', error);
    return null;
  }
}

// Track a visit for a specific pick
export function trackPickVisit(pickId: string): VisitData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allVisits: Record<string, VisitData> = stored ? JSON.parse(stored) : {};
    
    const now = new Date().toISOString();
    const existing = allVisits[pickId];
    
    if (existing) {
      // Increment visit count
      existing.visitCount += 1;
      existing.lastVisit = now;
    } else {
      // First visit for this pick
      allVisits[pickId] = {
        pickId,
        visitCount: 1,
        firstVisit: now,
        lastVisit: now
      };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allVisits));
    return allVisits[pickId];
  } catch (error) {
    console.error('Error tracking visit:', error);
    // Return default data if storage fails
    return {
      pickId,
      visitCount: 1,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString()
    };
  }
}

// Check if pick should be collapsed (visited 2+ times)
// Disabled to prevent user confusion - picks should always be visible
export function shouldCollapsePickForUser(pickId: string): boolean {
  return false; // Always keep picks expanded
}

// Clean up old visit data (older than 7 days)
export function cleanupOldVisits(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const allVisits: Record<string, VisitData> = JSON.parse(stored);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const cleaned: Record<string, VisitData> = {};
    Object.entries(allVisits).forEach(([pickId, visitData]) => {
      const lastVisit = new Date(visitData.lastVisit);
      if (lastVisit > sevenDaysAgo) {
        cleaned[pickId] = visitData;
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error('Error cleaning up old visits:', error);
  }
}

// Check if a game has started
export function hasGameStarted(gameTimeString: string): boolean {
  try {
    const gameTime = new Date(gameTimeString);
    const now = new Date();
    return now >= gameTime;
  } catch (error) {
    console.error('Error parsing game time:', error);
    return false;
  }
}

// Check if current time is before 2 AM EST (when new picks are generated)
export function isBeforeNewPickGeneration(): boolean {
  try {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = est.getHours();
    
    // Return true if it's before 2 AM EST
    return hour < 2;
  } catch (error) {
    console.error('Error checking time:', error);
    return false;
  }
}

// Check if pick should be hidden because game started and it's before 2 AM next day
export function shouldHideStartedPick(gameTimeString: string): boolean {
  return hasGameStarted(gameTimeString) && isBeforeNewPickGeneration();
}