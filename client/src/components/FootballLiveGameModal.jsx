import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, RefreshCw } from 'lucide-react';
import { getTeamColorBySport } from '@/utils/teamColors';

const FootballLiveGameModal = ({ gameId, homeTeam, awayTeam, sport, gameData, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get team colors based on sport
  const getTeamColor = (teamName) => {
    return getTeamColorBySport(teamName, sport);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {awayTeam} @ {homeTeam}
          </DialogTitle>
        </DialogHeader>

        {gameData ? (
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
                  {gameData.quarter || gameData.inning || 'Q1'}
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
                    {gameData.awayScore || 0}
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
                    {gameData.homeScore || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Football Field Visualization */}
            <div className="bg-green-900/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3 text-center">
                Field Position
              </h3>
              
              {/* Simplified Football Field */}
              <div className="relative bg-green-700 rounded-lg h-20 mx-4 mb-4 overflow-hidden">
                {/* Yard lines */}
                <div className="absolute inset-0 flex">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="flex-1 border-r border-white/20 h-full relative">
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-white/60">
                        {i === 0 ? 'G' : i === 10 ? 'G' : i * 10}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Ball position indicator - centered for now */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                ></div>
                
                {/* End zones */}
                <div className="absolute left-0 top-0 w-8 h-full bg-blue-600/30 flex items-center justify-center">
                  <span className="text-xs text-white font-bold transform -rotate-90">END</span>
                </div>
                <div className="absolute right-0 top-0 w-8 h-full bg-red-600/30 flex items-center justify-center">
                  <span className="text-xs text-white font-bold transform rotate-90">END</span>
                </div>
              </div>

              {/* Game Situation Info */}
              <div className="grid grid-cols-2 gap-4">
                {/* Down & Distance */}
                <div className="bg-black/20 rounded p-3 text-center">
                  <div className="text-sm text-gray-400 mb-1">Down & Distance</div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {gameData.down || 'Live Action'}
                  </div>
                </div>

                {/* Possession */}
                <div className="bg-black/20 rounded p-3 text-center">
                  <div className="text-sm text-gray-400 mb-1">Game Status</div>
                  <div className="text-lg font-semibold">
                    <span className="text-green-400">{gameData.status || 'In Progress'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Info */}
            {gameData.venue && (
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Venue</span>
                </div>
                <div className="text-lg font-semibold">
                  {gameData.venue}
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="text-center text-xs text-gray-500">
              Live game information
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
