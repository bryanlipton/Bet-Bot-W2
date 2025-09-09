// Function to clean team names - remove mascots and extra text
const cleanTeamName = (teamName: string): string => {
  // Remove common mascot names and extra text
  return teamName
    .replace(/\s+(Wildcats|Buffaloes|Cougars|Wolfpack|Demon Deacons|Bruins|Lobos|Tigers|Eagles|Cardinals|Crimson Tide|Bulldogs|Gators|Volunteers|Aggies|Commodores|Razorbacks|Rebels|Gamecocks|Blue Devils|Yellow Jackets|Fighting Irish|Spartans|Wolverines|Buckeyes|Nittany Lions|Boilermakers|Scarlet Knights|Badgers|Hawkeyes|Hoosiers|Golden Gophers|Cornhuskers|Fighting Illini|Bears|Cowboys|Red Raiders|Mountaineers|Horned Frogs|Cyclones|Jayhawks|Sooners|Orange|Seminoles|Hurricanes|Tar Heels|Panthers|Cavaliers|Hokies|Deacons|Ducks|Beavers|Trojans|Sun Devils|Utes|Huskies|Cardinal|Golden Bears).*$/i, '')
    .replace(/\s+(State|University|College|Tech).*$/i, ' $1')
    .replace(/University of\s+/i, '')
    .replace(/\s+State.*$/i, ' State')
    .trim();
};

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock,
  TrendingUp,
  Lock,
  Info
} from "lucide-react";
import { getTeamColor } from "@/utils/teamLogos";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { GameDetailsModal } from "./GameDetailsModal";

interface GameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  sport?: string;
  prediction?: {
    homeWinProbability: number;
    awayWinProbability: number;
    confidence: number;
    edge?: string;
  };
  isLive?: boolean;
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
  gameId?: string | number;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
  isDailyPick?: boolean;
  dailyPickTeam?: string;
  dailyPickGrade?: string;
  dailyPickId?: string;
  lockPickTeam?: string;
  lockPickGrade?: string;
  lockPickId?: string;
  isAuthenticated?: boolean;
  onClick?: () => void;
  rawBookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
    last_update: string;
  }>;
}

// SAFE DATE FORMATTING FUNCTION - NO CRASHES
const formatGameTime = (startTime?: string): string => {
  try {
    if (!startTime) return "TBD";
    
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return "TBD";
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const time = date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return time;  // Just show time for today's games
    } else if (isTomorrow) {
      return `Tomorrow ${time}`;
    } else {
      // Show date for future games
      return `${date.getMonth()+1}/${date.getDate()} ${time}`;
    }
  } catch (error) {
    console.warn('Error formatting time:', error);
    return "TBD";
  }
};

