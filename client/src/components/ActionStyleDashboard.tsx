import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";

// Simple DailyPick component
function DailyPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-pick')
      .then(res => res.json())
      .then(data => {
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 bg-blue-900/20 rounded">Loading...</div>;
  if (!pick) return <div className="p-6 bg-blue-900/20 rounded">No pick today</div>;

  return (
    <div className="p-6 bg-blue-900/20 rounded border border-blue-500/30">
      <h3 className="text-xl font-bold text-blue-400">Pick of the Day</h3>
      <div className="text-lg mt-2 text-white">
        {pick.pickTeam} ML {pick.odds > 0 ? '+' : ''}{pick.odds}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="bg-green-600 text-white py-2 rounded">Pick</button>
        <button className="bg-red-600 text-white py-2 rounded">Fade</button>
      </div>
    </div>
  );
}

// Simple LoggedInLockPick component
function LoggedInLockPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-pick/lock')
      .then(res => res.json())
      .then(data => {
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 bg-orange-900/20 rounded">Loading...</div>;
  if (!pick) return <div className="p-6 bg-orange-900/20 rounded">Login for lock pick</div>;

  return (
    <div className="p-6 bg-orange-900/20 rounded border border-orange-500/30">
      <h3 className="text-xl font-bold text-orange-400">Lock Pick</h3>
      <div className="text-lg mt-2 text-white">
        {pick.pickTeam} ML {pick.odds > 0 ? '+' : ''}{pick.odds}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="bg-green-600 text-white py-2 rounded">Pick</button>
        <button className="bg-red-600 text-white py-2 rounded">Fade</button>
      </div>
    </div>
  );
}

function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const { isAuthenticated } = useAuth();
  const { isProUser } = useProStatus();

  // Fetch odds data
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/mlb/complete-schedule');
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
      } catch (error) {
        console.error('Error fetching odds:', error);
        return [];
      }
    }
  });

  const games = Array.isArray(liveOddsData) ? liveOddsData : [];

  return (
    <>
      <MobileHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white underline">
            Bet Bot Sports Genie AI Picks
          </h1>
        </div>

        {/* Pick Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DailyPick />
          <LoggedInLockPick />
        </div>

        {/* Sports Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button className="border-b-2 border-blue-500 text-blue-400 py-2 px-1">
              MLB
            </button>
            <button className="text-gray-400 py-2 px-1">NFL</button>
            <button className="text-gray-400 py-2 px-1">NBA</button>
          </nav>
        </div>

        {/* Games Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            MLB Game Odds ({games.length} games)
          </h2>
          
          {oddsLoading ? (
            <div className="text-white">Loading games...</div>
          ) : games.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.slice(0, 9).map((game, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-white">
                      {game.away_team || 'Away'} @ {game.home_team || 'Home'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {game.commence_time ? new Date(game.commence_time).toLocaleString() : 'TBD'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No games available</div>
          )}
        </div>
      </div>
    </>
  );
}

export default ActionStyleDashboard;
