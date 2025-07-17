// Affiliate links configuration
// Update this file to add new affiliate links for each sportsbook

export interface AffiliateLink {
  bookmaker: string;
  displayName: string;
  affiliateUrl: string;
  isActive: boolean;
  deepLinkSupport: boolean;
}

export const affiliateLinks: Record<string, AffiliateLink> = {
  // Major US Sportsbooks
  draftkings: {
    bookmaker: 'draftkings',
    displayName: 'DraftKings',
    affiliateUrl: 'https://sportsbook.draftkings.com/r/sb/1234567', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true
  },
  
  fanduel: {
    bookmaker: 'fanduel',
    displayName: 'FanDuel',
    affiliateUrl: 'https://sportsbook.fanduel.com/?ref=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true
  },
  
  betmgm: {
    bookmaker: 'betmgm',
    displayName: 'BetMGM',
    affiliateUrl: 'https://sports.betmgm.com/en/sports?wm=1234567', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true
  },
  
  caesars: {
    bookmaker: 'caesars',
    displayName: 'Caesars',
    affiliateUrl: 'https://sportsbook.caesars.com/?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: true
  },
  
  betrivers: {
    bookmaker: 'betrivers',
    displayName: 'BetRivers',
    affiliateUrl: 'https://pa.betrivers.com/?affiliate=betbot', // Replace with actual affiliate link
    isActive: false, // Set to true when we have approved affiliate link
    deepLinkSupport: false
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
    deepLinkSupport: false
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

// Helper function to get the best URL for a bookmaker
export function getBookmakerUrl(bookmakerKey: string): string {
  const normalizedKey = bookmakerKey.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check if we have an active affiliate link
  const affiliate = affiliateLinks[normalizedKey];
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