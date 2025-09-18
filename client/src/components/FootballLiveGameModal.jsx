import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, RefreshCw } from 'lucide-react';
import { getTeamColorBySport } from '@/utils/teamColors';

const FootballLiveGameModal = ({ gameId, homeTeam, awayTeam, sport, isOpen, onClose }) => {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine which live API endpoint to use
  const getApiEndpoint = () => {
    if (sport === 'americanfootball_nfl') {
      return `/api/nfl/live-game?gameId=${gameId}&homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`;
    } else if (sport === 'americanfootball_ncaaf') {
      return `/api/cfb/live-game?gameId=${gameId}&homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`;
    }
    return null;
  };

  // Get team colors based on sport
  const getTeamColor = (teamName) => {
    return getTeamColorBySport(teamName, sport);
  };

  useEffect(() => {
    if (!isOpen || !gameId) return;

    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = getApiEndpoint();
        if (!endpoint) {
          throw new Error('Unsupported sport for live data');
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch live game data');
        }
        
        const data = await response.json();
        setGameData(data);
      } catch (err) {
        console.error('Error fetching live game data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
    
    // Refresh every 15 seconds for live updates
    const interval = setInterval(fetchGameData, 15000);
    return () => clearInterval(interval);
  }, [isOpen, gameId, sport]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {awayTeam} @ {homeTeam}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2">Loading live game data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Error loading live data: {error}</p>
            <p className="text-gray-400">Please try again later</p>
          </div>
        ) : gameData ? (
          <div className="space-y-6">
            {/* Game Status Header */}
            <div className="text-center">
              <Badge 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-lg"
              >
                🔴 LIVE
              </Badge>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {gameData.quarter || 'Q1'}
                </span>
                {gameData.clock && (
                  <span className="text-xl text-gray-300 ml-2">
                    {gameData.clock}
                  </span>
                )}
              </div>
            </div>

            {/* Score Display */}
            <div className="bg-black/20 rounded-lg p-6">
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Away Team */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: getTeamColor(awayTeam) }}
                    ></div>
                    <span className="text-lg font-semibold">{awayTeam}</span>
                  </div>
                  <div className="text-4xl font-bold text-blue-400">
                    {gameData.score?.away || 0}
                  </div>
                </div>

                {/* VS */}
                <div className="text-center text-gray-400 text-xl font-bold">
                  @
                </div>

                {/* Home Team */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: getTeamColor(homeTeam) }}
                    ></div>
                    <span className="text-lg font-semibold">{homeTeam}</span>
                  </div>
                  <div className="text-4xl font-bold text-green-400">
                    {gameData.score?.home || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Game Situation */}
            <div className="bg-green-900/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Live Game Situation
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Game Clock */}
                <div className="bg-black/20 rounded p-3">
                  <div className="flex items-center mb-1">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Game Clock</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {gameData.quarter || 'Q1'} {gameData.clock || '15:00'}
                  </div>
                </div>

                {/* Down & Distance */}
                {gameData.down && (
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-sm text-gray-400 mb-1">Down & Distance</div>
                    <div className="text-lg font-semibold text-yellow-400">
                      {gameData.down}
                    </div>
                  </div>
                )}

                {/* Possession */}
                {gameData.possession && (
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-sm text-gray-400 mb-1">Possession</div>
                    <div className="text-lg font-semibold flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getTeamColor(gameData.possession) }}
                      ></div>
                      {gameData.possession}
                    </div>
                  </div>
                )}

                {/* Venue */}
                {gameData.venue && (
                  <div className="bg-black/20 rounded p-3">
                    <div className="flex items-center mb-1">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Venue</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {gameData.venue}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Football Stats (if available) */}
            {gameData.stats && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-3">Game Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(gameData.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{key}:</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="text-center text-xs text-gray-500">
              Last updated: {new Date(gameData.lastUpdate || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No live data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FootballLiveGameModal;
