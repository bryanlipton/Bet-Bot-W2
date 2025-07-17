import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Target, 
  BarChart3,
  Zap,
  Lock,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Trophy,
  TrendingDown,
  Filter
} from "lucide-react";
import type { UserBet } from "@shared/schema";

const betFormSchema = z.object({
  team: z.string().min(1, "Team is required"),
  betType: z.enum(["moneyline", "spread", "over", "under"]),
  odds: z.number().min(-1000).max(1000),
  stake: z.number().min(0.01),
  gameDate: z.string().min(1, "Game date is required"),
  notes: z.string().optional(),
});

type BetFormData = z.infer<typeof betFormSchema>;

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [isAddBetOpen, setIsAddBetOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const form = useForm<BetFormData>({
    resolver: zodResolver(betFormSchema),
    defaultValues: {
      team: "",
      betType: "moneyline",
      odds: 0,
      stake: 0,
      gameDate: "",
      notes: "",
    },
  });

  // Fetch all bets
  const { data: bets = [], isLoading: betsLoading } = useQuery({
    queryKey: ['/api/bets'],
    enabled: isAuthenticated,
  });

  // Fetch ROI data
  const { data: roiData } = useQuery({
    queryKey: ['/api/bets/roi', timeRange],
    enabled: isAuthenticated,
  });

  // Fetch pending bets
  const { data: pendingBets = [] } = useQuery({
    queryKey: ['/api/bets/pending'],
    enabled: isAuthenticated,
  });

  // Add bet mutation
  const addBetMutation = useMutation({
    mutationFn: async (data: BetFormData) => {
      return await apiRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet added successfully",
        description: "Your bet has been tracked.",
      });
      form.reset();
      setIsAddBetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/roi'] });
    },
    onError: (error) => {
      toast({
        title: "Error adding bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update bet result mutation
  const updateBetMutation = useMutation({
    mutationFn: async ({ betId, result }: { betId: number; result: 'won' | 'lost' | 'push' }) => {
      return await apiRequest(`/api/bets/${betId}`, {
        method: 'PATCH',
        body: JSON.stringify({ result }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet updated successfully",
        description: "The bet result has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets/roi'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BetFormData) => {
    addBetMutation.mutate(data);
  };

  const filteredBets = bets.filter((bet: UserBet) => {
    const matchesSearch = bet.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "pending" && bet.result === "pending") ||
                      (activeTab === "won" && bet.result === "won") ||
                      (activeTab === "lost" && bet.result === "lost");
    return matchesSearch && matchesTab;
  });

  const getBetTypeLabel = (betType: string) => {
    switch (betType) {
      case "moneyline": return "ML";
      case "spread": return "Spread";
      case "over": return "Over";
      case "under": return "Under";
      default: return betType;
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBadgeVariant = (result: string) => {
    switch (result) {
      case "won": return "default";
      case "lost": return "destructive";
      case "push": return "secondary";
      default: return "outline";
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  // Show locked state for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Locked Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="opacity-50 relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">--</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">ROI</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-50 relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">--</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-50 relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">--</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Active Bets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-50 relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">--</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Total Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login Message */}
          <div className="flex items-center justify-center min-h-[40vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Log in to track your bets
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track your betting history, monitor performance, and analyze your wins and losses with detailed analytics.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/api/login'}
                    className="w-full"
                  >
                    Log in
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show authenticated content
  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {roiData?.roi ? `${roiData.roi}%` : '--'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ROI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {roiData?.winRate ? `${roiData.winRate}%` : '--'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingBets.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Bets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {roiData?.totalProfit ? formatCurrency(roiData.totalProfit) : '--'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isAddBetOpen} onOpenChange={setIsAddBetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Bet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Bet</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter team name" {...field} />
                        </FormControl>
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
                            <SelectItem value="over">Over</SelectItem>
                            <SelectItem value="under">Under</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="odds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odds</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="-110" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
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
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={addBetMutation.isPending}>
                      {addBetMutation.isPending ? "Adding..." : "Add Bet"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddBetOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Bets</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Bets</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="won">Won</TabsTrigger>
                <TabsTrigger value="lost">Lost</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {betsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredBets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {bets.length === 0 ? "No bets tracked yet. Add your first bet!" : "No bets match your filters."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBets.map((bet: UserBet) => (
                  <div key={bet.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{bet.team}</h3>
                          <p className="text-sm text-gray-500">
                            {getBetTypeLabel(bet.betType)} • {formatOdds(bet.odds)} • {new Date(bet.gameDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={getBadgeVariant(bet.result)}>
                          {bet.result}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(bet.stake)}</p>
                          <p className="text-sm text-gray-500">
                            {bet.result === 'won' && `+${formatCurrency(bet.payout || 0)}`}
                            {bet.result === 'lost' && `-${formatCurrency(bet.stake)}`}
                            {bet.result === 'pending' && 'Pending'}
                            {bet.result === 'push' && 'Push'}
                          </p>
                        </div>
                        
                        {bet.result === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => updateBetMutation.mutate({ betId: bet.id, result: 'won' })}
                              disabled={updateBetMutation.isPending}
                            >
                              <Trophy className="w-4 h-4 mr-1" />
                              Won
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBetMutation.mutate({ betId: bet.id, result: 'lost' })}
                              disabled={updateBetMutation.isPending}
                            >
                              <TrendingDown className="w-4 h-4 mr-1" />
                              Lost
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {bet.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {bet.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}