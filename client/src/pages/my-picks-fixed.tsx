import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ActionStyleHeader from '@/components/ActionStyleHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export default function MyPicksPageFixed() {
  const [darkMode, setDarkMode] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'past'>('all');
  const [editingOdds, setEditingOdds] = useState<string | null>(null);
  const [tempOdds, setTempOdds] = useState<string>('');

  // Initialize dark mode from localStorage (default to dark mode)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
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
  });

  // Authentication guard
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
              <Button onClick={() => window.location.href = '/api/login'}>
                Log in
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

  // Calculate stats safely
  const stats = {
    total: picksArray.length,
    pending: picksArray.filter((p: any) => p?.status === 'pending').length,
    won: picksArray.filter((p: any) => ['won', 'win'].includes(p?.status)).length,
    lost: picksArray.filter((p: any) => ['lost', 'loss'].includes(p?.status)).length,
  };

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
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatBet = (pick: any) => {
    if (!pick) return 'Unknown';
    
    const odds = pick.odds ? formatOdds(pick.odds) : '';
    const market = pick.market || 'unknown';
    const selection = pick.selection || 'Unknown';
    const line = pick.line;
    
    if (market === 'moneyline') {
      return `${selection} ML ${odds}`;
    }
    if (market === 'spread') {
      const lineValue = line || 0;
      return `${selection} ${lineValue > 0 ? '+' : ''}${lineValue} ${odds}`;
    }
    if (market === 'total') {
      return `${selection} ${line || ''} ${odds}`;
    }
    return `${selection} ${market} ${odds}`;
  };

  const deletePick = async (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      try {
        await apiRequest('DELETE', `/api/user/picks/${pickId}`);
        refetch();
      } catch (error) {
        console.error('Error deleting pick:', error);
        alert('Failed to delete pick. Please try again.');
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
      alert('Please enter valid odds (e.g., -110, +150)');
      return;
    }

    try {
      await apiRequest('PATCH', `/api/user/picks/${pickId}/odds`, { odds });
      refetch();
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

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                </div>
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
            {filteredPicks.length === 0 ? (
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
              filteredPicks.map((pick: any) => (
                <Card key={pick.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(pick.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(pick.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {pick.awayTeam} @ {pick.homeTeam}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {formatBet(pick)}
                        </p>

                        {pick.odds === 0 && pick.bookmaker === 'manual' && (
                          <div className="mt-2">
                            {editingOdds === pick.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={tempOdds}
                                  onChange={(e) => setTempOdds(e.target.value)}
                                  placeholder="e.g., -110, +150"
                                  className="w-32"
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

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePick(pick.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}