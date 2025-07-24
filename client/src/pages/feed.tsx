import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/UserAvatar";
import { TrendingUp, Clock, Users, MessageSquare, Heart, Share, User } from "lucide-react";

interface FeedPick {
  id: number;
  userId: string;
  username: string;
  avatar: string;
  profileImageUrl?: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  game: string;
  market: string;
  line?: string;
  odds: number;
  units: number;
  betUnitAtTime: number;
  bookmakerDisplayName: string;
  status: string;
  result?: string;
  winAmount?: number;
  createdAt: string;
  gameDate?: string;
  gradedAt?: string;
}

export default function Feed() {
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  // Fetch real social feed data from users you follow
  const { data: feedPicks = [], isLoading, error } = useQuery<FeedPick[]>({
    queryKey: ['/api/user/social-feed'],
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });

  const handleLike = (itemId: number) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  const getStatusBadge = (pick: FeedPick) => {
    if (pick.status === 'win') {
      return { text: 'WON', color: 'bg-green-500' };
    } else if (pick.status === 'loss') {
      return { text: 'LOST', color: 'bg-red-500' };
    } else if (pick.status === 'push') {
      return { text: 'PUSH', color: 'bg-gray-500' };
    } else {
      return { text: 'PENDING', color: 'bg-blue-500' };
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">My Feed</h1>
            <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
              Loading your social feed...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">My Feed</h1>
            <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
              Unable to load your social feed
            </p>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                There was an error loading your feed. Please try refreshing the page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto">
        {/* Header - Responsive Typography */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">My Feed</h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
            {feedPicks.length > 0 
              ? "Latest picks from people you follow"
              : "Follow other users to see their picks in your feed"
            }
          </p>
        </div>

        {feedPicks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No picks in your feed yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start following other users to see their betting picks and activity in your feed.
              </p>
              <Button variant="outline">
                Discover Users
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Feed Items - Responsive Layout */}
            {/* Mobile: Single column, Desktop: 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {feedPicks.map((pick) => {
                const badge = getStatusBadge(pick);
                return (
                  <Card key={pick.id} className="hover:shadow-md md:hover:shadow-lg xl:hover:shadow-xl transition-shadow h-fit">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {/* User Profile Picture */}
                        <UserAvatar 
                          user={{
                            profileImageUrl: pick.profileImageUrl,
                            avatar: pick.avatar,
                            username: pick.username
                          }}
                          size="lg"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm truncate">
                              {pick.username || `User ${pick.userId.slice(-4)}`}
                            </span>
                            <Badge className={`${badge.color} text-white text-xs`}>
                              {badge.text}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(pick.createdAt)}
                            </span>
                          </div>
                          <CardTitle className="text-sm md:text-lg">
                            {pick.selection} {formatOdds(pick.odds)}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {pick.game}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Market:</span>
                          <span>{pick.market}{pick.line ? ` (${pick.line})` : ''}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Units:</span>
                          <span>{pick.units} units (${(pick.units * pick.betUnitAtTime).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Bookmaker:</span>
                          <span>{pick.bookmakerDisplayName}</span>
                        </div>
                        
                        {pick.status !== 'pending' && pick.result && (
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Result:</span>
                            <span className={pick.status === 'win' ? 'text-green-600' : pick.status === 'loss' ? 'text-red-600' : 'text-gray-600'}>
                              {pick.winAmount ? `${pick.winAmount > 0 ? '+' : ''}$${pick.winAmount.toFixed(2)}` : pick.result}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400 hover:text-red-500 p-1"
                            onClick={() => handleLike(pick.id)}
                          >
                            <Heart 
                              className={`w-4 h-4 mr-1 ${
                                likedItems.has(pick.id) 
                                  ? "fill-red-500 text-red-500" 
                                  : ""
                              }`} 
                            />
                            <span className="text-xs">
                              {likedItems.has(pick.id) ? 1 : 0}
                            </span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400 hover:text-blue-500 p-1"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span className="text-xs">0</span>
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 dark:text-gray-400 hover:text-green-500 p-1"
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Load More */}
            {feedPicks.length >= 20 && (
              <div className="text-center mt-8">
                <Button variant="outline" className="w-full md:w-auto">
                  Load More Updates
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}