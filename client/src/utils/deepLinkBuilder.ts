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
      // Enhanced game-specific URL with bet type targeting
      if (gameInfo.gameId) {
        const betType = betInfo?.market === 'spread' ? 'spreads' : betInfo?.market === 'total' ? 'totals' : 'moneyline';
        return `https://sportsbook.draftkings.com/leagues/baseball/mlb?category=game-lines&subcategory=${betType}&event=${gameInfo.gameId}${affiliate}`;
      }
      return `https://sportsbook.draftkings.com/leagues/baseball/mlb?category=game-lines${affiliate}`;

    case 'fanduel':
      // FanDuel main sportsbook homepage - most reliable entry point
      return `https://www.fanduel.com/sportsbook${affiliate}`;

    case 'betmgm':
      // BetMGM homepage - sports section blocked by 403
      return `https://betmgm.com/${affiliate.replace('?', '#')}`;

    case 'caesars':
      // Enhanced MLB-specific targeting
      return `https://sportsbook.caesars.com/us/co/baseball/mlb?game=${team1}-${team2}${affiliate}`;

    case 'espnbet':
      // Game-specific URL with enhanced targeting
      const espnBetType = betInfo?.market === 'spread' ? 'spread' : betInfo?.market === 'total' ? 'total' : 'moneyline';
      return `https://www.espnbet.com/mlb/${team1}-vs-${team2}?market=${espnBetType}${affiliate}`;

    case 'betrivers':
      // Enhanced MLB game targeting
      return `https://www.betrivers.com/online-sports-betting/baseball/mlb/${team1}-vs-${team2}${affiliate}`;

    case 'pointsbet':
      // Enhanced sport-level with game hint
      return `https://nj.pointsbet.com/sports/baseball/mlb/${team1}-${team2}${affiliate}`;

    case 'bovada':
      // Enhanced MLB game targeting
      return `https://www.bovada.lv/sports/baseball/mlb/${team1}-vs-${team2}${affiliate}`;

    case 'mybookie':
      // Enhanced MLB targeting with game info
      return `https://www.mybookie.ag/sportsbook/mlb/${team1}-${team2}${affiliate}`;

    case 'fanatics':
      // Simplified approach - go to MLB main page to avoid URL structure issues
      return `https://sportsbook.fanatics.com/sports/baseball${affiliate}`;

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
  // Special handling for Fanatics - bypass API links that cause XML errors
  if (bookmakerKey.toLowerCase() === 'fanatics') {
    return {
      url: buildManualDeepLink('fanatics', gameInfo, betInfo),
      hasDeepLink: false,
      linkType: 'manual'
    };
  }
  
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
    draftkings: `https://sportsbook.draftkings.com/account/signup?wm=betbot123`,
    fanduel: `https://account.fanduel.com/registration?ref=betbot123`,
    betmgm: `https://account.nj.betmgm.com/registration?wm=betbot123`,
    caesars: `https://www.caesars.com/sportsbook/account/registration?affiliate=betbot123`,
    espnbet: `https://account.espnbet.com/registration?ref=betbot123`,
    betrivers: `https://account.betrivers.com/registration?affiliate=betbot123`,
    pointsbet: `https://nj.pointsbet.com/account/register?promo=betbot123`,
    bovada: `https://www.bovada.lv/welcome/P2A99A1D9/join?ref=betbot123`,
    mybookie: `https://www.mybookie.ag/account/register?affiliate=betbot123`,
    fanatics: `https://account.fanaticssportsbook.com/registration?ref=betbot123`
  };

  return loginUrls[bookmakerKey.toLowerCase()] || buildManualDeepLink(bookmakerKey, { homeTeam: '', awayTeam: '' });
}