const getTeamColorBySport = (teamName: string, sport?: string): string => {
  if (sport === 'americanfootball_nfl') {
    const nflColors: Record<string, string> = {
      'Arizona Cardinals': '#97233F',
      'Atlanta Falcons': '#A71930',
      'Baltimore Ravens': '#241773',
      'Buffalo Bills': '#00338D',
      'Carolina Panthers': '#0085CA',
      'Chicago Bears': '#C83803',
      'Cincinnati Bengals': '#FB4F14',
      'Cleveland Browns': '#311D00',
      'Dallas Cowboys': '#041E42',
      'Denver Broncos': '#FB4F14',
      'Detroit Lions': '#0076B6',
      'Green Bay Packers': '#203731',
      'Houston Texans': '#03202F',
      'Indianapolis Colts': '#002C5F',
      'Jacksonville Jaguars': '#9F792C',
      'Kansas City Chiefs': '#E31837',
      'Las Vegas Raiders': '#000000',
      'Los Angeles Chargers': '#0080C6',
      'Los Angeles Rams': '#003594',
      'Miami Dolphins': '#008E97',
      'Minnesota Vikings': '#4F2683',
      'New England Patriots': '#002244',
      'New Orleans Saints': '#D3BC8D',
      'New York Giants': '#0B2265',
      'New York Jets': '#125740',
      'Philadelphia Eagles': '#004C54',
      'Pittsburgh Steelers': '#FFB612',
      'San Francisco 49ers': '#AA0000',
      'Seattle Seahawks': '#002244',
      'Tampa Bay Buccaneers': '#D50A0A',
      'Tennessee Titans': '#0C2340',
      'Washington Commanders': '#5A1414'
    };
    return nflColors[teamName] || '#6B7280';
  }
  
  if (sport === 'basketball_nba') {
    const nbaColors: Record<string, string> = {
      'Atlanta Hawks': '#E03A3E',
      'Boston Celtics': '#007A33',
      'Brooklyn Nets': '#000000',
      'Charlotte Hornets': '#1D1160',
      'Chicago Bulls': '#CE1141',
      'Cleveland Cavaliers': '#6F263D',
      'Dallas Mavericks': '#00538C',
      'Denver Nuggets': '#0E2240',
      'Detroit Pistons': '#C8102E',
      'Golden State Warriors': '#1D428A',
      'Houston Rockets': '#CE1141',
      'Indiana Pacers': '#002D62',
      'Los Angeles Clippers': '#C8102E',
      'Los Angeles Lakers': '#552583',
      'Memphis Grizzlies': '#5D76A9',
      'Miami Heat': '#98002E',
      'Milwaukee Bucks': '#00471B',
      'Minnesota Timberwolves': '#0C2340',
      'New Orleans Pelicans': '#0C2340',
      'New York Knicks': '#006BB6',
      'Oklahoma City Thunder': '#007AC1',
      'Orlando Magic': '#0077C0',
      'Philadelphia 76ers': '#006BB6',
      'Phoenix Suns': '#1D1160',
      'Portland Trail Blazers': '#E03A3E',
      'Sacramento Kings': '#5A2D81',
      'San Antonio Spurs': '#C4CED4',
      'Toronto Raptors': '#CE1141',
      'Utah Jazz': '#002B5C',
      'Washington Wizards': '#002B5C'
    };
    return nbaColors[teamName] || '#6B7280';
  }
  
  if (sport === 'americanfootball_ncaaf') {
    const cfbColors: Record<string, string> = {
      // SEC
      'Alabama': '#9E1B32',
      'Auburn': '#0C385B',
      'Arkansas': '#9D2235',
      'Florida': '#0021A5',
      'Georgia': '#BA0C2F',
      'Kentucky': '#0033A0',
      'LSU': '#461D7C',
      'Mississippi State': '#5D1725',
      'Missouri': '#F1B82D',
      'Ole Miss': '#14213D',
      'South Carolina': '#73000A',
      'Tennessee': '#FF8200',
      'Texas A&M': '#500000',
      'Vanderbilt': '#866D4B',
      'Texas': '#BF5700',
      'Oklahoma': '#841617',
      
      // ACC
      'Clemson': '#F56600',
      'Duke': '#003087',
      'Florida State': '#782F40',
      'Georgia Tech': '#B3A369',
      'Louisville': '#AD0000',
      'Miami': '#F47321',
      'North Carolina': '#4B9CD3',
      'NC State': '#CC0000',
      'Pittsburgh': '#003594',
      'Syracuse': '#D44500',
      'Virginia': '#232D4B',
      'Virginia Tech': '#861F41',
      'Wake Forest': '#9E7E38',
      'Boston College': '#8B2635',
      'Cal': '#003262',
      'Stanford': '#8C1515',
      'SMU': '#C8102E',
      
      // Big Ten
      'Illinois': '#13294B',
      'Indiana': '#990000',
      'Iowa': '#FFCD00',
      'Maryland': '#E03A3E',
      'Michigan': '#00274C',
      'Michigan State': '#18453B',
      'Minnesota': '#7A0019',
      'Nebraska': '#D00000',
      'Northwestern': '#4E2A84',
      'Ohio State': '#BB0000',
      'Penn State': '#041E42',
      'Purdue': '#CEB888',
      'Rutgers': '#CC0033',
      'Wisconsin': '#C5050C',
      'Oregon': '#154733',
      'UCLA': '#2774AE',
      'USC': '#990000',
      'Washington': '#4B2E83',
      
      // Big 12
      'Baylor': '#003015',
      'Iowa State': '#C8102E',
      'Kansas': '#0051BA',
      'Kansas State': '#512888',
      'Oklahoma State': '#FF7300',
      'TCU': '#4D1979',
      'Texas Tech': '#CC0000',
      'West Virginia': '#002855',
      'Cincinnati': '#E00122',
      'Houston': '#C8102E',
      'UCF': '#000000',
      'BYU': '#002E5D',
      'Colorado': '#CFB87C',
      'Arizona': '#003366',
      'Arizona State': '#8C1D40',
      'Utah': '#CC0000',
      
      // Pac-12 & Others
      'Oregon State': '#DC4405',
      'Washington State': '#981E32',
      'California': '#003262',
      'Notre Dame': '#0C2340',
      
      // Additional mappings for common API variations
      'Arizona Wildcats': '#003366',
      'Colorado Buffaloes': '#CFB87C',
      'Houston Cougars': '#C8102E',
      'Kansas State Wildcats': '#512888',
      'NC State Wolfpack': '#CC0000',
      'Wake Forest Demon Deacons': '#9E7E38',
      'New Mexico Lobos': '#CC0000',
      'UCLA Bruins': '#2774AE'
    };
    
    // First try exact match
    let color = cfbColors[teamName];
    if (color) return color;
    
    // If no exact match, try partial matching
    for (const [key, colorValue] of Object.entries(cfbColors)) {
      // Check if the API name contains the dictionary key
      if (teamName.toLowerCase().includes(key.toLowerCase())) {
        return colorValue;
      }
      // Check if the dictionary key contains the API name
      if (key.toLowerCase().includes(teamName.toLowerCase().replace(/\s+(wolves|wildcats|buffaloes|cougars|wolfpack|demon deacons|bruins|lobos).*$/i, ''))) {
        return colorValue;
      }
    }
    
    return '#6B7280'; // Default gray if no match
  }
  
  // MLB colors (default)
  const mlbColors: Record<string, string> = {
    'Arizona Diamondbacks': '#A71930',
    'Atlanta Braves': '#CE1141',
    'Baltimore Orioles': '#DF4601',
    'Boston Red Sox': '#BD3039',
    'Chicago Cubs': '#0E3386',
    'Chicago White Sox': '#27251F',
    'Cincinnati Reds': '#C6011F',
    'Cleveland Guardians': '#E31937',
    'Colorado Rockies': '#33006F',
    'Detroit Tigers': '#0C2340',
    'Houston Astros': '#002D62',
    'Kansas City Royals': '#004687',
    'Los Angeles Angels': '#BA0021',
    'Los Angeles Dodgers': '#005A9C',
    'Miami Marlins': '#00A3E0',
    'Milwaukee Brewers': '#12284B',
    'Minnesota Twins': '#002B5C',
    'New York Mets': '#002D72',
    'New York Yankees': '#132448',
    'Oakland Athletics': '#003831',
    'Philadelphia Phillies': '#E81828',
    'Pittsburgh Pirates': '#FDB827',
    'San Diego Padres': '#2F241D',
    'San Francisco Giants': '#FD5A1E',
    'Seattle Mariners': '#0C2C56',
    'St. Louis Cardinals': '#C41E3A',
    'Tampa Bay Rays': '#092C5C',
    'Texas Rangers': '#003278',
    'Toronto Blue Jays': '#134A8E',
    'Washington Nationals': '#AB0003'
  };
  return mlbColors[teamName] || '#6B7280';
};

