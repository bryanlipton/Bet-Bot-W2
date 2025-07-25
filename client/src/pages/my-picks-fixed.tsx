import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ActionStyleHeader from '@/components/ActionStyleHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Search,
  UserPlus,
  User
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';
import { queryClient } from '@/lib/queryClient';

export default function MyPicksPageFixed() {
  const [darkMode, setDarkMode] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'past'>('all');
  const [editingOdds, setEditingOdds] = useState<string | null>(null);
  const [tempOdds, setTempOdds] = useState<string>('');
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [betUnit, setBetUnit] = useState(50);
  const [tempBetUnit, setTempBetUnit] = useState('50');
  
  // Friend search states
  const [isFriendSearchOpen, setIsFriendSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();

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

  // Get user preferences for bet unit
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: isAuthenticated
  });

  // Set bet unit from user preferences
  useEffect(() => {
    if (userPreferences && (userPreferences as any).betUnit) {
      setBetUnit((userPreferences as any).betUnit);
      setTempBetUnit((userPreferences as any).betUnit.toString());
    }
  }, [userPreferences]);

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

  const handleSaveBetUnit = async () => {
    const newBetUnit = parseFloat(tempBetUnit);
    if (isNaN(newBetUnit) || newBetUnit <= 0) {
      alert('Please enter a valid unit size (e.g., 50, 100)');
      return;
    }

    try {
      console.log('Saving unit size:', newBetUnit);
      const response = await apiRequest('PUT', '/api/user/preferences', { betUnit: newBetUnit });
      console.log('Unit size saved successfully:', response);
      setBetUnit(newBetUnit);
      setShowUnitDialog(false);
      
      // Invalidate cache to ensure data persists across sessions
      await queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    } catch (error) {
      console.error('Error updating bet unit:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to update unit size. Please try again. Error: ' + (error.response?.data?.message || error.message));
    }
  };

  // Friend search functions
  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', '/api/user/follow', { targetUserId });
      toast({
        title: "Success",
        description: "User followed successfully!",
      });
      // Refresh search results
      if (searchTerm) {
        handleSearch(searchTerm);
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Page Header with Friend Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Picks</h1>
          </div>
          
          {/* Search for Friends Button */}
          <Dialog open={isFriendSearchOpen} onOpenChange={setIsFriendSearchOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search for friends...
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Search for Friends</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by username or name..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                
                {/* Search Results */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((searchUser) => (
                      <div key={searchUser.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          {/* User Avatar */}
                          <UserAvatar 
                            user={{
                              username: searchUser.username,
                              firstName: searchUser.firstName
                            }}
                            size="sm"
                          />
                          
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {searchUser.username || `${searchUser.firstName} ${searchUser.lastName}`.trim()}
                            </p>
                            {searchUser.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                                {searchUser.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(`/user/${searchUser.id}`, '_blank');
                            }}
                            className="flex items-center gap-1"
                          >
                            <User className="w-3 h-3" />
                            View
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleFollowUser(searchUser.id)}
                            className="flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            Follow
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : searchTerm.length > 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No users found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Start typing to search for friends
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats Cards - 4 separate cards */}
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unit Size</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${betUnit}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUnitDialog(true)}
                  className="ml-2"
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