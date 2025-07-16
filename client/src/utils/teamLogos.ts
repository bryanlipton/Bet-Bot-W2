import React from 'react';

// Team logo mappings using TheSportsDB API
// Attribution: Team logos provided by TheSportsDB.com

export const getTeamLogo = (teamName: string): string | null => {
  // Map common team names to TheSportsDB logo format
  const teamMappings: { [key: string]: string } = {
    // MLB Teams
    'Boston Red Sox': 'https://www.thesportsdb.com/images/media/team/badge/txpvtv1448813402.png',
    'New York Yankees': 'https://www.thesportsdb.com/images/media/team/badge/xxyxwp1421435600.png',
    'Los Angeles Dodgers': 'https://www.thesportsdb.com/images/media/team/badge/wvqpyx1421418735.png',
    'Chicago Cubs': 'https://www.thesportsdb.com/images/media/team/badge/ywwqtv1421418696.png',
    'Atlanta Braves': 'https://www.thesportsdb.com/images/media/team/badge/tqwrtv1421418616.png',
    'Houston Astros': 'https://www.thesportsdb.com/images/media/team/badge/txvqpv1421418784.png',
    'Philadelphia Phillies': 'https://www.thesportsdb.com/images/media/team/badge/yrrxry1421418885.png',
    'St. Louis Cardinals': 'https://www.thesportsdb.com/images/media/team/badge/tqwuqv1421418934.png',
    'San Francisco Giants': 'https://www.thesportsdb.com/images/media/team/badge/txpupv1421418910.png',
    'Milwaukee Brewers': 'https://www.thesportsdb.com/images/media/team/badge/swrxpv1421418837.png',
    'San Diego Padres': 'https://www.thesportsdb.com/images/media/team/badge/tqwqtu1421418902.png',
    'New York Mets': 'https://www.thesportsdb.com/images/media/team/badge/qwvsvy1421418861.png',
    'Miami Marlins': 'https://www.thesportsdb.com/images/media/team/badge/txputu1421418822.png',
    'Toronto Blue Jays': 'https://www.thesportsdb.com/images/media/team/badge/qwtrqt1421418951.png',
    'Cleveland Guardians': 'https://www.thesportsdb.com/images/media/team/badge/tywxty1421418714.png',
    'Tampa Bay Rays': 'https://www.thesportsdb.com/images/media/team/badge/qvuuty1421418942.png',
    'Baltimore Orioles': 'https://www.thesportsdb.com/images/media/team/badge/tpyutu1421418638.png',
    'Minnesota Twins': 'https://www.thesportsdb.com/images/media/team/badge/twpxrv1421418848.png',
    'Chicago White Sox': 'https://www.thesportsdb.com/images/media/team/badge/ywwqtu1421418705.png',
    'Oakland Athletics': 'https://www.thesportsdb.com/images/media/team/badge/qwvsvy1421418877.png',
    'Athletics': 'https://www.thesportsdb.com/images/media/team/badge/qwvsvy1421418877.png',
    'Detroit Tigers': 'https://www.thesportsdb.com/images/media/team/badge/rwqvsy1421418747.png',
    'Seattle Mariners': 'https://www.thesportsdb.com/images/media/team/badge/qywsvy1421418919.png',
    'Texas Rangers': 'https://www.thesportsdb.com/images/media/team/badge/swpypv1421418950.png',
    'Los Angeles Angels': 'https://www.thesportsdb.com/images/media/team/badge/ysqtpx1421418795.png',
    'Kansas City Royals': 'https://www.thesportsdb.com/images/media/team/badge/rwrqqt1421418787.png',
    'Colorado Rockies': 'https://www.thesportsdb.com/images/media/team/badge/txvwqv1421418723.png',
    'Arizona Diamondbacks': 'https://www.thesportsdb.com/images/media/team/badge/yuqqrq1421418604.png',
    'Pittsburgh Pirates': 'https://www.thesportsdb.com/images/media/team/badge/tqpyqv1421418893.png',
    'Cincinnati Reds': 'https://www.thesportsdb.com/images/media/team/badge/wurxrv1421418689.png',
    'Washington Nationals': 'https://www.thesportsdb.com/images/media/team/badge/tpyrtu1421418960.png',
    
    // Alternative team name mappings for consistency
    'Oakland A\'s': 'https://www.thesportsdb.com/images/media/team/badge/qwvsvy1421418877.png',
    'LA Dodgers': 'https://www.thesportsdb.com/images/media/team/badge/wvqpyx1421418735.png',
    'LA Angels': 'https://www.thesportsdb.com/images/media/team/badge/ysqtpx1421418795.png',
    'NY Yankees': 'https://www.thesportsdb.com/images/media/team/badge/xxyxwp1421435600.png',
    'NY Mets': 'https://www.thesportsdb.com/images/media/team/badge/qwvsvy1421418861.png',
    'SF Giants': 'https://www.thesportsdb.com/images/media/team/badge/txpupv1421418910.png',
    'TB Rays': 'https://www.thesportsdb.com/images/media/team/badge/qvuuty1421418942.png',
    'White Sox': 'https://www.thesportsdb.com/images/media/team/badge/ywwqtu1421418705.png',
    
    // NFL Teams (adding major NFL teams)
    'New England Patriots': 'https://www.thesportsdb.com/images/media/team/badge/qtuwqt1422919040.png',
    'Buffalo Bills': 'https://www.thesportsdb.com/images/media/team/badge/rqsuqv1422919006.png',
    'Miami Dolphins': 'https://www.thesportsdb.com/images/media/team/badge/vvvtps1422919029.png',
    'New York Jets': 'https://www.thesportsdb.com/images/media/team/badge/pvvstp1421767351.png',
    'Pittsburgh Steelers': 'https://www.thesportsdb.com/images/media/team/badge/txuqrq1422919097.png',
    'Cleveland Browns': 'https://www.thesportsdb.com/images/media/team/badge/swqxsp1421767279.png',
    'Baltimore Ravens': 'https://www.thesportsdb.com/images/media/team/badge/tpwxuy1422918997.png',
    'Cincinnati Bengals': 'https://www.thesportsdb.com/images/media/team/badge/rwrwqx1422919007.png',
    'Houston Texans': 'https://www.thesportsdb.com/images/media/team/badge/uwqqtu1422919023.png',
    'Indianapolis Colts': 'https://www.thesportsdb.com/images/media/team/badge/xvpqvp1422919024.png',
    'Tennessee Titans': 'https://www.thesportsdb.com/images/media/team/badge/twxvtu1422919109.png',
    'Jacksonville Jaguars': 'https://www.thesportsdb.com/images/media/team/badge/tyyxyx1422919024.png',
    'Kansas City Chiefs': 'https://www.thesportsdb.com/images/media/team/badge/qwusrv1422919025.png',
    'Denver Broncos': 'https://www.thesportsdb.com/images/media/team/badge/swyvtp1421767252.png',
    'Las Vegas Raiders': 'https://www.thesportsdb.com/images/media/team/badge/wyysyy1422919084.png',
    'Los Angeles Chargers': 'https://www.thesportsdb.com/images/media/team/badge/uwuquy1422919087.png',
    'Dallas Cowboys': 'https://www.thesportsdb.com/images/media/team/badge/wxtxxu1422919010.png',
    'New York Giants': 'https://www.thesportsdb.com/images/media/team/badge/xuwwps1421767365.png',
    'Philadelphia Eagles': 'https://www.thesportsdb.com/images/media/team/badge/spvxrp1421767280.png',
    'Washington Commanders': 'https://www.thesportsdb.com/images/media/team/badge/spqups1421767403.png',
    'Green Bay Packers': 'https://www.thesportsdb.com/images/media/team/badge/sqtrru1422919021.png',
    'Chicago Bears': 'https://www.thesportsdb.com/images/media/team/badge/trqwrt1422919008.png',
    'Minnesota Vikings': 'https://www.thesportsdb.com/images/media/team/badge/ywrrrv1422919032.png',
    'Detroit Lions': 'https://www.thesportsdb.com/images/media/team/badge/twyptu1422919014.png',
    'Tampa Bay Buccaneers': 'https://www.thesportsdb.com/images/media/team/badge/puwspx1421767298.png',
    'New Orleans Saints': 'https://www.thesportsdb.com/images/media/team/badge/tqwspu1421767369.png',
    'Atlanta Falcons': 'https://www.thesportsdb.com/images/media/team/badge/xvyuyp1421767254.png',
    'Carolina Panthers': 'https://www.thesportsdb.com/images/media/team/badge/uwutsx1422919007.png',
    'Los Angeles Rams': 'https://www.thesportsdb.com/images/media/team/badge/wquyuy1422919086.png',
    'San Francisco 49ers': 'https://www.thesportsdb.com/images/media/team/badge/swuyuv1422919089.png',
    'Seattle Seahawks': 'https://www.thesportsdb.com/images/media/team/badge/tvyuvt1422919090.png',
    'Arizona Cardinals': 'https://www.thesportsdb.com/images/media/team/badge/ssyxrr1421767253.png',

    // NBA Teams (adding major NBA teams)
    'Los Angeles Lakers': 'https://www.thesportsdb.com/images/media/team/badge/wvqvyp1420746462.png',
    'Golden State Warriors': 'https://www.thesportsdb.com/images/media/team/badge/vrqpqr1420746275.png',
    'Boston Celtics': 'https://www.thesportsdb.com/images/media/team/badge/pqsvqr1420746260.png',
    'Miami Heat': 'https://www.thesportsdb.com/images/media/team/badge/wrpvts1420746338.png',
    'Chicago Bulls': 'https://www.thesportsdb.com/images/media/team/badge/wqyuvp1420746265.png',
    'San Antonio Spurs': 'https://www.thesportsdb.com/images/media/team/badge/rwrsww1420746425.png',
    'New York Knicks': 'https://www.thesportsdb.com/images/media/team/badge/txtvtq1420746374.png',
    'Brooklyn Nets': 'https://www.thesportsdb.com/images/media/team/badge/tqvwtv1420746256.png',
    'Philadelphia 76ers': 'https://www.thesportsdb.com/images/media/team/badge/wxywtu1420746391.png',
    'Toronto Raptors': 'https://www.thesportsdb.com/images/media/team/badge/qpwpqr1420746445.png',
    'Milwaukee Bucks': 'https://www.thesportsdb.com/images/media/team/badge/qpqsqv1420746343.png',
    'Indiana Pacers': 'https://www.thesportsdb.com/images/media/team/badge/tqtups1420746295.png',
    'Atlanta Hawks': 'https://www.thesportsdb.com/images/media/team/badge/rpsypr1420746251.png',
    'Charlotte Hornets': 'https://www.thesportsdb.com/images/media/team/badge/wxyqrs1420746262.png',
    'Orlando Magic': 'https://www.thesportsdb.com/images/media/team/badge/qysqwu1420746381.png',
    'Washington Wizards': 'https://www.thesportsdb.com/images/media/team/badge/vpqvqr1420746452.png',
    'Cleveland Cavaliers': 'https://www.thesportsdb.com/images/media/team/badge/ysvsyu1420746267.png',
    'Detroit Pistons': 'https://www.thesportsdb.com/images/media/team/badge/xxuwtu1420746272.png',
    'Denver Nuggets': 'https://www.thesportsdb.com/images/media/team/badge/qpvprv1420746269.png',
    'Utah Jazz': 'https://www.thesportsdb.com/images/media/team/badge/xsyvys1420746448.png',
    'Oklahoma City Thunder': 'https://www.thesportsdb.com/images/media/team/badge/qyswrw1420746378.png',
    'Portland Trail Blazers': 'https://www.thesportsdb.com/images/media/team/badge/uysxvt1420746398.png',
    'Minnesota Timberwolves': 'https://www.thesportsdb.com/images/media/team/badge/ywwywp1420746350.png',
    'Los Angeles Clippers': 'https://www.thesportsdb.com/images/media/team/badge/wswuvp1420746313.png',
    'Sacramento Kings': 'https://www.thesportsdb.com/images/media/team/badge/vuurvs1420746413.png',
    'Phoenix Suns': 'https://www.thesportsdb.com/images/media/team/badge/sxvsws1420746393.png',
    'Dallas Mavericks': 'https://www.thesportsdb.com/images/media/team/badge/xxwtwr1420746268.png',
    'Houston Rockets': 'https://www.thesportsdb.com/images/media/team/badge/wuwytr1420746289.png',
    'Memphis Grizzlies': 'https://www.thesportsdb.com/images/media/team/badge/xsyuqq1420746336.png',
    'New Orleans Pelicans': 'https://www.thesportsdb.com/images/media/team/badge/rptvys1420746367.png'
  };

  return teamMappings[teamName] || null;
};

// Component for displaying team logo with fallback
export interface TeamLogoProps {
  teamName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ teamName, className = '', size = 'md' }) => {
  const logoUrl = getTeamLogo(teamName);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  if (!logoUrl) {
    return null;
  }

  return React.createElement('img', {
    src: logoUrl,
    alt: `${teamName} logo`,
    className: `object-contain ${sizeClasses[size]} ${className}`,
    onError: (e: any) => {
      e.currentTarget.style.display = 'none';
    }
  });
};