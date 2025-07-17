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
    affiliateUrl: 'https://sportsbook.draftkings.com/r/sb/login/signup?wm=betbot123', // Login page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.draftkings.com/leagues/baseball/mlb?category=game-lines&subcategory={gameId}&betslip={market}:{selection}:{odds}'
  },
  
  fanduel: {
    bookmaker: 'fanduel',
    displayName: 'FanDuel',
    affiliateUrl: 'https://account.sportsbook.fanduel.com/login?ref=betbot123', // Login page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.fanduel.com/navigation/mlb/{homeTeam}-{awayTeam}?tab=game&market={market}&selection={selection}&betslip=add'
  },
  
  betmgm: {
    bookmaker: 'betmgm',
    displayName: 'BetMGM',
    affiliateUrl: 'https://account.betmgm.com/en/registration?wm=betbot123', // Login/signup page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sports.betmgm.com/en/sports/baseball-23/betting/usa-9/mlb-75?add-to-betslip={market}:{selection}:{odds}'
  },
  
  caesars: {
    bookmaker: 'caesars',
    displayName: 'Caesars',
    affiliateUrl: 'https://www.caesars.com/sportsbook/registration?affiliate=betbot123', // Login/signup page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.caesars.com/us/co/baseball/mlb?addToBetslip={market}|{selection}|{odds}&game={gameId}'
  },
  
  betrivers: {
    bookmaker: 'betrivers',
    displayName: 'BetRivers',
    affiliateUrl: 'https://account.pa.betrivers.com/account/registration?affiliate=betbot123', // Login/signup page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://pa.betrivers.com/online-sports-betting/baseball/mlb?bet={market}&selection={selection}&odds={odds}&slip=auto'
  },
  
  bovada: {
    bookmaker: 'bovada',
    displayName: 'Bovada',
    affiliateUrl: 'https://www.bovada.lv/welcome/P2A99A1D9/join?affiliate=betbot123', // Login/signup page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: false
  },
  
  fanatics: {
    bookmaker: 'fanatics',
    displayName: 'Fanatics',
    affiliateUrl: 'https://account.sportsbook.fanatics.com/registration?ref=betbot123', // Login/signup page with dummy affiliate
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true,
    deepLinkTemplate: 'https://sportsbook.fanatics.com/sports/baseball/mlb?quickbet={market}:{selection}:{odds}'
  },
  
  mybookie: {
    bookmaker: 'mybookie',
    displayName: 'MyBookie',
    affiliateUrl: 'https://www.mybookie.ag/account/signup/?affiliate=betbot123', // Login/signup page with dummy affiliate
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

// Get affiliate link from environment variables or use default login page
function getAffiliateLink(bookmaker: string, defaultLoginUrl: string): string {
  // Check for environment variable (for production use)
  const envKey = `VITE_${bookmaker.toUpperCase()}_AFFILIATE_URL`;
  const envUrl = import.meta.env[envKey];
  
  if (envUrl) {
    return envUrl;
  }
  
  // Use default login page with dummy affiliate
  return defaultLoginUrl;
}

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
  
  // Check if we have an active affiliate link (using environment variables or default)
  if (affiliate) {
    // Try to get real affiliate link from environment, fallback to login page
    const realAffiliateUrl = getAffiliateLink(normalizedKey, affiliate.affiliateUrl);
    return realAffiliateUrl;
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