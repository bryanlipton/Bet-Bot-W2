// Affiliate links configuration
// Update this file to add new affiliate links for each sportsbook

export interface AffiliateLink {
  bookmaker: string;
  displayName: string;
  affiliateUrl: string;
  isActive: boolean;
  deepLinkSupport: boolean;
  deepLinkTemplate?: string; // Template for deep linking to specific bets
}

export const affiliateLinks: Record<string, AffiliateLink> = {
  // Major US Sportsbooks
  draftkings: {
    bookmaker: 'draftkings',
    displayName: 'DraftKings',
    affiliateUrl: 'https://sportsbook.draftkings.com/r/sb/1234567', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.draftkings.com/leagues/baseball/mlb?category=game-lines&subcategory={gameId}'
  },
  
  fanduel: {
    bookmaker: 'fanduel',
    displayName: 'FanDuel',
    affiliateUrl: 'https://sportsbook.fanduel.com/?ref=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.fanduel.com/navigation/mlb?tab=game&market=83'
  },
  
  betmgm: {
    bookmaker: 'betmgm',
    displayName: 'BetMGM',
    affiliateUrl: 'https://sports.betmgm.com/en/sports?wm=1234567', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sports.betmgm.com/en/sports/baseball-23/betting/usa-9/mlb-75'
  },
  
  caesars: {
    bookmaker: 'caesars',
    displayName: 'Caesars',
    affiliateUrl: 'https://sportsbook.caesars.com/?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.caesars.com/us/co/baseball/mlb'
  },
  
  betrivers: {
    bookmaker: 'betrivers',
    displayName: 'BetRivers',
    affiliateUrl: 'https://pa.betrivers.com/?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://pa.betrivers.com/online-sports-betting/baseball/mlb'
  },
  
  bovada: {
    bookmaker: 'bovada',
    displayName: 'Bovada',
    affiliateUrl: 'https://www.bovada.lv?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: false
  },
  
  fanatics: {
    bookmaker: 'fanatics',
    displayName: 'Fanatics',
    affiliateUrl: 'https://sportsbook.fanatics.com/?ref=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.fanatics.com/sports/baseball/mlb'
  },
  
  mybookie: {
    bookmaker: 'mybookie',
    displayName: 'MyBookie',
    affiliateUrl: 'https://www.mybookie.ag/?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: false
  }
};

// Fallback URLs for books without affiliate links
export const fallbackUrls: Record<string, string> = {
  draftkings: 'https://sportsbook.draftkings.com',
  fanduel: 'https://sportsbook.fanduel.com',
  betmgm: 'https://sports.betmgm.com',
  caesars: 'https://sportsbook.caesars.com',
  betrivers: 'https://pa.betrivers.com',
  bovada: 'https://www.bovada.lv',
  fanatics: 'https://sportsbook.fanatics.com',
  mybookie: 'https://www.mybookie.ag'
};

// Helper function to get the best URL for a bookmaker with deep linking support
export function getBookmakerUrl(
  bookmakerKey: string, 
  gameInfo?: {
    homeTeam: string;
    awayTeam: string;
    gameId?: string | number;
    sport?: string;
  },
  betInfo?: {
    market: 'moneyline' | 'spread' | 'total' | 'over' | 'under';
    selection: string;
    line?: number;
  }
): string {
  const normalizedKey = bookmakerKey.toLowerCase().replace(/[^a-z]/g, '');
  const affiliate = affiliateLinks[normalizedKey];
  
  // If we have game and bet info, try to generate a deep link
  if (gameInfo && betInfo && affiliate?.deepLinkTemplate && affiliate.deepLinkSupport) {
    try {
      let deepLink = affiliate.deepLinkTemplate;
      
      // Replace template variables
      if (gameInfo.gameId) {
        deepLink = deepLink.replace('{gameId}', gameInfo.gameId.toString());
      }
      deepLink = deepLink.replace('{homeTeam}', encodeURIComponent(gameInfo.homeTeam));
      deepLink = deepLink.replace('{awayTeam}', encodeURIComponent(gameInfo.awayTeam));
      deepLink = deepLink.replace('{market}', betInfo.market);
      deepLink = deepLink.replace('{selection}', encodeURIComponent(betInfo.selection));
      
      // Add affiliate parameters if active
      if (affiliate.isActive) {
        const separator = deepLink.includes('?') ? '&' : '?';
        deepLink += `${separator}ref=betbot`;
      }
      
      return deepLink;
    } catch (error) {
      console.warn(`Failed to generate deep link for ${bookmakerKey}:`, error);
    }
  }
  
  // Check if we have an active affiliate link
  if (affiliate && affiliate.isActive) {
    return affiliate.affiliateUrl;
  }
  
  // Fallback to official website
  return fallbackUrls[normalizedKey] || `https://www.google.com/search?q=${bookmakerKey} sportsbook`;
}

// Helper function to get display name
export function getBookmakerDisplayName(bookmakerKey: string): string {
  const normalizedKey = bookmakerKey.toLowerCase().replace(/[^a-z]/g, '');
  const affiliate = affiliateLinks[normalizedKey];
  return affiliate?.displayName || bookmakerKey;
}