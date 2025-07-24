import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { ActionStyleHeader } from '@/components/ActionStyleHeader';
import { useAuth } from '@/hooks/useAuth';
import { 
  Rss,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Heart,
  Share2,
  BookOpen,
  Trophy,
  Target,
  Zap,
  Users,
  Plus
} from 'lucide-react';

interface FeedPick {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  userAvatarEmoji?: string;
  game: string;
  selection: string;
  market: string;
  line?: string;
  odds: number;
  units: number;
  status: 'pending' | 'win' | 'loss' | 'push';
  createdAt: string;
  gameDate?: string;
  gradedAt?: string;
  parlayLegs?: Array<{
    game: string;
    selection: string;
    market: string;
    line?: string | number;
  }>;
}

export default function MyFeedPage() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  // Fetch social feed data from users you follow
  const { data: feedPicks = [], isLoading: feedLoading, error: feedError } = useQuery({
    queryKey: ['/api/users/feed'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Debug logging
  console.log('My Feed Debug:', {
    isAuthenticated,
    feedLoading,
    feedError,
    feedPicksLength: feedPicks?.length || 0,
    feedPicks: feedPicks
  });

  // Helper functions for display
  const formatOdds = (odds: number): string => {
    if (odds > 0) return `+${odds}`;
    return odds.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'win': return 'text-green-600 dark:text-green-400';
      case 'loss': return 'text-red-600 dark:text-red-400';
      case 'push': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'win': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Won</Badge>;
      case 'loss': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Lost</Badge>;
      case 'push': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Push</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pending</Badge>;
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Log in Required
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                Log in to see picks from people you follow
              </p>
              <Button onClick={() => window.location.href = '/api/login'} className="text-base">
                Log in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (feedLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Rss className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Feed</h1>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Following {user ? 'friends and top bettors' : '...'}
            </div>
          </div>

          {/* Feed Content - Desktop Grid Layout */}
          {(feedPicks as FeedPick[]).length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  No Picks to Show
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Follow other users to see their betting activity in your personalized feed
                </p>
                <Button onClick={() => window.location.href = '/profile'} size="lg" className="text-lg px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Find People to Follow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(feedPicks as FeedPick[]).map((pick: FeedPick) => (
                <Card key={pick.id} className="bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-200 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* User Avatar - Larger on Desktop */}
                      <div className="flex-shrink-0">
                        <UserAvatar 
                          user={{
                            profileImageUrl: pick.userAvatar,
                            avatar: pick.userAvatarEmoji,
                            username: pick.username
                          }}
                          size="lg"
                        />
                      </div>
                      
                      {/* Pick Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => window.open(`/user/${pick.userId}`, '_blank')}
                              className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            >
                              {pick.username}
                            </button>
                            <span className="text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {formatTimeAgo(pick.createdAt)}
                            </span>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(pick.status)}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          {/* Check if it's a parlay */}
                          {pick.market === 'parlay' && pick.parlayLegs && pick.parlayLegs.length > 0 ? (
                            <div>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                                {pick.parlayLegs.length}-Leg Parlay
                              </div>
                              <div className="space-y-3 mb-4">
                                {pick.parlayLegs.map((leg, index) => (
                                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">{leg.game}</div>
                                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                                      {leg.selection}
                                      {leg.market === 'spread' && leg.line ? ` ${(typeof leg.line === 'number' && leg.line > 0) ? '+' : ''}${leg.line}` : ''}
                                      {leg.market === 'total' && leg.line ? ` ${leg.line}` : ''}
                                      {leg.market === 'moneyline' ? ' ML' : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="font-mono font-bold text-lg">
                                  {formatOdds(pick.odds)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  {pick.units} unit{pick.units !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                                {pick.game}
                              </div>
                              <div className="mb-3">
                                <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                                  {pick.selection}
                                </span>
                                {pick.line && (
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    {pick.line}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="font-mono font-bold text-lg">
                                  {formatOdds(pick.odds)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  {pick.units} unit{pick.units !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span>Game: {pick.gameDate ? new Date(pick.gameDate).toLocaleDateString() : 'TBD'}</span>
                            <span className="mx-2">•</span>
                            <span>Placed: {formatTimeAgo(pick.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Rss className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Feed</h1>
          </div>

          {/* Feed Content - Mobile Stack Layout */}
          {(feedPicks as FeedPick[]).length === 0 ? (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Picks to Show
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Follow other users to see their betting activity in your feed
                </p>
                <Button onClick={() => window.location.href = '/profile'} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Find People to Follow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(feedPicks as FeedPick[]).map((pick: FeedPick) => (
                <Card key={pick.id} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        <UserAvatar 
                          user={{
                            profileImageUrl: pick.userAvatar,
                            avatar: pick.userAvatarEmoji,
                            username: pick.username
                          }}
                          size="md"
                        />
                      </div>
                      
                      {/* Pick Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => window.open(`/user/${pick.userId}`, '_blank')}
                              className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            >
                              {pick.username}
                            </button>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">•</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                              {formatTimeAgo(pick.createdAt)}
                            </span>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(pick.status)}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          {/* Check if it's a parlay */}
                          {pick.market === 'parlay' && pick.parlayLegs && pick.parlayLegs.length > 0 ? (
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                                {pick.parlayLegs.length}-Leg Parlay
                              </div>
                              <div className="space-y-2 mb-3">
                                {pick.parlayLegs.map((leg, index) => (
                                  <div key={index} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                    <div className="font-medium text-gray-900 dark:text-white truncate">{leg.game}</div>
                                    <div className="text-blue-600 dark:text-blue-400">
                                      {leg.selection}
                                      {leg.market === 'spread' && leg.line ? ` ${(typeof leg.line === 'number' && leg.line > 0) ? '+' : ''}${leg.line}` : ''}
                                      {leg.market === 'total' && leg.line ? ` ${leg.line}` : ''}
                                      {leg.market === 'moneyline' ? ' ML' : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-mono font-medium">
                                  {formatOdds(pick.odds)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {pick.units} unit{pick.units !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white mb-1 break-words">
                                {pick.game}
                              </div>
                              <div className="flex items-center gap-3 text-xs mb-2">
                                <span className="font-medium text-blue-600 dark:text-blue-400 break-words">
                                  {pick.selection}
                                </span>
                                {pick.line && (
                                  <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {pick.line}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-mono font-medium">
                                  {formatOdds(pick.odds)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {pick.units} unit{pick.units !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span>Game: {pick.gameDate ? new Date(pick.gameDate).toLocaleDateString() : 'TBD'}</span>
                            <span className="mx-1">•</span>
                            <span>Placed: {formatTimeAgo(pick.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}