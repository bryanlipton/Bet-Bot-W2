import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Target, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';

// Form schema for adding new bets
const addBetSchema = z.object({
  sport: z.string().min(1, "Sport is required"),
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  teamBet: z.string().min(1, "Team bet is required"),
  betType: z.enum(['moneyline', 'spread', 'total']),
  odds: z.number().min(-999).max(999),
  stake: z.number().min(0.01, "Stake must be at least $0.01"),
  toWin: z.number().min(0, "To win must be positive"),
  gameDate: z.string().min(1, "Game date is required"),
  bookmaker: z.string().min(1, "Bookmaker is required"),
  notes: z.string().optional()
});

type AddBetForm = z.infer<typeof addBetSchema>;

interface UserBet {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  teamBet: string;
  betType: string;
  odds: number;
  stake: number;
  toWin: number;
  gameDate: string;
  bookmaker: string;
  status: string;
  result?: string;
  profitLoss: number;
  notes?: string;
  placedAt: string;
  updatedAt: string;
}

interface ROIStats {
  thisWeek: {
    totalWagered: number;
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
  };
  thisMonth: {
    totalWagered: number;
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
  };
  thisYear: {
    totalWagered: number;
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
  };
  ytd: {
    totalWagered: number;
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
  };
  allTime: {
    totalWagered: number;
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
  };
}

export default function MyPicks() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isAddBetOpen, setIsAddBetOpen] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddBetForm>({
    resolver: zodResolver(addBetSchema),
    defaultValues: {
      sport: 'baseball_mlb',
      betType: 'moneyline',
      odds: -110,
      stake: 100,
      toWin: 90.91,
      gameDate: new Date().toISOString().split('T')[0],
      bookmaker: 'DraftKings'
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch user bets
  const { data: bets, isLoading: betsLoading } = useQuery<UserBet[]>({
    queryKey: ['/api/bets'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch ROI statistics
  const { data: roiStats, isLoading: roiLoading } = useQuery<ROIStats>({
    queryKey: ['/api/bets/roi'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch pending bets
  const { data: pendingBets, isLoading: pendingLoading } = useQuery<UserBet[]>({
    queryKey: ['/api/bets/pending'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Add bet mutation
  const addBetMutation = useMutation({
    mutationFn: async (betData: AddBetForm) => {
      return await apiRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify(betData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/roi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/pending'] });
      setIsAddBetOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Bet added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add bet",
        variant: "destructive",
      });
    },
  });

  // Calculate to win amount based on odds and stake
  const calculateToWin = (odds: number, stake: number) => {
    if (odds > 0) {
      return (stake * odds) / 100;
    } else {
      return (stake * 100) / Math.abs(odds);
    }
  };

  // Watch odds and stake changes to update toWin
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.odds && value.stake) {
        const toWin = calculateToWin(value.odds, value.stake);
        form.setValue('toWin', Number(toWin.toFixed(2)));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: AddBetForm) => {
    addBetMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getStatusBadge = (status: string, result?: string) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Pending</Badge>;
    }
    if (result === 'win') {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Win</Badge>;
    }
    if (result === 'loss') {
      return <Badge variant="outline" className="bg-red-50 text-red-700">Loss</Badge>;
    }
    if (result === 'push') {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Push</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-600';
    if (roi < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const filteredBets = bets?.filter(bet => 
    searchTeam === '' || 
    bet.homeTeam.toLowerCase().includes(searchTeam.toLowerCase()) ||
    bet.awayTeam.toLowerCase().includes(searchTeam.toLowerCase()) ||
    bet.teamBet.toLowerCase().includes(searchTeam.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Picks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your betting performance and ROI</p>
        </div>
        <Dialog open={isAddBetOpen} onOpenChange={setIsAddBetOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Bet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Bet</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baseball_mlb">MLB</SelectItem>
                            <SelectItem value="americanfootball_nfl">NFL</SelectItem>
                            <SelectItem value="basketball_nba">NBA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="betType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bet Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bet type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="moneyline">Moneyline</SelectItem>
                            <SelectItem value="spread">Spread</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="homeTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Team</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="New York Yankees" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="awayTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Away Team</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Boston Red Sox" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="teamBet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Bet</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="New York Yankees" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="odds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odds</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="-110" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stake ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="100" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toWin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Win ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="90.91" 
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gameDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bookmaker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bookmaker</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bookmaker" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DraftKings">DraftKings</SelectItem>
                            <SelectItem value="FanDuel">FanDuel</SelectItem>
                            <SelectItem value="BetMGM">BetMGM</SelectItem>
                            <SelectItem value="Caesars">Caesars</SelectItem>
                            <SelectItem value="BetRivers">BetRivers</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Add notes about this bet..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddBetOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addBetMutation.isPending}>
                    {addBetMutation.isPending ? 'Adding...' : 'Add Bet'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bets">My Bets</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {roiLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roiStats && Object.entries(roiStats).map(([period, stats]) => (
                <Card key={period}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize flex items-center">
                      {period === 'ytd' ? 'Year to Date' : period.replace(/([A-Z])/g, ' $1')}
                      <Badge variant="outline" className="ml-2">
                        {stats.totalBets} bets
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Wagered</span>
                        <span className="font-semibold">{formatCurrency(stats.totalWagered)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Profit</span>
                        <span className={`font-semibold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.totalProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
                        <span className={`font-semibold ${getROIColor(stats.roi)}`}>
                          {stats.roi.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                        <span className="font-semibold">{stats.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bets" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by team..."
                  value={searchTeam}
                  onChange={(e) => setSearchTeam(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {betsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBets?.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {bet.awayTeam} @ {bet.homeTeam}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1)} • {bet.teamBet} • {formatOdds(bet.odds)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Game: {new Date(bet.gameDate).toLocaleDateString()} {new Date(bet.gameDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {bet.bookmaker}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Bet Placed: {new Date(bet.placedAt).toLocaleDateString()} {new Date(bet.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        {bet.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {bet.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(bet.status, bet.result)}
                        <div className="text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            Stake: {formatCurrency(bet.stake)}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            To Win: {formatCurrency(bet.toWin)}
                          </p>
                          {bet.status !== 'pending' && (
                            <p className={`font-semibold ${bet.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              P&L: {formatCurrency(bet.profitLoss)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredBets?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No bets found.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBets?.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {bet.awayTeam} @ {bet.homeTeam}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1)} • {bet.teamBet} • {formatOdds(bet.odds)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Game: {new Date(bet.gameDate).toLocaleDateString()} {new Date(bet.gameDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {bet.bookmaker}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Bet Placed: {new Date(bet.placedAt).toLocaleDateString()} {new Date(bet.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        {bet.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {bet.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Pending</Badge>
                        <div className="text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            Stake: {formatCurrency(bet.stake)}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            To Win: {formatCurrency(bet.toWin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingBets?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No pending bets.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Performance analytics coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bet Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Bet distribution charts coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}