import { useState, useEffect } from 'react';
import { userPicksAPI } from '../services/userPicksApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface UserPickDisplay {
  id: number;
  gameInfo: {
    awayTeam: string;
    homeTeam: string;
    game: string;
    gameDate: string;
  };
  betInfo: {
    selection: string;
    market: string;
    line?: string;
    odds: number;
    units: number;
  };
  bookmaker: {
    key: string;
    displayName: string;
  };
  status: 'pending' | 'win' | 'loss' | 'push';
  result?: string;
  winAmount?: number;
  wagerAmount: number;
  potentialPayout: number;
  betUnitAtTime: number;
  createdAt: string;
}

export default function SimpleMyPicks() {
  const [picks, setPicks] = useState<UserPickDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOdds, setEditingOdds] = useState<number | null>(null);
  const [editingUnits, setEditingUnits] = useState<number | null>(null);
  const [tempOdds, setTempOdds] = useState('');
  const [tempUnits, setTempUnits] = useState('');

  useEffect(() => {
    loadPicks();
  }, []);

  const loadPicks = async () => {
    try {
      setLoading(true);
      const fetchedPicks = await userPicksAPI.getUserPicks();
      setPicks(fetchedPicks);
    } catch (error) {
      console.error('Error loading picks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: UserPickDisplay['status'], pick?: UserPickDisplay) => {
    const isToday = pick && new Date(pick.gameInfo.gameDate).toDateString() === new Date().toDateString();
    
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2">
            <Badge className={`${isToday ? 'bg-blue-600 animate-pulse' : 'bg-yellow-600'} text-white`}>
              {isToday ? 'Game Today' : 'Pending'}
            </Badge>
            {isToday && <span className="text-xs text-blue-600">🔴 Check for live updates</span>}
          </div>
        );
      case 'win':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">✓ Won</Badge>
            {pick?.winAmount && (
              <span className="text-sm font-medium text-green-600">
                +{formatCurrency(pick.winAmount * (pick.betUnitAtTime || 50))}
              </span>
            )}
          </div>
        );
      case 'loss':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white">✗ Lost</Badge>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(pick?.wagerAmount || 50)}
            </span>
          </div>
        );
      case 'push':
        return <Badge className="bg-gray-600 text-white">↔ Push</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleEditOdds = (pickId: number, currentOdds: number) => {
    setEditingOdds(pickId);
    setTempOdds(currentOdds.toString());
  };

  const handleSaveOdds = async (pickId: number) => {
    const odds = parseInt(tempOdds);
    if (isNaN(odds)) {
      alert('Please enter valid odds (e.g., -110, +150)');
      return;
    }

    try {
      const updatedPick = await userPicksAPI.updatePickOdds(pickId, odds);
      setPicks(picks.map(p => p.id === pickId ? updatedPick : p));
      setEditingOdds(null);
      setTempOdds('');
    } catch (error) {
      console.error('Error updating odds:', error);
      alert('Failed to update odds');
    }
  };

  const handleEditUnits = (pickId: number, currentUnits: number) => {
    setEditingUnits(pickId);
    setTempUnits(currentUnits.toString());
  };

  const handleSaveUnits = async (pickId: number) => {
    const units = parseFloat(tempUnits);
    if (isNaN(units) || units <= 0) {
      alert('Please enter valid units amount greater than 0');
      return;
    }

    try {
      const updatedPick = await userPicksAPI.updatePickUnits(pickId, units);
      setPicks(picks.map(p => p.id === pickId ? updatedPick : p));
      setEditingUnits(null);
      setTempUnits('');
    } catch (error) {
      console.error('Error updating units:', error);
      alert('Failed to update units');
    }
  };

  const handleCancel = () => {
    setEditingOdds(null);
    setEditingUnits(null);
    setTempOdds('');
    setTempUnits('');
  };

  const handleDeletePick = async (pickId: number) => {
    if (!confirm('Are you sure you want to delete this pick? This action cannot be undone.')) {
      return;
    }

    try {
      await userPicksAPI.deletePick(pickId);
      setPicks(picks.filter(p => p.id !== pickId));
    } catch (error) {
      console.error('Error deleting pick:', error);
      alert('Failed to delete pick');
    }
  };

  if (loading) {
    return <div className="p-6">Loading picks...</div>;
  }

  const pendingPicks = picks.filter(p => p.status === 'pending');
  const pastPicks = picks.filter(p => p.status !== 'pending');

  const totalWon = pastPicks.filter(p => p.status === 'win').reduce((sum, p) => sum + (p.winAmount || 0), 0);
  const totalLost = pastPicks.filter(p => p.status === 'loss').reduce((sum, p) => sum + p.wagerAmount, 0);
  const netProfit = totalWon - totalLost;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">My Picks</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{picks.length}</div>
              <div className="text-sm text-gray-600">Total Picks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingPicks.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {pastPicks.filter(p => p.status === 'win').length}
              </div>
              <div className="text-sm text-gray-600">Won</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <div className="text-sm text-gray-600">Net Profit</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Picks */}
      {pendingPicks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-600">Pending Picks</h2>
          <div className="space-y-4">
            {pendingPicks.map(pick => (
              <Card key={pick.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{pick.gameInfo.game}</div>
                      <div className="text-gray-600 mb-2">
                        {pick.betInfo.selection} {pick.betInfo.market} 
                        {pick.betInfo.line && ` ${pick.betInfo.line}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pick.bookmaker.displayName} • {new Date(pick.gameInfo.gameDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {getStatusBadge(pick.status)}
                      <div className="mt-2 text-sm">
                        <div>
                          {editingOdds === pick.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={tempOdds}
                                onChange={(e) => setTempOdds(e.target.value)}
                                className="w-20 px-2 py-1 border rounded"
                                placeholder="Odds"
                              />
                              <Button size="sm" onClick={() => handleSaveOdds(pick.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>Odds: {formatOdds(pick.betInfo.odds)}</span>
                              {pick.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditOdds(pick.id, pick.betInfo.odds)}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          {editingUnits === pick.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.5"
                                value={tempUnits}
                                onChange={(e) => setTempUnits(e.target.value)}
                                className="w-20 px-2 py-1 border rounded"
                                placeholder="Units"
                              />
                              <Button size="sm" onClick={() => handleSaveUnits(pick.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>{pick.betInfo.units} units ({formatCurrency(pick.wagerAmount)})</span>
                              {pick.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditUnits(pick.id, pick.betInfo.units)}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          Potential: {formatCurrency(pick.potentialPayout)}
                        </div>
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeletePick(pick.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Picks */}
      {pastPicks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Picks</h2>
          <div className="space-y-4">
            {pastPicks.map(pick => (
              <Card key={pick.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{pick.gameInfo.game}</div>
                      <div className="text-gray-600 mb-2">
                        {pick.betInfo.selection} {pick.betInfo.market}
                        {pick.betInfo.line && ` ${pick.betInfo.line}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pick.bookmaker.displayName} • {new Date(pick.gameInfo.gameDate).toLocaleDateString()}
                      </div>
                      {pick.result && (
                        <div className="text-sm text-gray-600 mt-1">{pick.result}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {getStatusBadge(pick.status)}
                      <div className="mt-2 text-sm">
                        <div>Odds: {formatOdds(pick.betInfo.odds)}</div>
                        <div>{pick.betInfo.units} units ({formatCurrency(pick.wagerAmount)})</div>
                        <div className={pick.status === 'win' ? 'text-green-600 font-semibold' : 
                                       pick.status === 'loss' ? 'text-red-600 font-semibold' : ''}>
                          {pick.status === 'win' ? `+${formatCurrency(pick.winAmount || 0)}` :
                           pick.status === 'loss' ? `-${formatCurrency(pick.wagerAmount)}` :
                           'Push'}
                        </div>
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeletePick(pick.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {picks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No picks yet</div>
          <div className="text-gray-400 mt-2">Start making your first bet to see it here!</div>
        </div>
      )}
    </div>
  );
}