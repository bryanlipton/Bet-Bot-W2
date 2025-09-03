// client/src/pages/my-picks-fixed.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchMyPicks, updatePickOdds, deletePickFromSupabase } from '@/services/myPicksAdapter';
import { GameResultsService } from '@/services/gameResultsService';
import { 
  Target, 
  ExternalLink, 
  Trash2, 
  Calendar,
  DollarSign,
  BarChart3,
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Settings,
  RefreshCw
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function MyPicksPageFixed() {
  const { user, profile, isAuthenticated, loading: authLoading, signInWithGoogle } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'past'>('all');
  const [editingOdds, setEditingOdds] = useState<string | null>(null);
  const [tempOdds, setTempOdds] = useState<string>('');
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [betUnit, setBetUnit] = useState(25);
  const [tempBetUnit, setTempBetUnit] = useState('25');
  const [isGrading, setIsGrading] = useState(false);
  const [lastGradedTime, setLastGradedTime] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Fetch picks from Supabase
  const { data: userPicks = [], isLoading, refetch } = useQuery({
    queryKey: ['my-picks-supabase'],
    queryFn: fetchMyPicks,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Load unit size on component mount and when profile changes
  useEffect(() => {
    const loadUnitSize = async () => {
      // First check localStorage for immediate display
      const savedSize = localStorage.getItem('betUnitSize');
      if (savedSize) {
        setBetUnit(Number(savedSize));
        setTempBetUnit(savedSize);
      }
      
      // If authenticated and profile loaded, use profile unit size
      if (profile?.unit_size) {
        setBetUnit(Number(profile.unit_size));
        setTempBetUnit(profile.unit_size.toString());
        localStorage.setItem('betUnitSize', profile.unit_size.toString());
      }
    };
    
    loadUnitSize();
  }, [profile]);

  // Auto-grade picks on mount and every 5 minutes
  useEffect(() => {
    // Grade picks when component mounts
    if (isAuthenticated) {
      handleGradePicks();
    }
    
    // Set up interval to grade picks every 5 minutes
    const interval = setInterval(() => {
      if (isAuthenticated) {
        handleGradePicks();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Function to automatically grade picks
  const handleGradePicks = async (showToast: boolean = false) => {
    if (isGrading || !isAuthenticated) return;
    
    setIsGrading(true);
    try {
      const result = await GameResultsService.gradeAllPendingPicks();
      
      if (result.success && result.gradedCount && result.gradedCount > 0) {
        // Only show toast if explicitly requested or if picks were actually graded
        if (showToast || result.gradedCount > 0) {
          toast({
            title: "Picks Graded!",
            description: `${result.gradedCount} pick${result.gradedCount > 1 ? 's' : ''} ${result.gradedCount > 1 ? 'have' : 'has'} been graded`,
          });
        }
        
        // Refresh the picks list
        refetch();
      }
      
      setLastGradedTime(new Date());
    } catch (error) {
      console.error('Error grading picks:', error);
      // Only show error toast if it was a manual trigger
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to grade picks. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsGrading(false);
    }
  };

  // Authentication guard
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Log in to Track Your Picks
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to save and track all your betting picks across devices
              </p>
              <Button onClick={signInWithGoogle} className="bg-blue-600 hover:bg-blue-700">
                Log in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter picks safely
  const picksArray = Array.isArray(userPicks) ? userPicks : [];
  const filteredPicks = picksArray.filter((pick: any) => {
    if (!pick || typeof pick !== 'object') return false;
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'past') return ['won', 'lost', 'win', 'loss', 'push'].includes(pick.status);
    return pick.status === selectedStatus;
  });

  // Sort picks: pending first in "all" tab, then by date
  const sortedAndFilteredPicks = filteredPicks.sort((a: any, b: any) => {
    // In "all" tab, pending picks should be on top
    if (selectedStatus === 'all') {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
    }
    // Then sort by date (newest first)
    return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime();
  });

  // Calculate stats with unit-based P&L
  const stats = {
    total: picksArray.length,
    pending: picksArray.filter((p: any) => p?.status === 'pending').length,
    won: picksArray.filter((p: any) => ['won', 'win'].includes(p?.status)).length,
    lost: picksArray.filter((p: any) => ['lost', 'loss'].includes(p?.status)).length,
    totalUnits: 0,
    profitLoss: 0,
    winRate: 0
  };

  // Calculate profit/loss in units
  picksArray.forEach((pick: any) => {
    const units = pick.bet_info?.units || pick.units || 1;
    const odds = pick.bet_info?.odds || pick.odds || 0;
    
    if (pick.status === 'won' || pick.status === 'win') {
      if (odds > 0) {
        stats.profitLoss += (units * odds) / 100;
      } else if (odds < 0) {
        stats.profitLoss += (units * 100) / Math.abs(odds);
      }
    } else if (pick.status === 'lost' || pick.status === 'loss') {
      stats.profitLoss -= units;
    }
    
    if (pick.status !== 'pending') {
      stats.totalUnits += units;
    }
  });

  // Calculate accurate win rate
  const completedPicks = stats.won + stats.lost;
  if (completedPicks > 0) {
    stats.winRate = (stats.won / completedPicks) * 100;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case 'won':
      case 'win':
        return <Badge className="bg-green-600 text-white">Won</Badge>;
      case 'lost':
      case 'loss':
        return <Badge className="bg-red-600 text-white">Lost</Badge>;
      case 'push':
        return <Badge className="bg-gray-600 text-white">Push</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatOdds = (odds: number) => {
    if (!odds || odds === 0) return 'N/A';
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatBet = (pick: any) => {
    if (!pick) return 'Unknown';
    
    const odds = pick.odds ? formatOdds(pick.odds) : '';
    const market = pick.betType || pick.market || 'unknown';
    const selection = pick.teamBet || pick.selection || 'Unknown';
    const line = pick.line;
    
    if (market === 'moneyline') {
      return `${selection} ML ${odds}`;
    }
    if (market === 'spread') {
      const lineValue = line || 0;
      return `${selection} ${lineValue > 0 ? '+' : ''}${lineValue} ${odds}`;
    }
    if (market === 'total' || market === 'over' || market === 'under') {
      return `${selection} ${line || ''} ${odds}`;
    }
    return `${selection} ${market} ${odds}`;
  };

  const deletePick = async (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      try {
        const result = await deletePickFromSupabase(pickId);
        
        if (result.success) {
          // Refresh the picks list
          refetch();
          toast({
            title: "Pick deleted",
            description: "The pick has been removed successfully.",
          });
        } else {
          console.error('Error deleting pick:', result.error);
          toast({
            title: "Error",
            description: "Failed to delete pick. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error deleting pick:', error);
        toast({
          title: "Error",
          description: "Failed to delete pick. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditOdds = (pickId: string, currentOdds: number) => {
    setEditingOdds(pickId);
    setTempOdds(currentOdds === 0 ? '' : currentOdds.toString());
  };

  const handleSaveOdds = async (pickId: string) => {
    const odds = parseFloat(tempOdds);
    if (isNaN(odds) || odds === 0) {
      toast({
        title: "Invalid odds",
        description: "Please enter valid odds (e.g., -110, +150)",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await updatePickOdds(pickId, odds);

      if (result.success) {
        refetch();
        setEditingOdds(null);
        setTempOdds('');
        toast({
          title: "Odds updated",
          description: `Odds set to ${formatOdds(odds)}`,
        });
      } else {
        console.error('Error updating odds:', result.error);
        toast({
          title: "Error",
          description: "Failed to update odds. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating odds:', error);
      toast({
        title: "Error",
        description: "Failed to update odds. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingOdds(null);
    setTempOdds('');
  };

  const handleSaveBetUnit = async () => {
    const newBetUnit = parseFloat(tempBetUnit);
    if (isNaN(newBetUnit) || newBetUnit <= 0) {
      toast({
        title: "Invalid unit size",
        description: "Please enter a valid unit size (e.g., 50, 100)",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving unit size:', newBetUnit);
      
      // Save to localStorage immediately
      localStorage.setItem('betUnitSize', newBetUnit.toString());
      setBetUnit(newBetUnit);
      
      // Save to database if authenticated
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ unit_size: newBetUnit })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error saving to database:', error);
          toast({
            title: "Warning",
            description: "Unit size saved locally but not synced to cloud",
            variant: "destructive"
          });
        } else {
          console.log('Unit size saved to database');
          toast({
            title: "Unit size updated",
            description: `Unit size set to $${newBetUnit}`,
          });
        }
      }
      
      setShowUnitDialog(false);
    } catch (error) {
      console.error('Error updating bet unit:', error);
      toast({
        title: "Error",
        description: "Failed to update unit size",
        variant: "destructive"
      });
    }
  };

  const calculatePotentialPayout = (pick: any) => {
    const units = pick.bet_info?.units || pick.units || 1;
    const odds = pick.bet_info?.odds || pick.odds || 0;
    const betAmount = units * betUnit;
    
    if (odds > 0) {
      return betAmount + (betAmount * odds) / 100;
    } else if (odds < 0) {
      return betAmount + (betAmount * 100) / Math.abs(odds);
    }
    return betAmount;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Page Header with Grade Picks Button */}
        {/* Page Header */}
<div className="flex items-center gap-2 mb-6">
  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Picks</h1>
</div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Picks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Record</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.won}-{stats.lost}</p>
                  {stats.won + stats.lost > 0 && (
                    <p className="text-xs text-gray-500">
                      {stats.winRate.toFixed(1)}% Win
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">P&L</p>
                    <p className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}u
                    </p>
                    <p className="text-xs text-gray-500">
                      ${(stats.profitLoss * betUnit).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUnitDialog(true)}
                  className="ml-2"
                  title="Set unit size"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="past">Past ({stats.won + stats.lost})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="space-y-4 mt-4">
            {sortedAndFilteredPicks.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No picks found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedStatus === 'all' 
                      ? 'Start by making your first pick on a game!'
                      : `No ${selectedStatus} picks to display.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedAndFilteredPicks.map((pick: any) => {
                const units = pick.bet_info?.units || pick.units || 1;
                const betAmount = units * betUnit;
                
                return (
                  <Card key={pick.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(pick.status)}
                            <Badge variant="outline">{pick.sport || 'MLB'}</Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(pick.createdAt || pick.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {pick.awayTeam} @ {pick.homeTeam}
                          </h3>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Bet:</span> {formatBet(pick)}
                            </p>
                            
                            {units && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Amount:</span> {units} unit{units !== 1 ? 's' : ''} = ${betAmount.toFixed(2)}
                              </p>
                            )}
                            
                            {pick.bookmaker && pick.bookmaker !== 'manual' && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Book:</span> {pick.bookmakerDisplayName || pick.bookmaker}
                              </p>
                            )}
                          </div>

                          {pick.odds === 0 && pick.bookmaker === 'manual' && (
                            <div className="mt-3">
                              {editingOdds === pick.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    value={tempOdds}
                                    onChange={(e) => setTempOdds(e.target.value)}
                                    placeholder="e.g., -110, +150"
                                    className="w-32 h-8"
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
                                  onClick={() => handleEditOdds(pick.id, pick.odds)}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Enter Odds
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 ml-4">
                          {/* Show result for completed picks */}
                          {(pick.status === 'won' || pick.status === 'win') && (
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                +{((units * Math.abs(pick.odds)) / (pick.odds > 0 ? 100 : Math.abs(pick.odds))).toFixed(2)}u
                              </p>
                              <p className="text-xs text-green-600">
                                +${((betAmount * Math.abs(pick.odds)) / (pick.odds > 0 ? 100 : Math.abs(pick.odds))).toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          {(pick.status === 'lost' || pick.status === 'loss') && (
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-600">
                                -{units}u
                              </p>
                              <p className="text-xs text-red-600">
                                -${betAmount.toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          {pick.status === 'pending' && pick.odds !== 0 && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Potential</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${calculatePotentialPayout(pick).toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePick(pick.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Set Unit Size Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Set Unit Size
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Set your betting unit size in dollars. This will be used to calculate bet amounts when you select units for picks.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">$</span>
                <Input
                  type="number"
                  value={tempBetUnit}
                  onChange={(e) => setTempBetUnit(e.target.value)}
                  placeholder="50"
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">per unit</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Current: ${betUnit} per unit
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUnitDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBetUnit}>
                Save Unit Size
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
