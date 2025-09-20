import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const FootballLiveGameModal = ({ 
  gameId, 
  homeTeam, 
  awayTeam, 
  sport, 
  gameData, 
  isOpen, 
  onClose 
}) => {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && gameData) {
      // Use the existing gameData instead of fetching from API
      const processedData = {
        homeTeam: {
          name: gameData.homeTeam,
          score: gameData.homeScore || 0,
          color: gameData.homeTeamColor || '#000000'
        },
        awayTeam: {
          name: gameData.awayTeam,
          score: gameData.awayScore || 0,
          color: gameData.awayTeamColor || '#000000'
        },
        game: {
          status: gameData.status || 'Scheduled',
          quarter: gameData.quarter || gameData.period || 'Q1',
          clock: gameData.clock || gameData.time || '15:00',
          down: gameData.down || gameData.situation?.down || gameData.downDistance || 'N/A',
          possession: gameData.possession || gameData.possessionTeam || null,
          yardLine: gameData.yardLine || gameData.fieldPosition || gameData.situation?.yardLine || null,
          temperature: gameData.weather?.temperature || null,
          conditions: gameData.weather?.conditions || null,
          wind: gameData.weather?.wind || null
        },
        stats: gameData.stats || {
          totalYards: { home: null, away: null },
          passingYards: { home: null, away: null },
          rushingYards: { home: null, away: null },
          turnovers: { home: null, away: null }
        }
      };
      
      setLiveData(processedData);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, gameData]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="text-white">Loading live game data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="text-red-400">Error: {error}</div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {awayTeam} @ {homeTeam}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="text-gray-400 text-center py-8">
            No live data available
          </div>
        </div>
      </div>
    );
  }

  const { homeTeam: home, awayTeam: away, game, stats } = liveData;

  // Calculate field position for visualization
  const getFieldPosition = () => {
    if (!game.yardLine) return 50; // Default to 50-yard line
    
    // Parse yard line (e.g., "OAK 25" or "25")
    const yardLineMatch = game.yardLine.toString().match(/(\d+)/);
    if (!yardLineMatch) return 50;
    
    const yard = parseInt(yardLineMatch[1]);
    
    // Determine if it's team's own side or opponent's side
    if (game.yardLine.includes(home.name.split(' ').pop()) || 
        game.yardLine.includes(home.name.substring(0, 3).toUpperCase())) {
      return yard; // Home team's side
    } else {
      return 100 - yard; // Away team's side (flip)
    }
  };

  const fieldPosition = getFieldPosition();

  const formatStatValue = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'object' && value.home !== undefined && value.away !== undefined) {
      const homeVal = value.home || 0;
      const awayVal = value.away || 0;
      return `${homeVal} - ${awayVal}`;
    }
    return value.toString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">
              {away.name} @ {home.name}
            </h2>
            <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
              {game.status}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Game Status & Scores */}
        <div className="p-6 bg-gray-800">
          <div className="flex justify-between items-center mb-6">
            {/* Away Team */}
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: away.color }}
              >
                {away.name}
              </div>
              <div className="text-4xl font-bold text-white">
                {away.score}
              </div>
            </div>

            {/* Game Clock & Quarter */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {game.quarter}
              </div>
              <div className="text-xl text-gray-300">
                {game.clock}
              </div>
              {game.down && (
                <div className="text-sm text-gray-400 mt-2">
                  {game.down}
                </div>
              )}
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: home.color }}
              >
                {home.name}
              </div>
              <div className="text-4xl font-bold text-white">
                {home.score}
              </div>
            </div>
          </div>

          {/* Football Field Visualization */}
          <div className="relative mb-6">
            <div className="bg-green-600 h-20 relative rounded border-2 border-white overflow-hidden">
              {/* End Zones */}
              <div className="absolute left-0 top-0 w-4 h-full bg-blue-600"></div>
              <div className="absolute right-0 top-0 w-4 h-full bg-red-600"></div>
              
              {/* Yard Lines */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(yard => (
                <div 
                  key={yard}
                  className="absolute top-0 h-full w-0.5 bg-white opacity-50"
                  style={{ left: `${(yard / 100) * 100}%` }}
                ></div>
              ))}
              
              {/* Goal Lines */}
              <div className="absolute left-4 top-0 h-full w-1 bg-yellow-400"></div>
              <div className="absolute right-4 top-0 h-full w-1 bg-yellow-400"></div>
              
              {/* 50 Yard Line */}
              <div className="absolute top-0 h-full w-1 bg-white" style={{ left: '50%' }}></div>
              
              {/* Ball Position */}
              {game.yardLine && (
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-orange-500"
                  style={{ left: `${fieldPosition}%` }}
                ></div>
              )}
            </div>
            
            {/* Field Labels */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Goal</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>Goal</span>
            </div>
          </div>

          {/* Possession Indicator */}
          {game.possession && (
            <div className="text-center mb-4">
              <span className="text-gray-400">Possession: </span>
              <span 
                className="font-bold"
                style={{ 
                  color: game.possession.includes(home.name) ? home.color : away.color 
                }}
              >
                {game.possession}
              </span>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Game Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats).map(([statName, value]) => (
              <div key={statName} className="bg-gray-800 p-4 rounded">
                <div className="text-gray-400 text-sm mb-1">
                  {statName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="text-white font-bold">
                  {formatStatValue(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Info */}
        {(game.temperature || game.conditions || game.wind) && (
          <div className="p-6 border-t border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3">Weather Conditions</h3>
            <div className="flex space-x-6 text-gray-300">
              {game.temperature && (
                <div>
                  <span className="text-gray-400">Temperature: </span>
                  {game.temperature}°F
                </div>
              )}
              {game.conditions && (
                <div>
                  <span className="text-gray-400">Conditions: </span>
                  {game.conditions}
                </div>
              )}
              {game.wind && (
                <div>
                  <span className="text-gray-400">Wind: </span>
                  {game.wind}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootballLiveGameModal;