export function ActionStyleGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  spread,
  total,
  startTime,
  prediction,
  isLive = false,
  bookmakers,
  gameId,
  probablePitchers,
  isDailyPick = false,
  dailyPickTeam,
  dailyPickGrade,
  dailyPickId,
  lockPickTeam,
  lockPickGrade,
  lockPickId,
  isAuthenticated = false,
  onClick,
  rawBookmakers,
  sport = 'baseball_mlb'
}: GameCardProps) {
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);

  const handleMakePick = (event: React.MouseEvent, market: 'moneyline' | 'spread' | 'total', selection: string, line?: number) => {
    try {
      event.stopPropagation();
      event.preventDefault();
      
      if (!rawBookmakers || rawBookmakers.length === 0) {
        console.warn('No bookmakers data available for odds comparison');
        alert('No betting odds available for this game yet. Please try again later.');
        return;
      }

      setOddsModalOpen(false);
      setSelectedBet(null);
      
      setTimeout(() => {
        try {
          setSelectedBet({ market, selection, line });
          setOddsModalOpen(true);
        } catch (timeoutError) {
          console.error('Error in timeout function:', timeoutError);
          alert('Error in delayed modal opening. Please try again.');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in handleMakePick:', error);
      alert(`Critical error opening betting options: ${error.message}. Please try again or refresh the page.`);
    }
  };

  const formatOdds = (odds: number) => {
    if (odds > 0) {
      return `+${Math.round(odds)}`;
    } else {
      return `${Math.round(odds)}`;
    }
  };

  const getBetRecommendation = () => {
    if (!prediction) return null;
    
    const homeProb = prediction.homeWinProbability;
    const awayProb = prediction.awayWinProbability;
    
    if (homeProb > 0.55) return { team: homeTeam, type: "home", prob: homeProb };
    if (awayProb > 0.55) return { team: awayTeam, type: "away", prob: awayProb };
    return null;
  };

  const recommendation = getBetRecommendation();

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
  {sport === 'americanfootball_nfl' ? 'NFL' : 
   sport === 'basketball_nba' ? 'NBA' : 
   sport === 'americanfootball_ncaaf' ? 'CFB' : 'MLB'}
</Badge>
            {isLive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatGameTime(startTime)}
            </span>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-2 sm:mb-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="col-span-2 text-xs">Teams</div>
          <div className="text-center text-xs sm:text-sm">Odds</div>
          <div className="text-center text-xs sm:text-sm">Pick</div>
          <div className="text-center text-xs">Pro Pick</div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* Away Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: getTeamColorBySport(awayTeam, sport) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{cleanTeamName(awayTeam)}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {awayOdds ? formatOdds(awayOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">TBD</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {awayOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', awayTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColorBySport(awayTeam, sport) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Home Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: getTeamColorBySport(homeTeam, sport) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{cleanTeamName(homeTeam)}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {homeOdds ? formatOdds(homeOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">TBD</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {homeOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', homeTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColorBySport(homeTeam, sport) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

// Usage in your component - replace the team name display
// Instead of: {awayTeam}
// Use: {cleanTeamName(awayTeam)}

// Example transformations:
// "NC State Wolfpack" → "NC State"
// "Wake Forest Demon Deacons" → "Wake Forest"
// "Kansas State Wildcats" → "Kansas State"
// "Arizona Wildcats" → "Arizona"
// "Colorado Buffaloes" → "Colorado"
// "Houston Cougars" → "Houston"
// "University of Alabama" → "Alabama"
// "Florida State Seminoles" → "Florida State"
