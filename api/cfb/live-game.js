// Add this function at the top
const getSchoolName = (teamName) => {
  if (!teamName) return teamName;
  
  // Common mascot patterns to remove
  const mascotPatterns = [
    /\s+(Tigers|Bulldogs|Eagles|Bears|Lions|Cardinals|Wildcats|Wolverines|Buckeyes|Sooners|Crimson Tide|Blue Devils|Tar Heels|Seminoles|Gators|Volunteers|Commodores|Razorbacks|Aggies|Longhorns|Cowboys|Red Raiders|Horned Frogs|Jayhawks|Cyclones|Mountaineers|Hoosiers|Spartans|Fighting Irish|Golden Eagles|Panthers|Hurricanes|Hokies|Demon Deacons|Yellow Jackets|Orange|Orangemen|Knights|Bulls|Huskies|Ducks|Beavers|Sun Devils|Trojans|Bruins|Golden Bears|Cardinal|Fighting Illini|Badgers|Golden Gophers|Cornhuskers|Nittany Lions|Terrapins|Scarlet Knights|Boilermakers|Hawkeyes|Gamecocks|Rebels|Black Bears|Golden Flashes|Broncos|Rams|Falcons|Rainbow Warriors)$/i
  ];
  
  let schoolName = teamName;
  
  // Remove mascot patterns
  mascotPatterns.forEach(pattern => {
    schoolName = schoolName.replace(pattern, '');
  });
  
  return schoolName.trim();
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const cleanGameId = gameId.replace('cfb_', '');
    
    // Try multiple ESPN endpoints in order of preference
    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${cleanGameId}`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${cleanGameId}`,
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`,
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${cleanGameId}&enable=boxscore`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${cleanGameId}/competitions`
    ];
    
    let gameData = null;
    let situation = {};
    let teams = { home: null, away: null };
    
    // Try each endpoint until we find detailed data
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Handle different data structures based on endpoint
        if (endpoint.includes('summary')) {
          if (data.header) {
            gameData = data.header;
            situation = data.header.competitions?.[0]?.situation || {};
            // Extract team info for possession mapping
            const competition = data.header.competitions?.[0];
            if (competition?.competitors) {
              teams.home = competition.competitors.find(c => c.
