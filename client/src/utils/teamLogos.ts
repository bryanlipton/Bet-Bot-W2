// Team color mappings for simple colored bubbles
export const getTeamColor = (teamName: string): string => {
  const teamColors: { [key: string]: string } = {
    // MLB Teams - using their primary brand colors
    'Boston Red Sox': '#BD3039',
    'New York Yankees': '#132448',
    'Los Angeles Dodgers': '#005A9C',
    'Chicago Cubs': '#0E3386',
    'Atlanta Braves': '#CE1141',
    'Houston Astros': '#002D62',
    'Philadelphia Phillies': '#E81828',
    'St. Louis Cardinals': '#C41E3A',
    'San Francisco Giants': '#FD5A1E',
    'Milwaukee Brewers': '#12284B',
    'San Diego Padres': '#2F241D',
    'New York Mets': '#002D72',
    'Miami Marlins': '#00A3E0',
    'Toronto Blue Jays': '#134A8E',
    'Cleveland Guardians': '#E31937',
    'Tampa Bay Rays': '#092C5C',
    'Baltimore Orioles': '#DF4601',
    'Minnesota Twins': '#002B5C',
    'Chicago White Sox': '#27251F',
    'Oakland Athletics': '#003831',
    'Athletics': '#003831',
    'Detroit Tigers': '#0C2340',
    'Seattle Mariners': '#0C2C56',
    'Texas Rangers': '#003278',
    'Los Angeles Angels': '#BA0021',
    'Kansas City Royals': '#004687',
    'Colorado Rockies': '#33006F',
    'Arizona Diamondbacks': '#A71930',
    'Pittsburgh Pirates': '#FDB827',
    'Cincinnati Reds': '#C6011F',
    'Washington Nationals': '#AB0003',
    
    // NFL Teams
    'New England Patriots': '#002244',
    'Dallas Cowboys': '#003594',
    'Green Bay Packers': '#203731',
    'Pittsburgh Steelers': '#FFB612',
    'San Francisco 49ers': '#AA0000',
    'Kansas City Chiefs': '#E31837',
    'Seattle Seahawks': '#002244',
    'Buffalo Bills': '#00338D',
    
    // NBA Teams  
    'Los Angeles Lakers': '#552583',
    'Boston Celtics': '#007A33',
    'Golden State Warriors': '#1D428A',
    'Chicago Bulls': '#CE1141',
    'Miami Heat': '#98002E',
  };

  // Return team color or default blue
  return teamColors[teamName] || '#3B82F6';
};