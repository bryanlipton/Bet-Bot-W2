import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import { apiRequest } from '@/lib/queryClient';
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
  X,
  Plus
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'record'>('all');
  const [editingOdds, setEditingOdds] = useState<string | null>(null);
  const [tempOdds, setTempOdds] = useState<string>('');
  const [editingUnits, setEditingUnits] = useState<string | null>(null);
  const [tempUnits, setTempUnits] = useState<string>('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [entryType, setEntryType] = useState<'single' | 'parlay'>('single');
  const [manualEntry, setManualEntry] = useState({
    gameId: '',
    market: 'moneyline' as 'moneyline' | 'spread' | 'total',
    selection: '',
    line: '',
    odds: '',
    units: 1
  });
  const [parlayLegs, setParlayLegs] = useState<Array<{
    gameId: string;
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line: string;
    odds: string;
    game?: any;
  }>>([]);
  const [parlayUnits, setParlayUnits] = useState(1);
  const [parlayOdds, setParlayOdds] = useState('');
  const [betUnit, setBetUnit] = useState(10);
  const [editingBetUnit, setEditingBetUnit] = useState(false);
  const [tempBetUnit, setTempBetUnit] = useState('');

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

  // Use database-only approach with TanStack Query
  const { data: userPicks = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/user/picks'],
    enabled: isAuthenticated
  }) as { data: any[], isLoading: boolean, refetch: () => void };

  // Fetch available games for manual entry
  const { data: gamesData = [] } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: showManualEntry,
  }) as { data: any[] };

  // Load bet unit from user preferences via database
  const { data: userPreferences = {} } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: isAuthenticated
  }) as { data: any };

  // Set bet unit from user preferences
  useEffect(() => {
    if (userPreferences && (userPreferences as any).betUnit) {
      setBetUnit((userPreferences as any).betUnit);
    }
  }, [userPreferences]);

  // Save bet unit to database via API
  const saveBetUnit = async (newBetUnit: number) => {
    try {
      await apiRequest('PUT', '/api/user/preferences', { betUnit: newBetUnit });
      setBetUnit(newBetUnit);
    } catch (error) {
      console.error('Error saving bet unit:', error);
      alert('Failed to save bet unit. Please try again.');
    }
  };

  const handleEditBetUnit = () => {
    setEditingBetUnit(true);
    setTempBetUnit(betUnit.toString());
  };

  const handleSaveBetUnit = () => {
    const newBetUnit = parseFloat(tempBetUnit);
    if (isNaN(newBetUnit) || newBetUnit <= 0) {
      alert('Please enter a valid bet unit amount');
      return;
    }
    saveBetUnit(newBetUnit);
    setEditingBetUnit(false);
    setTempBetUnit('');
  };

  const handleCancelBetUnitEdit = () => {
    setEditingBetUnit(false);
    setTempBetUnit('');
  };

  // Filter database picks based on status with proper type checking
  const picksArray = Array.isArray(userPicks) ? userPicks : [];
  
  // FORCED DEBUG LOGGING - ALWAYS VISIBLE
  console.log('=== FORCED PICK DEBUG START ===');
  console.log('Total userPicks count:', userPicks?.length || 0);
  console.log('betUnit from preferences:', betUnit);
  console.log('Raw userPicks data:', userPicks);
  console.log('picksArray data:', picksArray);
  
  if (picksArray && picksArray.length > 0) {
    picksArray.forEach((pick, index) => {
      console.log(`=== Pick ${index} Debug ===`, {
        id: pick.id,
        units: pick.units,
        unitType: typeof pick.units,
        betUnitAtTime: pick.betUnitAtTime,
        betUnitAtTimeType: typeof pick.betUnitAtTime,
        odds: pick.odds,
        status: pick.status,
        fullPickObject: pick
      });
    });
  } else {
    console.log('NO PICKS FOUND OR PICKS IS EMPTY');
  }
  console.log('=== FORCED PICK DEBUG END ===');
  
  const filteredPicks = picksArray.filter((pick: any) => {
    if (!pick || typeof pick !== 'object') return false;
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'past') return pick.status === 'won' || pick.status === 'lost' || pick.status === 'win' || pick.status === 'loss' || pick.status === 'push';
    return pick.status === selectedStatus;
  });

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

  // Calculate wager amount based on units and stored bet unit at time of pick creation
  const calculateWagerAmount = (units: number, betUnitAtTime?: number): number => {
    // Use stored bet unit value if available, otherwise fall back to current bet unit
    const effectiveBetUnit = betUnitAtTime !== undefined ? betUnitAtTime : betUnit;
    const result = units * effectiveBetUnit;
    console.log('Calculating wager amount:', { units, betUnitAtTime, betUnit, effectiveBetUnit, result });
    return result;
  };

  // Calculate potential payout based on wager and odds
  const calculatePayout = (wager: number, odds: number): number => {
    if (odds === 0) return 0;
    if (odds > 0) {
      // Positive odds: payout = wager + (wager * (odds/100))
      return wager + (wager * (odds / 100));
    } else {
      // Negative odds: payout = wager + (wager * (100/Math.abs(odds)))
      return wager + (wager * (100 / Math.abs(odds)));
    }
  };

  // Format bet for database pick
  const formatBet = (pick: any) => {
    // Safely extract values with null checks
    if (!pick) return 'Unknown';
    
    const odds = pick.odds ? formatOdds(pick.odds) : (pick.betInfo?.odds ? formatOdds(pick.betInfo.odds) : '');
    const market = pick.market || pick.betInfo?.market || 'unknown';
    const selection = pick.selection || pick.betInfo?.selection || 'Unknown';
    const line = pick.line || pick.betInfo?.line;
    
    if (market === 'parlay') {
      return `${selection} Parlay ${odds}`;
    }
    if (market === 'moneyline') {
      return `${selection} ML ${odds}`;
    }
    if (market === 'spread') {
      const lineValue = line || 0;
      return `${selection} ${lineValue > 0 ? '+' : ''}${lineValue} ${odds}`;
    }
    if (market === 'over' || market === 'under') {
      return `${market === 'over' ? 'Over' : 'Under'} ${line || ''} ${odds}`;
    }
    if (market === 'total') {
      return `${selection === 'Over' || selection === 'Under' ? selection : 'Total'} ${line || ''} ${odds}`;
    }
    return `${selection} ${market} ${odds}`;
  };

  const deletePick = async (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      try {
        console.log('Deleting pick:', pickId);
        const response = await fetch(`/api/user/picks/${pickId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete pick');
        }
        
        refetch(); // Refresh the picks data
        console.log('Pick deleted successfully');
      } catch (error) {
        console.error('Error deleting pick:', error);
        alert('Failed to delete pick. Please try again.');
      }
    }
  };

  const clearAllPicks = () => {
    if (confirm('Are you sure you want to delete all picks? This cannot be undone.')) {
      // pickStorage.clearAllPicks(); // Removed - using database only now
      console.log('Clear all picks - using database approach');
    }
  };

  const handleEditOdds = (pickId: string, currentOdds: number) => {
    setEditingOdds(pickId);
    setTempOdds(currentOdds === 0 ? '' : currentOdds.toString());
  };

  const handleSaveOdds = async (pickId: string) => {
    const odds = parseFloat(tempOdds);
    if (isNaN(odds) || odds === 0) {
      alert('Please enter valid odds (e.g., -110, +150)');
      return;
    }

    try {
      await apiRequest('PATCH', `/api/user/picks/${pickId}/odds`, { odds });
      refetch(); // Refresh the picks data
      setEditingOdds(null);
      setTempOdds('');
    } catch (error) {
      console.error('Error updating odds:', error);
      alert('Failed to update odds. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingOdds(null);
    setTempOdds('');
  };

  const handleEditUnits = (pickId: string, currentUnits: number) => {
    setEditingUnits(pickId);
    setTempUnits(currentUnits.toString());
  };

  const handleSaveUnits = async (pickId: string) => {
    const units = parseFloat(tempUnits);
    if (isNaN(units) || units <= 0) {
      alert('Please enter a valid wager amount greater than 0');
      return;
    }

    try {
      await apiRequest('PATCH', `/api/user/picks/${pickId}/units`, { units });
      refetch(); // Refresh the picks data
      setEditingUnits(null);
      setTempUnits('');
    } catch (error) {
      console.error('Error updating units:', error);
      alert('Failed to update units. Please try again.');
    }
  };

  const handleCancelUnitsEdit = () => {
    setEditingUnits(null);
    setTempUnits('');
  };

  const handleManualEntry = async () => {
    if (entryType === 'single') {
      // Single bet handling
      if (!selectedGame || !manualEntry.selection) {
        alert('Please select a game and betting option');
        return;
      }

      // Find the selected option to get the proper selection name
      const selectedOption = getBettingOptions().find(opt => opt.value === manualEntry.selection);
      const actualSelection = selectedOption ? selectedOption.selection : manualEntry.selection;

      const pick: Pick = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        gameInfo: {
          awayTeam: selectedGame.away_team,
          homeTeam: selectedGame.home_team,
          gameTime: selectedGame.commence_time,
          venue: selectedGame.venue || 'TBD',
          sport: 'baseball_mlb'
        },
        betInfo: {
          market: manualEntry.market,
          selection: actualSelection,
          line: manualEntry.line ? parseFloat(manualEntry.line) : undefined,
          odds: manualEntry.odds ? parseFloat(manualEntry.odds) : 0,
          units: manualEntry.units
        },
        bookmaker: {
          key: 'manual',
          title: 'Manual Entry',
          displayName: 'Manual Entry',
          url: '#'
        },
        status: 'pending'
      };

      // Save directly to database via API
      try {
        await apiRequest('POST', '/api/user/picks', {
          gameId: selectedGame.id,
          homeTeam: selectedGame.home_team,
          awayTeam: selectedGame.away_team,
          selection: actualSelection,
          game: `${selectedGame.away_team} @ ${selectedGame.home_team}`,
          market: manualEntry.market,
          line: manualEntry.line || null,
          odds: parseInt(manualEntry.odds) || 0,
          units: manualEntry.units,
          betUnitAtTime: betUnit,
          bookmaker: 'manual',
          bookmakerDisplayName: 'Manual Entry',
          gameDate: new Date(selectedGame.commence_time || new Date().toISOString()),
        });
        
        // Refresh the picks list
        refetch();
        
        console.log('Successfully saved pick to database');
      } catch (error) {
        console.error('Error saving pick to database:', error);
        alert('Failed to save pick. Please try again.');
      }
      
    } else if (entryType === 'parlay') {
      // Parlay bet handling
      if (parlayLegs.length < 2) {
        alert('A parlay must have at least 2 legs');
        return;
      }

      if (!parlayOdds) {
        alert('Please enter the parlay odds');
        return;
      }

      // Create a single pick representing the parlay
      const parlayPick: Pick = {
        id: `parlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        gameInfo: {
          awayTeam: `${parlayLegs.length}-Leg Parlay`,
          homeTeam: 'Multiple Games',
          gameTime: new Date().toISOString(),
          venue: 'Multiple Venues',
          sport: 'baseball_mlb'
        },
        betInfo: {
          market: 'parlay',
          selection: `${parlayLegs.length} Legs`,
          line: undefined,
          odds: parseFloat(parlayOdds) || 0,
          units: parlayUnits,
          parlayLegs: parlayLegs.map(leg => ({
            game: `${leg.game?.away_team} @ ${leg.game?.home_team}`,
            market: leg.market,
            selection: leg.selection,
            line: leg.line ? parseFloat(leg.line) : undefined,
            odds: leg.odds ? parseFloat(leg.odds) : 0
          }))
        },
        bookmaker: {
          key: 'manual',
          title: 'Manual Entry',
          displayName: 'Manual Entry',
          url: '#'
        },
        status: 'pending'
      };

      // Save parlay to database via API
      try {
        await apiRequest('POST', '/api/user/picks', {
          gameId: `parlay_${Date.now()}`,
          homeTeam: 'Multiple Games',
          awayTeam: `${parlayLegs.length}-Leg Parlay`,
          selection: `${parlayLegs.length} Legs`,
          game: `${parlayLegs.length}-Leg Parlay`,
          market: 'parlay',
          line: null,
          odds: parseInt(parlayOdds) || 0,
          units: parlayUnits,
          betUnitAtTime: betUnit,
          bookmaker: 'manual',
          bookmakerDisplayName: 'Manual Entry',
          gameDate: new Date(),
          parlayLegs: parlayLegs.map(leg => ({
            game: `${leg.game?.away_team} @ ${leg.game?.home_team}`,
            market: leg.market,
            selection: leg.selection,
            line: leg.line ? parseFloat(leg.line) : undefined,
            odds: leg.odds ? parseFloat(leg.odds) : 0
          }))
        });
        
        // Refresh the picks list
        refetch();
        
        console.log('Successfully saved parlay to database');
      } catch (error) {
        console.error('Error saving parlay to database:', error);
        alert('Failed to save parlay. Please try again.');
      }
    }
    
    // Reset form and close modal
    resetManualEntry();
    setShowManualEntry(false);
  };

  const handleManualEntryChange = (field: string, value: string | number) => {
    setManualEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGameSelection = (gameId: string) => {
    const game = Array.isArray(gamesData) ? gamesData.find((g: any) => g.id === gameId) : null;
    setSelectedGame(game);
    setManualEntry(prev => ({
      ...prev,
      gameId: gameId,
      selection: '',
      line: '',
      market: 'moneyline'
    }));
  };

  const getBettingOptions = () => {
    if (!selectedGame) return [];
    
    const options = [];
    
    // Helper function to get odds from the first available bookmaker
    const getOddsForOutcome = (markets: any[], marketKey: string, outcomeName: string, point?: number) => {
      const market = markets.find((m: any) => m.key === marketKey);
      if (!market?.outcomes) return null;
      
      const outcome = market.outcomes.find((o: any) => {
        if (point !== undefined) {
          return o.name === outcomeName && o.point === point;
        }
        return o.name === outcomeName;
      });
      
      return outcome?.price || null;
    };
    
    // Get the first bookmaker's markets for odds
    const firstBookmaker = selectedGame.bookmakers?.[0];
    const markets = firstBookmaker?.markets || [];
    
    // Moneyline options - Use unique values to avoid conflicts
    const awayMoneylineOdds = getOddsForOutcome(markets, 'h2h', selectedGame.away_team);
    const homeMoneylineOdds = getOddsForOutcome(markets, 'h2h', selectedGame.home_team);
    
    options.push({
      value: `${selectedGame.away_team}_moneyline`,
      label: `${selectedGame.away_team} Moneyline`,
      market: 'moneyline',
      selection: selectedGame.away_team,
      odds: awayMoneylineOdds
    });
    options.push({
      value: `${selectedGame.home_team}_moneyline`,
      label: `${selectedGame.home_team} Moneyline`, 
      market: 'moneyline',
      selection: selectedGame.home_team,
      odds: homeMoneylineOdds
    });
    
    // Extract spread and total from bookmaker data
    if (selectedGame.bookmakers && selectedGame.bookmakers.length > 0) {
      // Find spread market
      const spreadMarket = markets.find((m: any) => m.key === 'spreads');
      if (spreadMarket && spreadMarket.outcomes) {
        spreadMarket.outcomes.forEach((outcome: any) => {
          const point = outcome.point;
          if (point !== undefined && point !== null) {
            const sign = point > 0 ? '+' : '';
            options.push({
              value: `${outcome.name}_spread_${point}`,
              label: `${outcome.name} ${sign}${point}`,
              market: 'spread',
              line: point,
              selection: outcome.name,
              odds: outcome.price
            });
          }
        });
      }
      
      // Find total market
      const totalMarket = markets.find((m: any) => m.key === 'totals');
      if (totalMarket && totalMarket.outcomes) {
        totalMarket.outcomes.forEach((outcome: any) => {
          const point = outcome.point;
          if (point !== undefined && point !== null) {
            options.push({
              value: `${outcome.name}_total_${point}`,
              label: `${outcome.name} ${point}`,
              market: 'total',
              line: point,
              selection: outcome.name,
              odds: outcome.price
            });
          }
        });
      }
    }
    
    return options;
  };

  // Parlay functionality
  const addParlayLeg = () => {
    if (!selectedGame || !manualEntry.selection || !manualEntry.market) {
      alert('Please select a game and betting option first');
      return;
    }

    // Find the selected option to get the proper selection name
    const selectedOption = getBettingOptions().find(opt => opt.value === manualEntry.selection);
    const actualSelection = selectedOption ? selectedOption.selection : manualEntry.selection;

    const newLeg = {
      gameId: selectedGame.id,
      market: manualEntry.market,
      selection: actualSelection,
      line: manualEntry.line,
      odds: manualEntry.odds,
      game: selectedGame
    };

    setParlayLegs([...parlayLegs, newLeg]);
    
    // Reset form for next leg
    setSelectedGame(null);
    setManualEntry({
      gameId: '',
      market: 'moneyline',
      selection: '',
      line: '',
      odds: '',
      units: 1
    });
  };

  const removeParlayLeg = (index: number) => {
    setParlayLegs(parlayLegs.filter((_, i) => i !== index));
  };

  const resetManualEntry = () => {
    setSelectedGame(null);
    setManualEntry({
      gameId: '',
      market: 'moneyline',
      selection: '',
      line: '',
      odds: '',
      units: 1
    });
    setParlayLegs([]);
    setParlayOdds('');
    setParlayUnits(1);
    setEntryType('single');
  };

  // Calculate stats from database picks with proper type checking
  const stats = {
    total: picksArray.length,
    pending: picksArray.filter((p: any) => p?.status === 'pending').length,
    won: picksArray.filter((p: any) => p?.status === 'won' || p?.status === 'win').length,
    lost: picksArray.filter((p: any) => p?.status === 'lost' || p?.status === 'loss').length,
    push: picksArray.filter((p: any) => p?.status === 'push').length,
    winRate: picksArray.filter((p: any) => p?.status === 'won' || p?.status === 'lost' || p?.status === 'win' || p?.status === 'loss').length > 0 ? 
      (picksArray.filter((p: any) => p?.status === 'won' || p?.status === 'win').length / picksArray.filter((p: any) => p?.status === 'won' || p?.status === 'lost' || p?.status === 'win' || p?.status === 'loss').length * 100) : 0,
    totalMoneyWonLost: picksArray.reduce((sum: number, p: any) => {
      if (p.status === 'won' || p.status === 'win') {
        // For graded picks, use the calculated win amount from database if available
        if (p.winAmount && !isNaN(parseFloat(p.winAmount))) {
          return sum + parseFloat(p.winAmount);
        }
        // Fallback to calculation based on odds and units
        const odds = p.odds || 0;
        const units = p.units || 0;
        const wagerAmount = calculateWagerAmount(units, p.betUnitAtTime || betUnit);
        if (odds > 0) {
          return sum + (odds / 100) * wagerAmount; // Profit only
        } else if (odds < 0) {
          return sum + (100 / Math.abs(odds)) * wagerAmount; // Profit only
        }
      } else if (p.status === 'lost' || p.status === 'loss') {
        const units = p.units || 0;
        const wagerAmount = calculateWagerAmount(units, p.betUnitAtTime || betUnit);
        return sum - wagerAmount; // Loss of wagered amount
      }
      return sum;
    }, 0)
  };

  // Authentication guard like My Feed
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Log in to View Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to track your betting picks and performance
              </p>
              <Button onClick={() => {
                // Clear auth cache before redirect
                const { queryClient } = require('@/lib/queryClient');
                queryClient.removeQueries({ queryKey: ["/api/auth/user"] }); 
                window.location.href = '/api/auth/login';
              }}>
                Log in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
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
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      {/* Mobile-first responsive container with proper padding for mobile nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        
        {/* Mobile-optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Picks</h1>
          </div>
        </div>



        {/* Mobile-optimized Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Picks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <Clock className="w-4 h-4 text-yellow-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.won}-{stats.lost}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Record</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <DollarSign className="w-4 h-4 text-purple-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  <p className={`text-lg sm:text-2xl font-bold ${stats.totalMoneyWonLost >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stats.totalMoneyWonLost >= 0 ? '+' : ''}${stats.totalMoneyWonLost.toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Win/Loss</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <DollarSign className="w-4 h-4 text-green-600 mb-1 sm:mb-0" />
                <div className="text-center sm:text-left">
                  {editingBetUnit ? (
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">$</span>
                      <Input
                        value={tempBetUnit}
                        onChange={(e) => setTempBetUnit(e.target.value)}
                        className="w-12 sm:w-16 h-6 sm:h-8 text-sm sm:text-lg font-bold p-1 text-center"
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveBetUnit} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                        <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelBetUnitEdit} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                        ${betUnit}
                      </p>
                      <Button size="sm" variant="ghost" onClick={handleEditBetUnit} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                        <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Unit Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-optimized Enter Manually Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowManualEntry(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2 shadow-sm text-sm sm:text-base w-full sm:w-auto max-w-xs"
          >
            <Plus className="w-4 h-4 mr-2 sm:mr-1" />
            Enter Manually
          </Button>
        </div>

        {/* Mobile-optimized Filter Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {(['all', 'pending', 'record'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors capitalize whitespace-nowrap ${
                selectedStatus === status
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {status === 'all' ? `All (${stats.total})` :
               status === 'pending' ? `Pending (${stats.pending})` :
               status === 'record' ? `Record (${stats.won}-${stats.lost}${stats.push > 0 ? `-${stats.push}` : ''})` :
               status}
            </button>
          ))}
        </div>

        {/* Picks List */}
        {(() => {
          const filteredPicks = selectedStatus === 'all' ? userPicks :
            selectedStatus === 'pending' ? userPicks.filter(p => p.status === 'pending') :
            selectedStatus === 'record' ? userPicks.filter(p => p.status === 'win' || p.status === 'loss' || p.status === 'won' || p.status === 'lost' || p.status === 'push') :
            userPicks;
          
          return filteredPicks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {userPicks.length === 0 ? 'No Picks Yet' : 
                   selectedStatus === 'record' ? 'No Completed Picks' : 
                   `No ${selectedStatus} Picks`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {userPicks.length === 0 
                    ? 'Start by clicking "Make Pick" on any game to track your bets here.'
                    : selectedStatus === 'record'
                    ? 'Your win-loss record will appear here once you have completed picks.'
                    : `You don't have any ${selectedStatus} picks at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredPicks.map((pick) => {
                console.log('=== PICK DEBUG ===');
                console.log('Full pick object:', JSON.stringify(pick, null, 2));
                console.log('pick.units:', pick.units);
                console.log('pick.betUnitAtTime:', pick.betUnitAtTime);
                console.log('betUnit from state:', betUnit);
                console.log('==================');
                return (
              <Card key={pick.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  {/* Mobile-optimized header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getStatusBadge(pick.status)}
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(pick.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePick(pick.id)}
                      className="text-red-600 hover:text-red-700 self-end sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Mobile-stacked layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {/* Game Info */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {/* Show parlay team names if it's a parlay, otherwise show single game */}
                        {pick.market === 'parlay' && pick.parlayLegs && pick.parlayLegs.length > 0 ? (
                          `${pick.parlayLegs.length}-Leg Parlay`
                        ) : (
                          `${pick.awayTeam || ''} @ ${pick.homeTeam || ''}`
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Placed: {new Date(pick.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Bet Info */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatBet(pick)}
                      </p>
                      
                      {/* FORCED VISIBLE UNITS DISPLAY */}
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: '#fef3c7',
                        border: '3px solid #f59e0b',
                        borderRadius: '8px',
                        position: 'relative',
                        zIndex: 9999
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#92400e',
                          marginBottom: '8px',
                          fontWeight: 'bold'
                        }}>
                          FORCED DEBUG: units={String(pick.units)}, betUnitAtTime={String(pick.betUnitAtTime)}, betUnit={String(betUnit)}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '18px' }}>
                              {pick.units || 1} unit{(pick.units || 1) !== 1 ? 's' : ''}
                            </span>
                            <span style={{ color: '#d97706' }}>•</span>
                            <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '20px' }}>
                              ${calculateWagerAmount(pick.units || 1, pick.betUnitAtTime || betUnit).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Parlay legs display */}
                      {pick.market === 'parlay' && pick.parlayLegs && (
                        <div className="mt-2 space-y-1">
                          {pick.parlayLegs.map((leg: any, index: number) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                              <div className="font-medium">{leg.game}</div>
                              <div>
                                {leg.selection} {leg.market === 'spread' && leg.line ? `${leg.line > 0 ? '+' : ''}${leg.line}` : ''}
                                {leg.market === 'total' && leg.line ? `${leg.line}` : ''}
                                {leg.market === 'moneyline' ? 'ML' : ''}
                              </div>
                            </div>
                          ))}
                          {/* Parlay Wager and Payout Display */}
                          {pick.odds !== 0 && (
                            <div className={`mt-2 p-2 rounded border ${
                              (pick.status === 'loss' || pick.status === 'lost') 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            }`}>
                              <div className="flex justify-between items-center text-sm">
                                <div>
                                  {editingUnits === pick.id ? (
                                    <div className="flex items-center gap-1">
                                      <span className={`font-medium ${
                                        (pick.status === 'loss' || pick.status === 'lost')
                                          ? 'text-red-900 dark:text-red-100'
                                          : 'text-blue-900 dark:text-blue-100'
                                      }`}>Wager: $</span>
                                      <Input
                                        type="number"
                                        value={tempUnits}
                                        onChange={(e) => setTempUnits(e.target.value)}
                                        className="w-16 h-6 text-xs p-1"
                                        step="0.5"
                                        min="0"
                                      />
                                      <span className={`text-xs ${
                                        (pick.status === 'loss' || pick.status === 'lost')
                                          ? 'text-red-700 dark:text-red-300'
                                          : 'text-blue-700 dark:text-blue-300'
                                      }`}>units</span>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveUnits(pick.id)}
                                        className="h-6 w-6 p-0 ml-1"
                                      >
                                        <Save className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelUnitsEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleEditUnits(pick.id, pick.units || 1)}>
                                      <span className={`font-medium ${
                                        (pick.status === 'loss' || pick.status === 'lost')
                                          ? 'text-red-900 dark:text-red-100'
                                          : 'text-blue-900 dark:text-blue-100'
                                      }`}>
                                        Wager: ${calculateWagerAmount(pick.units || 1, pick.betUnitAtTime).toFixed(2)}
                                      </span>
                                      <span className={`text-xs ${
                                        (pick.status === 'loss' || pick.status === 'lost')
                                          ? 'text-red-700 dark:text-red-300'
                                          : 'text-blue-700 dark:text-blue-300'
                                      }`}>
                                        ({pick.units || 1} units)
                                      </span>
                                      {pick.status === 'pending' && (
                                        <Edit3 className="w-3 h-3 text-blue-600 ml-1" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className={`font-medium ${
                                    (pick.status === 'loss' || pick.status === 'lost')
                                      ? 'text-red-900 dark:text-red-100'
                                      : 'text-green-900 dark:text-green-100'
                                  }`}>
                                    Payout: ${
                                      (pick.status === 'loss' || pick.status === 'lost')
                                        ? '0.00'
                                        : calculatePayout(calculateWagerAmount(pick.units || 1, pick.betUnitAtTime), pick.odds).toFixed(2)
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Single bet wager and payout display */}
                      {pick.market !== 'parlay' && pick.odds !== 0 && (
                        <div className={`mt-2 p-2 rounded border ${
                          (pick.status === 'loss' || pick.status === 'lost') 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}>
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              {editingUnits === pick.id ? (
                                <div className="flex items-center gap-1">
                                  <span className={`font-medium ${
                                    (pick.status === 'loss' || pick.status === 'lost')
                                      ? 'text-red-900 dark:text-red-100'
                                      : 'text-green-900 dark:text-green-100'
                                  }`}>Wager: $</span>
                                  <Input
                                    type="number"
                                    value={tempUnits}
                                    onChange={(e) => setTempUnits(e.target.value)}
                                    className="w-16 h-6 text-xs p-1"
                                    step="0.5"
                                    min="0"
                                  />
                                  <span className={`text-xs ${
                                    (pick.status === 'loss' || pick.status === 'lost')
                                      ? 'text-red-700 dark:text-red-300'
                                      : 'text-green-700 dark:text-green-300'
                                  }`}>units</span>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveUnits(pick.id)}
                                    className="h-6 w-6 p-0 ml-1"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelUnitsEdit}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleEditUnits(pick.id, pick.units || 1)}>
                                  <span className={`font-medium ${
                                    (pick.status === 'loss' || pick.status === 'lost')
                                      ? 'text-red-900 dark:text-red-100'
                                      : 'text-green-900 dark:text-green-100'
                                  }`}>
                                    Wager: ${calculateWagerAmount(pick.units || 1, pick.betUnitAtTime).toFixed(2)}
                                  </span>
                                  <span className={`text-xs ${
                                    (pick.status === 'loss' || pick.status === 'lost')
                                      ? 'text-red-700 dark:text-red-300'
                                      : 'text-green-700 dark:text-green-300'
                                  }`}>
                                    ({pick.units || 1} units)
                                  </span>
                                  {pick.status === 'pending' && (
                                    <Edit3 className="w-3 h-3 text-green-600 ml-1" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className={`font-medium ${
                                (pick.status === 'loss' || pick.status === 'lost')
                                  ? 'text-red-900 dark:text-red-100'
                                  : 'text-blue-900 dark:text-blue-100'
                              }`}>
                                Payout: ${
                                  (pick.status === 'loss' || pick.status === 'lost')
                                    ? '0.00'
                                    : calculatePayout(calculateWagerAmount(pick.units || 1, pick.betUnitAtTime), pick.odds).toFixed(2)
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bookmaker */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pick.bookmaker.displayName}
                      </p>
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
                      {(pick.status === 'win' || pick.status === 'won') && (
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            ✓ Won
                          </p>
                          {pick.result?.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pick.result.details}
                            </p>
                          )}
                        </div>
                      )}
                      {(pick.status === 'loss' || pick.status === 'lost') && (
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            ✗ Lost
                          </p>
                          {pick.result?.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pick.result.details}
                            </p>
                          )}
                        </div>
                      )}
                      {pick.status === 'push' && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            ↔ Push
                          </p>
                          {pick.result?.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pick.result.details}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
                })}
            </div>
          );
        })()}
      </div>

      {/* Manual Entry Modal */}
      <Dialog open={showManualEntry} onOpenChange={(open) => {
        setShowManualEntry(open);
        if (!open) resetManualEntry();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter Manual Pick</DialogTitle>
          </DialogHeader>
          
          {/* Tabs for Single vs Parlay */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setEntryType('single')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                entryType === 'single' 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Single Bet
            </button>
            <button
              onClick={() => setEntryType('parlay')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                entryType === 'parlay' 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Parlay
            </button>
          </div>

          <div className="space-y-4">
            {/* Single Bet Tab */}
            {entryType === 'single' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Game
                  </label>
                  <Select value={manualEntry.gameId} onValueChange={handleGameSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {gamesData?.map((game: any) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.away_team} @ {game.home_team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedGame && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Betting Option
                    </label>
                    <Select value={manualEntry.selection} onValueChange={(value) => {
                      const option = getBettingOptions().find(opt => opt.value === value);
                      if (option) {
                        handleManualEntryChange('selection', value); // Store the unique value
                        handleManualEntryChange('market', option.market);
                        handleManualEntryChange('line', option.line?.toString() || '');
                        // Pre-populate with API odds if available
                        handleManualEntryChange('odds', option.odds ? option.odds.toString() : '');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your bet" />
                      </SelectTrigger>
                      <SelectContent>
                        {getBettingOptions().map((option, index) => (
                          <SelectItem key={index} value={option.value}>
                            {option.label} {option.odds ? `(${option.odds > 0 ? '+' : ''}${option.odds})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Units Selection */}
                {selectedGame && manualEntry.selection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Units
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualEntryChange('units', Math.max(0.5, manualEntry.units - 0.5))}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <Input
                        value={manualEntry.units}
                        onChange={(e) => handleManualEntryChange('units', parseFloat(e.target.value) || 1)}
                        className="w-20 text-center"
                        type="number"
                        step="0.5"
                        min="0.5"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualEntryChange('units', manualEntry.units + 0.5)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        (${(manualEntry.units * betUnit).toFixed(0)} bet)
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Odds (adjustable)
                  </label>
                  <Input
                    value={manualEntry.odds}
                    onChange={(e) => handleManualEntryChange('odds', e.target.value)}
                    placeholder="e.g., -110, +150"
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleManualEntry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedGame || !manualEntry.selection}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pick
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManualEntry(false);
                      resetManualEntry();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {/* Parlay Tab */}
            {entryType === 'parlay' && (
              <>
                {/* Existing Parlay Legs */}
                {parlayLegs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Parlay Legs ({parlayLegs.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {parlayLegs.map((leg, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="text-sm">
                            <div className="font-medium">{leg.game?.away_team} @ {leg.game?.home_team}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {leg.selection} {leg.market === 'spread' && leg.line ? `${leg.line > 0 ? '+' : ''}${leg.line}` : ''}
                              {leg.market === 'total' && leg.line ? `${leg.line}` : ''}
                              {leg.market === 'moneyline' ? 'ML' : ''}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParlayLeg(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Leg */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add Leg - Select Game
                  </label>
                  <Select value={manualEntry.gameId} onValueChange={handleGameSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {gamesData?.map((game: any) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.away_team} @ {game.home_team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedGame && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Betting Option
                    </label>
                    <Select value={manualEntry.selection} onValueChange={(value) => {
                      const option = getBettingOptions().find(opt => opt.value === value);
                      if (option) {
                        handleManualEntryChange('selection', value); // Store the unique value
                        handleManualEntryChange('market', option.market);
                        handleManualEntryChange('line', option.line?.toString() || '');
                        // Pre-populate with API odds if available
                        handleManualEntryChange('odds', option.odds ? option.odds.toString() : '');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your bet" />
                      </SelectTrigger>
                      <SelectContent>
                        {getBettingOptions().map((option, index) => (
                          <SelectItem key={index} value={option.value}>
                            {option.label} {option.odds ? `(${option.odds > 0 ? '+' : ''}${option.odds})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Leg Odds Input */}
                {selectedGame && manualEntry.selection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Leg Odds (adjustable)
                    </label>
                    <Input
                      value={manualEntry.odds}
                      onChange={(e) => handleManualEntryChange('odds', e.target.value)}
                      placeholder="e.g., -110, +150"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Add Leg Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={addParlayLeg}
                    variant="outline"
                    className="flex-1"
                    disabled={!selectedGame || !manualEntry.selection}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leg
                  </Button>
                </div>

                {/* Parlay Units Selection */}
                {parlayLegs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Units
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setParlayUnits(Math.max(0.5, parlayUnits - 0.5))}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <Input
                        value={parlayUnits}
                        onChange={(e) => setParlayUnits(parseFloat(e.target.value) || 1)}
                        className="w-20 text-center"
                        type="number"
                        step="0.5"
                        min="0.5"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setParlayUnits(parlayUnits + 0.5)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        (${(parlayUnits * betUnit).toFixed(0)} bet)
                      </span>
                    </div>
                  </div>
                )}

                {/* Parlay Odds */}
                {parlayLegs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parlay Odds
                    </label>
                    <Input
                      value={parlayOdds}
                      onChange={(e) => setParlayOdds(e.target.value)}
                      placeholder="e.g., +250, +400"
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleManualEntry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={parlayLegs.length < 2 || !parlayOdds}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Parlay
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManualEntry(false);
                      resetManualEntry();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}