import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
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
  X,
  Plus
} from "lucide-react";

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'past'>('all');
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

  // Fetch available games for manual entry
  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: showManualEntry,
  });

  // Load picks - combine localStorage with hardcoded database picks until auth is fixed
  useEffect(() => {
    const loadPicks = () => {
      try {
        // Load from localStorage
        const localPicks = pickStorage.getPicks();
        
        // Add historical database picks (until auth is fixed)
        const databasePicks: Pick[] = [
          {
            id: 'db_pick_1',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            gameInfo: { homeTeam: 'Boston Red Sox', awayTeam: 'New York Yankees', gameTime: new Date(Date.now() - 86400000).toISOString(), sport: 'baseball_mlb' },
            betInfo: { selection: 'Boston Red Sox', market: 'moneyline', odds: 150, units: 2.0, line: null },
            bookmaker: { key: 'draftkings', displayName: 'DraftKings', deepLink: '' },
            status: 'won'
          },
          {
            id: 'db_pick_2',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            gameInfo: { homeTeam: 'Los Angeles Dodgers', awayTeam: 'San Francisco Giants', gameTime: new Date(Date.now() - 86400000).toISOString(), sport: 'baseball_mlb' },
            betInfo: { selection: 'Los Angeles Dodgers -1.5', market: 'spread', odds: -110, units: 1.5, line: '-1.5' },
            bookmaker: { key: 'fanduel', displayName: 'FanDuel', deepLink: '' },
            status: 'lost'
          },
          {
            id: 'db_pick_3',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            gameInfo: { homeTeam: 'Milwaukee Brewers', awayTeam: 'Chicago Cubs', gameTime: new Date(Date.now() - 86400000).toISOString(), sport: 'baseball_mlb' },
            betInfo: { selection: 'Over 8.5', market: 'over', odds: -105, units: 1.0, line: '8.5' },
            bookmaker: { key: 'betmgm', displayName: 'BetMGM', deepLink: '' },
            status: 'won'
          },
          {
            id: 'db_pick_4',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            gameInfo: { homeTeam: 'Toronto Blue Jays', awayTeam: 'San Francisco Giants', gameTime: new Date(Date.now() - 86400000).toISOString(), sport: 'baseball_mlb' },
            betInfo: { selection: 'Toronto Blue Jays', market: 'moneyline', odds: 130, units: 1.5, line: null },
            bookmaker: { key: 'draftkings', displayName: 'DraftKings', deepLink: '' },
            status: 'won'
          },
          {
            id: 'db_pick_5',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            gameInfo: { homeTeam: 'Parlay', awayTeam: 'Baltimore Orioles + New York Mets', gameTime: new Date(Date.now() - 86400000).toISOString(), sport: 'baseball_mlb' },
            betInfo: { selection: '2-Leg Parlay', market: 'parlay', odds: 280, units: 1.0, line: null },
            bookmaker: { key: 'fanduel', displayName: 'FanDuel', deepLink: '' },
            status: 'lost'
          }
        ];
        
        // Sort picks: pending first, then settled by timestamp (newest first)
        const pendingPicks = localPicks.filter(pick => pick.status === 'pending');
        const settledPicks = databasePicks.filter(pick => pick.status !== 'pending');
        
        // Sort settled picks by timestamp (newest first)
        settledPicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Combine with pending picks first, then settled picks
        const allPicks = [...pendingPicks, ...settledPicks];
        setPicks(allPicks);
        console.log('Loaded picks from localStorage:', localPicks.length);
        console.log('Added database picks:', databasePicks.length);
        console.log('Total picks:', allPicks.length);
        
      } catch (error) {
        console.error('Error loading picks:', error);
        setPicks([]);
      }
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

  // Load bet unit from localStorage for now
  useEffect(() => {
    const loadBetUnit = () => {
      try {
        const localBetUnit = pickStorage.getBetUnit();
        setBetUnit(localBetUnit);
        console.log('Loaded bet unit from localStorage:', localBetUnit);
      } catch (error) {
        console.error('Error loading bet unit:', error);
        setBetUnit(10); // Default value
      }
    };

    loadBetUnit();
  }, []);

  // Also update bet unit when modal opens
  useEffect(() => {
    if (showManualEntry) {
      const currentBetUnit = pickStorage.getBetUnit();
      setBetUnit(currentBetUnit);
      console.log('Updated bet unit for modal:', currentBetUnit);
    }
  }, [showManualEntry]);

  // Save bet unit to database
  const saveBetUnit = async (newBetUnit: number) => {
    try {
      await databasePickStorage.setBetUnit(newBetUnit);
      setBetUnit(newBetUnit);
    } catch (error) {
      console.error('Error saving bet unit:', error);
      // Fallback to localStorage if database fails
      setBetUnit(newBetUnit);
      localStorage.setItem('betUnit', newBetUnit.toString());
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

  const filteredPicks = picks.filter(pick => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'past') return pick.status === 'won' || pick.status === 'lost';
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

  // Calculate wager amount based on units and bet unit
  const calculateWagerAmount = (units: number): number => {
    return units * betUnit;
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

  const formatBet = (pick: Pick) => {
    const { betInfo } = pick;
    if (betInfo.market === 'parlay') {
      return `${betInfo.selection} Parlay`;
    }
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

  const deletePick = async (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      try {
        await databasePickStorage.deletePick(pickId);
        // Remove from local state immediately
        setPicks(picks.filter(pick => pick.id !== pickId));
      } catch (error) {
        console.error('Error deleting pick:', error);
        // Fallback to localStorage
        pickStorage.deletePick(pickId);
      }
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

  const handleSaveOdds = async (pickId: string) => {
    const odds = parseFloat(tempOdds);
    if (isNaN(odds) || odds === 0) {
      alert('Please enter valid odds (e.g., -110, +150)');
      return;
    }

    try {
      await databasePickStorage.updatePickOdds(pickId, tempOdds);
      
      // Update local state
      const updatedPicks = picks.map(pick => {
        if (pick.id === pickId) {
          return {
            ...pick,
            odds: tempOdds
          };
        }
        return pick;
      });

      setPicks(updatedPicks);
      setEditingOdds(null);
      setTempOdds('');
    } catch (error) {
      console.error('Error updating odds:', error);
      // Fallback to localStorage
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
      // For localStorage, update the pick directly
      const updatedPicks = picks.map(pick => {
        if (pick.id === pickId) {
          return {
            ...pick,
            betInfo: {
              ...pick.betInfo,
              units: units
            }
          };
        }
        return pick;
      });

      setPicks(updatedPicks);
      pickStorage.updatePick(pickId, { 
        betInfo: { 
          ...picks.find(p => p.id === pickId)?.betInfo,
          units: units 
        } 
      });
      setEditingUnits(null);
      setTempUnits('');
    } catch (error) {
      console.error('Error updating units:', error);
    }
  };

  const handleCancelUnitsEdit = () => {
    setEditingUnits(null);
    setTempUnits('');
  };

  const handleManualEntry = () => {
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

      // Save to database
      databasePickStorage.savePick({
        gameId: selectedGame.id,
        homeTeam: selectedGame.home_team,
        awayTeam: selectedGame.away_team,
        selection: actualSelection,
        market: manualEntry.market,
        line: manualEntry.line || null,
        units: manualEntry.units,
        bookmaker: 'manual',
        bookmakerDisplayName: 'Manual Entry',
        gameDate: selectedGame.commence_time?.split('T')[0] || new Date().toISOString().split('T')[0],
        gameTime: selectedGame.commence_time || new Date().toISOString(),
        odds: manualEntry.odds || '0'
      }).catch(error => {
        console.error('Error saving pick to database:', error);
        // Fallback to localStorage
        pickStorage.savePick(pick);
      });
      
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

      // Save parlay to database
      databasePickStorage.savePick({
        gameId: `parlay_${Date.now()}`,
        homeTeam: 'Multiple Games',
        awayTeam: `${parlayLegs.length}-Leg Parlay`,
        selection: `${parlayLegs.length} Legs`,
        market: 'parlay',
        line: null,
        units: parlayUnits,
        bookmaker: 'manual',
        bookmakerDisplayName: 'Manual Entry',
        gameDate: new Date().toISOString().split('T')[0],
        gameTime: new Date().toISOString(),
        odds: parlayOdds,
        parlayLegs: parlayLegs.map(leg => ({
          game: `${leg.game?.away_team} @ ${leg.game?.home_team}`,
          market: leg.market,
          selection: leg.selection,
          line: leg.line ? parseFloat(leg.line) : undefined,
          odds: leg.odds ? parseFloat(leg.odds) : 0
        }))
      }).catch(error => {
        console.error('Error saving parlay to database:', error);
        // Fallback to localStorage
        pickStorage.savePick(parlayPick);
      });
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
    const game = gamesData?.find((g: any) => g.id === gameId);
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

  // Calculate stats
  const stats = {
    total: picks.length,
    pending: picks.filter(p => p.status === 'pending').length,
    won: picks.filter(p => p.status === 'won' || p.status === 'win').length,
    lost: picks.filter(p => p.status === 'lost' || p.status === 'loss').length,
    push: picks.filter(p => p.status === 'push').length,
    winRate: picks.filter(p => p.status === 'won' || p.status === 'lost' || p.status === 'win' || p.status === 'loss').length > 0 ? 
      (picks.filter(p => p.status === 'won' || p.status === 'win').length / picks.filter(p => p.status === 'won' || p.status === 'lost' || p.status === 'win' || p.status === 'loss').length * 100) : 0,
    totalUnits: picks.reduce((sum, p) => {
      if (p.status === 'won' || p.status === 'win') {
        // Calculate winnings based on odds and units
        const odds = p.betInfo?.odds || 0;
        const units = p.betInfo?.units || 0;
        if (odds > 0) {
          return sum + (odds / 100) * units;
        } else if (odds < 0) {
          return sum + (100 / Math.abs(odds)) * units;
        }
      } else if (p.status === 'lost' || p.status === 'loss') {
        return sum - (p.betInfo?.units || 0);
      }
      return sum;
    }, 0)
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.won}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.lost}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lost</p>
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <div>
                  {editingBetUnit ? (
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">$</span>
                      <Input
                        value={tempBetUnit}
                        onChange={(e) => setTempBetUnit(e.target.value)}
                        className="w-16 h-8 text-lg font-bold p-1"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                      <Button size="sm" onClick={handleSaveBetUnit} className="h-6 w-6 p-0">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelBetUnitEdit} className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${betUnit}
                      </p>
                      <Button size="sm" variant="ghost" onClick={handleEditBetUnit} className="h-6 w-6 p-0">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bet Unit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enter Manually Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowManualEntry(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 shadow-sm"
          >
            Enter Manually
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['all', 'pending', 'past'] as const).map((status) => (
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
                stats.won + stats.lost})
            </button>
          ))}
        </div>

        {/* Picks List */}
        {(() => {
          const filteredPicks = selectedStatus === 'all' ? picks :
            selectedStatus === 'pending' ? picks.filter(p => p.status === 'pending') :
            selectedStatus === 'past' ? picks.filter(p => p.status === 'win' || p.status === 'loss' || p.status === 'won' || p.status === 'lost' || p.status === 'push') :
            picks;
          
          return filteredPicks.length === 0 ? (
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
                        Placed: {new Date(pick.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Bet Info */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatBet(pick)}
                      </p>
                      {/* Parlay legs display */}
                      {pick.betInfo.market === 'parlay' && pick.betInfo.parlayLegs && (
                        <div className="mt-2 space-y-1">
                          {pick.betInfo.parlayLegs.map((leg, index) => (
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
                          {pick.betInfo.odds !== 0 && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <div className="flex justify-between items-center text-sm">
                                <div>
                                  {editingUnits === pick.id ? (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-blue-900 dark:text-blue-100">Wager: $</span>
                                      <Input
                                        type="number"
                                        value={tempUnits}
                                        onChange={(e) => setTempUnits(e.target.value)}
                                        className="w-16 h-6 text-xs p-1"
                                        step="0.5"
                                        min="0"
                                      />
                                      <span className="text-xs text-blue-700 dark:text-blue-300">units</span>
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
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleEditUnits(pick.id, pick.betInfo.units || 1)}>
                                      <span className="font-medium text-blue-900 dark:text-blue-100">
                                        Wager: ${calculateWagerAmount(pick.betInfo.units || 1).toFixed(2)}
                                      </span>
                                      <span className="text-xs text-blue-700 dark:text-blue-300">
                                        ({pick.betInfo.units || 1} units)
                                      </span>
                                      {pick.status === 'pending' && (
                                        <Edit3 className="w-3 h-3 text-blue-600 ml-1" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-green-900 dark:text-green-100">
                                    Payout: ${calculatePayout(calculateWagerAmount(pick.betInfo.units || 1), pick.betInfo.odds).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Single bet wager and payout display */}
                      {pick.betInfo.market !== 'parlay' && pick.betInfo.odds !== 0 && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              {editingUnits === pick.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-green-900 dark:text-green-100">Wager: $</span>
                                  <Input
                                    type="number"
                                    value={tempUnits}
                                    onChange={(e) => setTempUnits(e.target.value)}
                                    className="w-16 h-6 text-xs p-1"
                                    step="0.5"
                                    min="0"
                                  />
                                  <span className="text-xs text-green-700 dark:text-green-300">units</span>
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
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleEditUnits(pick.id, pick.betInfo.units || 1)}>
                                  <span className="font-medium text-green-900 dark:text-green-100">
                                    Wager: ${calculateWagerAmount(pick.betInfo.units || 1).toFixed(2)}
                                  </span>
                                  <span className="text-xs text-green-700 dark:text-green-300">
                                    ({pick.betInfo.units || 1} units)
                                  </span>
                                  {pick.status === 'pending' && (
                                    <Edit3 className="w-3 h-3 text-green-600 ml-1" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                Payout: ${calculatePayout(calculateWagerAmount(pick.betInfo.units || 1), pick.betInfo.odds).toFixed(2)}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
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