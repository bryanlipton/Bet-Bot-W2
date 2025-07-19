import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  Lock,
  ArrowLeft,
  UserCheck
} from "lucide-react";

interface UserProfileData {
  id: string;
  username: string;
  profileImageUrl?: string;
  bio?: string;
  followers: number;
  following: number;
  createdAt: string;
  stats: {
    totalPicks?: number;
    pendingPicks?: number;
    winRate?: number;
    winStreak?: number;
  };
}

interface PublicFeedItem {
  id: string;
  type: 'pick' | 'win' | 'loss';
  pick: any;
  timestamp: string;
  result?: 'win' | 'loss' | 'push';
}

interface UserProfilePageProps {
  userId: string;
}

export default function UserProfilePage({ userId }: UserProfilePageProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user: currentUser } = useAuth();
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

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['/api/profile', userId],
    enabled: !!userId,
  });

  // Fetch user's public picks feed
  const { data: publicFeed, isLoading: feedLoading } = useQuery({
    queryKey: ['/api/public-feed', userId],
    enabled: !!userId && !!profileData, // Only fetch if profile exists
  });

  // Check if current user is following this user
  const { data: followStatus } = useQuery({
    queryKey: ['/api/user/follow-status', userId],
    enabled: !!userId && !!currentUser,
  });

  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = isFollowing ? '/api/user/unfollow' : '/api/user/follow';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: `You are now ${isFollowing ? 'not following' : 'following'} ${profileData?.username}`,
        });
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderAvatar = (avatarString?: string, username?: string) => {
    if (avatarString?.includes('|')) {
      // New format: emoji|background
      const [emoji, backgroundClass] = avatarString.split('|');
      return (
        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-gray-200 dark:border-gray-600 ${backgroundClass}`}>
          <span className="text-4xl">{emoji}</span>
        </div>
      );
    } else {
      return (
        <Avatar className="w-24 h-24">
          <AvatarImage src={avatarString} alt={username} />
          <AvatarFallback className="bg-blue-600 text-white text-2xl">
            {username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This user's profile doesn't exist or is private.
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.sub === userId;

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {renderAvatar(profileData.profileImageUrl, profileData.username)}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {profileData.username}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(profileData.createdAt)}
                  </p>
                </div>

                {profileData.bio && (
                  <p className="text-gray-700 dark:text-gray-300">
                    {profileData.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{profileData.followers}</span> Followers
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <UserCheck className="w-4 h-4" />
                    <span className="font-medium">{profileData.following}</span> Following
                  </div>
                </div>

                {/* Follow/Unfollow Button */}
                {!isOwnProfile && currentUser && (
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? "outline" : "default"}
                    className={isFollowing ? 
                      "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" : 
                      "bg-blue-600 hover:bg-blue-700 text-white"
                    }
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
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
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {profileData.stats.totalPicks !== null && (
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.stats.totalPicks || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Picks</p>
              </CardContent>
            </Card>
          )}

          {profileData.stats.pendingPicks !== null && (
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.stats.pendingPicks || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              </CardContent>
            </Card>
          )}

          {profileData.stats.winRate !== null && (
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.stats.winRate?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
              </CardContent>
            </Card>
          )}

          {profileData.stats.winStreak !== null && (
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.stats.winStreak || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Streak</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Public Picks Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Public Picks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : publicFeed && publicFeed.length > 0 ? (
              <div className="space-y-4">
                {publicFeed.map((item: PublicFeedItem) => (
                  <div key={item.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={
                        item.result === 'win' ? 'default' : 
                        item.result === 'loss' ? 'destructive' : 
                        'secondary'
                      }>
                        {item.result === 'win' ? 'Won' : 
                         item.result === 'loss' ? 'Lost' : 
                         'Pending'}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.pick.selection}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.pick.game}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {isOwnProfile ? 
                  "You haven't made any public picks yet." :
                  "This user hasn't made any public picks yet."
                }
              </p>
            )}
          </CardContent>
        </Card>

        {/* Private Profile Message */}
        {Object.values(profileData.stats).every(stat => stat === null) && !isOwnProfile && (
          <Card>
            <CardContent className="p-8 text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Private Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This user has made their stats private.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}