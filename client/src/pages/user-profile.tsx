import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Users, 
  UserPlus, 
  UserMinus,
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Trophy,
  Clock,
  ArrowLeft,
  UserCheck,
  Flame
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  avatar?: string;
  followers: number;
  following: number;
  totalPicks?: number; // Legacy field for backwards compatibility
  winRate?: number; // Legacy field for backwards compatibility
  totalUnits: number;
  joinDate: string;
  bio?: string;
  // Legacy privacy settings for backwards compatibility
  totalPicksPublic?: boolean;
  pendingPicksPublic?: boolean;
  winRatePublic?: boolean;
  winStreakPublic?: boolean;
  // New structure
  stats?: {
    totalPicks?: number;
    pendingPicks?: number;
    winRate?: number;
    winStreak?: number;
    record?: string; // e.g., "5-2"
  };
  privacySettings?: {
    totalPicksPublic: boolean;
    pendingPicksPublic: boolean;
    winRatePublic: boolean;
    winStreakPublic: boolean;
  };
}

interface PublicFeedItem {
  id: string;
  type: 'pick' | 'win' | 'loss';
  pick: any;
  timestamp: string;
  result?: 'win' | 'loss' | 'push';
  status?: 'win' | 'loss' | 'push' | 'pending';
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/users', userId],
    enabled: !!userId,
  });

  // Fetch user's public feed
  const { data: publicFeed = [], isLoading: feedLoading } = useQuery({
    queryKey: ['/api/users', userId, 'feed'],
    enabled: !!userId,
  });

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['/api/user/follow-status', userId],
    enabled: !!userId && isAuthenticated,
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (followStatus?.isFollowing) {
        await apiRequest(`/api/user/unfollow/${userId}`, {
          method: 'DELETE',
        });
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${userProfile?.username || 'this user'}.`,
        });
      } else {
        await apiRequest(`/api/user/follow/${userId}`, {
          method: 'POST',
        });
        toast({
          title: "Following",
          description: `You are now following ${userProfile?.username || 'this user'}.`,
        });
      }
      
      // Invalidate the follow status cache to refresh the button
      queryClient.invalidateQueries({ queryKey: ['/api/user/follow-status', userId] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (profileLoading) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          <div className="max-w-4xl mx-auto p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          <div className="max-w-4xl mx-auto p-4">
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                User Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The user profile you're looking for doesn't exist.
              </p>
              <Button onClick={goBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Back Button */}
          <Button onClick={goBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex flex-col items-center sm:items-start">
                  <UserAvatar 
                    user={{
                      profileImageUrl: userProfile.profileImageUrl,
                      avatar: userProfile.avatar,
                      username: userProfile.username,
                      firstName: userProfile.firstName
                    }}
                    size="lg"
                  />
                  
                  {isAuthenticated && currentUser?.id !== userProfile.id && (
                    <Button
                      onClick={handleFollowToggle}
                      variant={followStatus?.isFollowing ? "secondary" : "default"}
                      className="mt-4 w-full sm:w-auto"
                    >
                      {followStatus?.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {userProfile.username || `${userProfile.firstName} ${userProfile.lastName}`.trim()}
                  </h1>
                  
                  {userProfile.bio && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {userProfile.bio}
                    </p>
                  )}

                  {/* Social Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4">
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {userProfile.followers}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {userProfile.following}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">following</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Joined {new Date(userProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid - Only show stats that are public */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Picks - only show if user made it public */}
            {userProfile.privacySettings?.totalPicksPublic && userProfile.stats?.totalPicks !== undefined && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.totalPicks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Picks</p>
                </CardContent>
              </Card>
            )}

            {/* Pending Picks - only show if user made it public */}
            {userProfile.privacySettings?.pendingPicksPublic && userProfile.stats?.pendingPicks !== undefined && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.pendingPicks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                </CardContent>
              </Card>
            )}

            {/* Win Streak - only show if user made it public */}
            {userProfile.privacySettings?.winStreakPublic && userProfile.stats?.winStreak !== undefined && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.winStreak}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Win Streak</p>
                </CardContent>
              </Card>
            )}

            {/* Record (Win Rate) - only show if user made it public */}
            {userProfile.privacySettings?.winRatePublic && userProfile.stats?.record !== undefined && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.record}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Record</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Public Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : publicFeed.length > 0 ? (
                <div className="space-y-4">
                  {publicFeed.map((item: PublicFeedItem) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.pick.selection}
                        </span>
                        <Badge variant={item.status === 'win' ? 'default' : item.status === 'loss' ? 'destructive' : 'secondary'}>
                          {item.status || 'pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.pick.game} • {item.pick.market}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No public activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </div>
  );
}