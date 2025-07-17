import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
import { pickStorage } from '@/services/pickStorage';
import { Pick } from '@/types/picks';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Calendar,
  DollarSign,
  BarChart3,
  AlertCircle,
  Edit3,
  Save,
  X
} from "lucide-react";

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [editingOdds, setEditingOdds] = useState<string | null>(null);
  const [tempOdds, setTempOdds] = useState<string>('');

  // Initialize dark mode from localStorage (default to dark mode)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    // Default to dark mode if no preference is saved
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    // Save the default preference if none exists
    if (savedDarkMode === null) {
      localStorage.setItem('darkMode', 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Load picks from localStorage
  useEffect(() => {
    const loadPicks = () => {
      const storedPicks = pickStorage.getPicks();
      setPicks(storedPicks);
    };

    loadPicks();

    // Listen for pick updates
    const handlePickUpdate = () => loadPicks();
    window.addEventListener('pickSaved', handlePickUpdate);
    window.addEventListener('pickStatusUpdated', handlePickUpdate);
    window.addEventListener('pickDeleted', handlePickUpdate);
    window.addEventListener('allPicksCleared', handlePickUpdate);

    return () => {
      window.removeEventListener('pickSaved', handlePickUpdate);
      window.removeEventListener('pickStatusUpdated', handlePickUpdate);
      window.removeEventListener('pickDeleted', handlePickUpdate);
      window.removeEventListener('allPicksCleared', handlePickUpdate);
    };
  }, []);

  const filteredPicks = picks.filter(pick => {
    if (selectedStatus === 'all') return true;
    return pick.status === selectedStatus;
  });

  const getStatusBadge = (status: Pick['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case 'won':
        return <Badge className="bg-green-600 text-white">Won</Badge>;
      case 'lost':
        return <Badge className="bg-red-600 text-white">Lost</Badge>;
      case 'void':
        return <Badge className="bg-gray-600 text-white">Void</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-600 text-white">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatBet = (pick: Pick) => {
    const { betInfo } = pick;
    if (betInfo.market === 'moneyline') {
      return `${betInfo.selection} ML`;
    }
    if (betInfo.market === 'spread') {
      const line = betInfo.line || 0;
      return `${betInfo.selection} ${line > 0 ? '+' : ''}${line}`;
    }
    if (betInfo.market === 'over' || betInfo.market === 'under') {
      return `${betInfo.market === 'over' ? 'Over' : 'Under'} ${betInfo.line || ''}`;
    }
    return `${betInfo.selection} ${betInfo.market}`;
  };

  const deletePick = (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      pickStorage.deletePick(pickId);
    }
  };

  const clearAllPicks = () => {
    if (confirm('Are you sure you want to delete all picks? This cannot be undone.')) {
      pickStorage.clearAllPicks();
    }
  };

  const handleEditOdds = (pickId: string, currentOdds: number) => {
    setEditingOdds(pickId);
    setTempOdds(currentOdds === 0 ? '' : currentOdds.toString());
  };

  const handleSaveOdds = (pickId: string) => {
    const odds = parseFloat(tempOdds);
    if (isNaN(odds) || odds === 0) {
      alert('Please enter valid odds (e.g., -110, +150)');
      return;
    }

    // Update the pick with new odds
    const updatedPicks = picks.map(pick => {
      if (pick.id === pickId) {
        return {
          ...pick,
          betInfo: {
            ...pick.betInfo,
            odds: odds
          }
        };
      }
      return pick;
    });

    setPicks(updatedPicks);
    pickStorage.updatePick(pickId, { betInfo: { odds } });
    setEditingOdds(null);
    setTempOdds('');
  };

  const handleCancelEdit = () => {
    setEditingOdds(null);
    setTempOdds('');
  };

  // Calculate stats
  const stats = {
    total: picks.length,
    pending: picks.filter(p => p.status === 'pending').length,
    won: picks.filter(p => p.status === 'won').length,
    lost: picks.filter(p => p.status === 'lost').length,
    winRate: picks.filter(p => p.status === 'won' || p.status === 'lost').length > 0 ? 
      (picks.filter(p => p.status === 'won').length / picks.filter(p => p.status === 'won' || p.status === 'lost').length * 100) : 0
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Picks</h1>
          </div>
          {picks.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllPicks}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Picks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.won}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['all', 'pending', 'won', 'lost'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors capitalize ${
                selectedStatus === status
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {status} ({status === 'all' ? stats.total : 
                status === 'pending' ? stats.pending :
                status === 'won' ? stats.won : stats.lost})
            </button>
          ))}
        </div>

        {/* Picks List */}
        {filteredPicks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {picks.length === 0 ? 'No Picks Yet' : `No ${selectedStatus} Picks`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {picks.length === 0 
                  ? 'Start by clicking "Make Pick" on any game to track your bets here.'
                  : `You don't have any ${selectedStatus} picks at the moment.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPicks.map((pick) => (
              <Card key={pick.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(pick.status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(pick.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePick(pick.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Game Info */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {pick.gameInfo.awayTeam} @ {pick.gameInfo.homeTeam}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pick.gameInfo.gameTime ? 
                          new Date(pick.gameInfo.gameTime).toLocaleString() : 
                          'Game time TBD'
                        }
                      </p>
                    </div>

                    {/* Bet Info */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatBet(pick)}
                      </p>
                      {/* Manual odds entry interface */}
                      {pick.betInfo.odds === 0 && pick.bookmaker.key === 'manual' ? (
                        <div className="mt-2">
                          {editingOdds === pick.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tempOdds}
                                onChange={(e) => setTempOdds(e.target.value)}
                                placeholder="Enter odds (e.g., -110)"
                                className="w-24 h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveOdds(pick.id)}
                                className="h-8 px-2"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-8 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOdds(pick.id, pick.betInfo.odds)}
                              className="text-xs h-8 px-2"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Enter Odds
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatOdds(pick.betInfo.odds)}
                          </p>
                          {pick.bookmaker.key === 'manual' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditOdds(pick.id, pick.betInfo.odds)}
                              className="h-6 px-1 text-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bookmaker */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pick.bookmaker.displayName}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(pick.bookmaker.url, '_blank')}
                        className="mt-1 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit Book
                      </Button>
                    </div>

                    {/* Result */}
                    <div className="text-right">
                      {pick.result?.finalScore && (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Final: {pick.result.finalScore.away} - {pick.result.finalScore.home}
                          </p>
                          {pick.result.payout && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Payout: ${pick.result.payout}
                            </p>
                          )}
                        </div>
                      )}
                      {pick.status === 'pending' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Awaiting result
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}