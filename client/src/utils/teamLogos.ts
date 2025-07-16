// Simple team abbreviation generator for clean team display
// Uses only team abbreviations - no copyrighted logos or colors

export const getTeamLogo = (teamName: string): string | null => {
  // Since TheSportsDB API is not working and to avoid copyright issues,
  // we'll return null to always show the fallback abbreviation badges
  return null;
};

// Get team abbreviation for fallback display
export const getTeamAbbreviation = (teamName: string): string => {
  // Common team abbreviations
  const abbreviations: { [key: string]: string } = {
    // MLB Teams
    'Boston Red Sox': 'BOS',
    'New York Yankees': 'NYY',
    'Los Angeles Dodgers': 'LAD',
    'Chicago Cubs': 'CHC',
    'Atlanta Braves': 'ATL',
    'Houston Astros': 'HOU',
    'Philadelphia Phillies': 'PHI',
    'St. Louis Cardinals': 'STL',
    'San Francisco Giants': 'SF',
    'Milwaukee Brewers': 'MIL',
    'San Diego Padres': 'SD',
    'New York Mets': 'NYM',
    'Miami Marlins': 'MIA',
    'Toronto Blue Jays': 'TOR',
    'Cleveland Guardians': 'CLE',
    'Tampa Bay Rays': 'TB',
    'Baltimore Orioles': 'BAL',
    'Minnesota Twins': 'MIN',
    'Chicago White Sox': 'CWS',
    'Oakland Athletics': 'OAK',
    'Athletics': 'OAK',
    'Detroit Tigers': 'DET',
    'Seattle Mariners': 'SEA',
    'Texas Rangers': 'TEX',
    'Los Angeles Angels': 'LAA',
    'Kansas City Royals': 'KC',
    'Colorado Rockies': 'COL',
    'Arizona Diamondbacks': 'ARI',
    'Pittsburgh Pirates': 'PIT',
    'Cincinnati Reds': 'CIN',
    'Washington Nationals': 'WSH',
    
    // NFL Teams
    'New England Patriots': 'NE',
    'Dallas Cowboys': 'DAL',
    'Green Bay Packers': 'GB',
    'Pittsburgh Steelers': 'PIT',
    'San Francisco 49ers': 'SF',
    'Kansas City Chiefs': 'KC',
    'Seattle Seahawks': 'SEA',
    'Buffalo Bills': 'BUF',
    
    // NBA Teams  
    'Los Angeles Lakers': 'LAL',
    'Boston Celtics': 'BOS',
    'Golden State Warriors': 'GSW',
    'Chicago Bulls': 'CHI',
    'Miami Heat': 'MIA',
  };

  // Return official abbreviation if available, otherwise generate from first letters
  return abbreviations[teamName] || 
         teamName.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase();
};