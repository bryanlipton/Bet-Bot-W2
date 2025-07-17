// Deep Link Builder for Sportsbook Integration
// Combines The Odds API deep links with manual URL patterns and affiliate tracking

interface GameInfo {
  homeTeam: string;
  awayTeam: string;
  gameId?: string | number;
  sport?: string;
  gameTime?: string;
}

interface BetInfo {
  market: string;
  selection: string;
  line?: number;
}

// Affiliate tracking parameters by sportsbook
const affiliateParams = {
  draftkings: "&utm_source=betbot123",
  fanduel: "?ref=betbot123", 
  caesars: "?ref=betbot123",
  betmgm: "?ref=betbot123",
  espnbet: "?ref=betbot123",
  pointsbet: "?ref=betbot123",
  betrivers: "?ref=betbot123",
  bovada: "?ref=betbot123",
  mybookie: "?ref=betbot123",
  fanatics: "?ref=betbot123"
};

// Convert team names to URL-friendly slugs
function teamToSlug(teamName: string): string {
  return teamName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Format date for different sportsbook requirements
function formatGameDate(gameTime?: string): string {
  if (!gameTime) return new Date().toISOString().split('T')[0];
  return new Date(gameTime).toISOString().split('T')[0];
}

// Build deep link using manual URL patterns when Odds API links aren't available
function buildManualDeepLink(
  bookmakerKey: string, 
  gameInfo: GameInfo, 
  betInfo?: BetInfo
): string {
  const team1 = teamToSlug(gameInfo.awayTeam);
  const team2 = teamToSlug(gameInfo.homeTeam);
  const gameDate = formatGameDate(gameInfo.gameTime);
  const affiliate = affiliateParams[bookmakerKey as keyof typeof affiliateParams] || '';

  switch (bookmakerKey.toLowerCase()) {
    case 'draftkings':
      // Best deep linking support - can use event ID if available
      if (gameInfo.gameId) {
        return `https://sportsbook.draftkings.com/leagues/baseball/mlb?category=game-lines&event=${gameInfo.gameId}${affiliate}`;
      }
      return `https://sportsbook.draftkings.com/leagues/baseball/mlb${affiliate}`;

    case 'fanduel':
      // FanDuel main page - use www domain which should work better
      return `https://www.fanduel.com/sportsbook${affiliate}`;

    case 'betmgm':
      // League-level deep linking
      return `https://sports.nj.betmgm.com/en/sports/baseball-7/betting/usa-9/major-league-baseball-6009${affiliate}`;

    case 'caesars':
      // Basic sportsbook access
      return `https://www.caesars.com/sportsbook${affiliate}`;

    case 'espnbet':
      // Game-level support for some matchups
      return `https://www.espnbet.com/mlb/${team1}-vs-${team2}${affiliate}`;

    case 'betrivers':
      // Sport-level deep linking
      return `https://www.betrivers.com/sportsbook/baseball${affiliate}`;

    case 'pointsbet':
      // Sport-level only
      return `https://nj.pointsbet.com/sports/baseball${affiliate}`;

    case 'bovada':
      // Basic access
      return `https://www.bovada.lv/sports/baseball${affiliate}`;

    case 'mybookie':
      // Basic access  
      return `https://www.mybookie.ag/sportsbook/mlb${affiliate}`;

    case 'fanatics':
      // Sport-level access
      return `https://www.fanaticssportsbook.com/mlb${affiliate}`;

    default:
      return '#';
  }
}

// Check if user is likely logged in (basic heuristic)
function isLikelyLoggedIn(bookmakerKey: string): boolean {
  // In a real implementation, you might check localStorage, cookies, or make API calls
  // For now, return false to always direct to login-friendly pages
  return false;
}

// Build the best possible deep link using Odds API data + manual patterns
export function buildDeepLink(
  bookmakerKey: string,
  gameInfo: GameInfo,
  betInfo?: BetInfo,
  oddsApiLinks?: {
    bookmakerLink?: string;
    marketLink?: string; 
    outcomeLink?: string;
  }
): { url: string; hasDeepLink: boolean; linkType: string } {
  // Special handling for FanDuel - prioritize their API links since manual links are blocked
  if (bookmakerKey.toLowerCase() === 'fanduel') {
    if (oddsApiLinks?.outcomeLink) {
      return {
        url: oddsApiLinks.outcomeLink,
        hasDeepLink: true,
        linkType: 'bet-slip'
      };
    }
    if (oddsApiLinks?.marketLink) {
      return {
        url: oddsApiLinks.marketLink,
        hasDeepLink: true,
        linkType: 'market'
      };
    }
    if (oddsApiLinks?.bookmakerLink) {
      return {
        url: oddsApiLinks.bookmakerLink,
        hasDeepLink: true,
        linkType: 'game'
      };
    }
    // FanDuel fallback - direct to main site since they block specific URLs
    return {
      url: 'https://www.fanduel.com/?ref=betbot123',
      hasDeepLink: false,
      linkType: 'manual'
    };
  }

  // Priority hierarchy for other bookmakers: outcome > market > bookmaker > manual pattern
  if (oddsApiLinks?.outcomeLink) {
    // Best case: Direct bet slip link
    const affiliate = affiliateParams[bookmakerKey as keyof typeof affiliateParams] || '';
    const connector = oddsApiLinks.outcomeLink.includes('?') ? '&' : '?';
    return {
      url: `${oddsApiLinks.outcomeLink}${connector}${affiliate.replace('?', '')}`,
      hasDeepLink: true,
      linkType: 'bet-slip'
    };
  }

  if (oddsApiLinks?.marketLink) {
    // Good: Market-specific page
    const affiliate = affiliateParams[bookmakerKey as keyof typeof affiliateParams] || '';
    const connector = oddsApiLinks.marketLink.includes('?') ? '&' : '?';
    return {
      url: `${oddsApiLinks.marketLink}${connector}${affiliate.replace('?', '')}`,
      hasDeepLink: true,
      linkType: 'market'
    };
  }

  if (oddsApiLinks?.bookmakerLink) {
    // Decent: Game-specific page
    const affiliate = affiliateParams[bookmakerKey as keyof typeof affiliateParams] || '';
    const connector = oddsApiLinks.bookmakerLink.includes('?') ? '&' : '?';
    return {
      url: `${oddsApiLinks.bookmakerLink}${connector}${affiliate.replace('?', '')}`,
      hasDeepLink: true,
      linkType: 'game'
    };
  }

  // Fallback: Manual deep link patterns
  return {
    url: buildManualDeepLink(bookmakerKey, gameInfo, betInfo),
    hasDeepLink: false,
    linkType: 'manual'
  };
}

// Get login page URL for sportsbooks
export function getLoginUrl(bookmakerKey: string): string {
  const affiliate = affiliateParams[bookmakerKey as keyof typeof affiliateParams] || '';
  
  const loginUrls: Record<string, string> = {
    draftkings: `https://sportsbook.draftkings.com/login${affiliate}`,
    fanduel: `https://www.fanduel.com/sportsbook/login?ref=betbot123`,
    betmgm: `https://sports.nj.betmgm.com/login${affiliate}`,
    caesars: `https://www.caesars.com/sportsbook/login${affiliate}`,
    espnbet: `https://www.espnbet.com/login${affiliate}`,
    betrivers: `https://www.betrivers.com/login${affiliate}`,
    pointsbet: `https://nj.pointsbet.com/login${affiliate}`,
    bovada: `https://www.bovada.lv/login${affiliate}`,
    mybookie: `https://www.mybookie.ag/login${affiliate}`,
    fanatics: `https://www.fanaticssportsbook.com/login${affiliate}`
  };

  return loginUrls[bookmakerKey.toLowerCase()] || buildManualDeepLink(bookmakerKey, { homeTeam: '', awayTeam: '' });
}