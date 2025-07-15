import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  status: string;
  commenceTime: string;
}

interface LiveOddsMonitorProps {
  liveGames: Game[];
}

export default function LiveOddsMonitor({ liveGames }: LiveOddsMonitorProps) {
  const formatGameTime = (commenceTime: string, status: string) => {
    if (status === "live") {
      return `Q${Math.floor(Math.random() * 4) + 1} ${Math.floor(Math.random() * 15) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    }
    
    const time = new Date(commenceTime);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
  };

  const mockOdds = () => ({
    moneyline: {
      home: Math.floor(Math.random() * 200) - 100,
      away: Math.floor(Math.random() * 200) - 100,
    },
    total: {
      points: (Math.random() * 20 + 40).toFixed(1),
      odds: -110
    },
    edge: (Math.random() * 8 + 1).toFixed(1)
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Odds Monitor
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Real-time</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {liveGames.length === 0 ? (
            <>
              {/* Mock live games when no real data */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Chiefs @ Raiders
                    </span>
                    <Badge variant="destructive" className="text-xs">LIVE</Badge>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Q2 14:32</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Moneyline</div>
                    <div className="font-medium text-gray-900 dark:text-white">KC: -165 | LV: +140</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Total</div>
                    <div className="font-medium text-gray-900 dark:text-white">O/U 47.5 (-110)</div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Edge detected:</span>
                    <span className="text-xs font-medium text-success">+3.2% on Over</span>
                  </div>
                  <Button variant="link" size="sm" className="text-xs">
                    View Details
                  </Button>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Cowboys @ Eagles
                    </span>
                    <Badge variant="secondary" className="text-xs">UPCOMING</Badge>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">8:20 PM ET</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Spread</div>
                    <div className="font-medium text-gray-900 dark:text-white">DAL +3.5 | PHI -3.5</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Total</div>
                    <div className="font-medium text-gray-900 dark:text-white">O/U 42.5 (-105)</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            liveGames.map((game) => {
              const odds = mockOdds();
              return (
                <div key={game.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {game.awayTeam} @ {game.homeTeam}
                      </span>
                      <Badge 
                        variant={game.status === "live" ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {game.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatGameTime(game.commenceTime, game.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Moneyline</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {game.homeTeam.slice(0, 3).toUpperCase()}: {odds.moneyline.home > 0 ? '+' : ''}{odds.moneyline.home} | 
                        {game.awayTeam.slice(0, 3).toUpperCase()}: {odds.moneyline.away > 0 ? '+' : ''}{odds.moneyline.away}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Total</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        O/U {odds.total.points} ({odds.total.odds})
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Edge detected:</span>
                      <span className="text-xs font-medium text-success">+{odds.edge}% on Over</span>
                    </div>
                    <Button variant="link" size="sm" className="text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
