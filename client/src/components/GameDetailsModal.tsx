import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GameDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string | number;
  homeTeam: string;
  awayTeam: string;
  startTime?: string;
  venue?: string;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
}

interface Lineup {
  home: Array<{
    id: number;
    name: string;
    position: string;
    battingOrder: number;
  }>;
  away: Array<{
    id: number;
    name: string;
    position: string;
    battingOrder: number;
  }>;
}

export function GameDetailsModal({
  isOpen,
  onClose,
  gameId,
  homeTeam,
  awayTeam,
  startTime,
  venue,
  probablePitchers
}: GameDetailsModalProps) {
  const { data: lineups, isLoading: lineupsLoading } = useQuery<Lineup>({
    queryKey: ['/api/mlb/game', gameId, 'lineups'],
    enabled: isOpen && !!gameId,
  });

  const formatPosition = (pos: string) => {
    const positions: Record<string, string> = {
      'P': 'Pitcher', 'C': 'Catcher', '1B': 'First Base', '2B': 'Second Base',
      '3B': 'Third Base', 'SS': 'Shortstop', 'LF': 'Left Field', 'CF': 'Center Field',
      'RF': 'Right Field', 'DH': 'Designated Hitter'
    };
    return positions[pos] || pos;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {awayTeam} @ {homeTeam}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Game details and lineups for {awayTeam} at {homeTeam} including probable pitchers and starting lineups.
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {startTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {startTime}
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {venue}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Probable Pitchers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Probable Pitchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{awayTeam}</h4>
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {probablePitchers?.away || 'TBD'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{homeTeam}</h4>
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {probablePitchers?.home || 'TBD'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Starting Lineups</CardTitle>
            </CardHeader>
            <CardContent>
              {lineupsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading lineups...</p>
                </div>
              ) : lineups && (lineups.home.length > 0 || lineups.away.length > 0) ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Away Team Lineup */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">{awayTeam}</h4>
                    <div className="space-y-2">
                      {lineups.away.length > 0 ? lineups.away.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                              {player.battingOrder || index + 1}
                            </Badge>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatPosition(player.position)}
                          </span>
                        </div>
                      )) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Lineup TBD</p>
                      )}
                    </div>
                  </div>

                  {/* Home Team Lineup */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">{homeTeam}</h4>
                    <div className="space-y-2">
                      {lineups.home.length > 0 ? lineups.home.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                              {player.battingOrder || index + 1}
                            </Badge>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatPosition(player.position)}
                          </span>
                        </div>
                      )) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Lineup TBD</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Lineups TBD</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Lineups are typically posted 1-2 hours before game time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}