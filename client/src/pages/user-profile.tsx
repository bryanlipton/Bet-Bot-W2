import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, UserMinus, Calendar, TrendingUp, Award, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ActionStyleHeader } from '@/components/ActionStyleHeader';
import Footer from '@/components/Footer';

interface UserProfilePageProps {
  userId: string;
}

interface UserProfileData {
  id: string;
  username: string;
  profileImageUrl?: string;
  bio?: string;
  followers: number;
  following: number;
  createdAt: string;
  stats: {
    totalPicks: number | null;
    pendingPicks: number | null;
    winRate: number | null;
    winStreak: number | null;
  };
}

export default function UserProfilePage({ userId }: UserProfilePageProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { toast } = useToast();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fetch user profile data
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: [`/api/user/profile/${userId}`],
    retry: false,
  });

  const handleFollowToggle = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch('/api/users/follow', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: "Success",
          description: isFollowing ? "Unfollowed user" : "Followed user",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update follow status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This user profile is either private or doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {(() => {
                  const avatarString = userProfile.profileImageUrl;
                  
                  if (avatarString?.includes('|')) {
                    // New format: emoji|background
                    const [emoji, backgroundClass] = avatarString.split('|');
                    return (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 ${backgroundClass}`}>
                        <span className="text-4xl">{emoji}</span>
                      </div>
                    );
                  } else {
                    return (
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={avatarString} alt={userProfile.username} />
                        <AvatarFallback className="bg-blue-600 text-white text-xl">
                          {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    );
                  }
                })()}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userProfile.username}
                    </h1>
                    {userProfile.bio && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {userProfile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {formatDate(userProfile.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? "outline" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>

                {/* Social Stats */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userProfile.followers}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userProfile.following}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Following
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {(userProfile.stats.totalPicks !== null || 
          userProfile.stats.winRate !== null || 
          userProfile.stats.winStreak !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userProfile.stats.totalPicks !== null && (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.totalPicks}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Picks
                  </div>
                </CardContent>
              </Card>
            )}

            {userProfile.stats.winRate !== null && (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Win Rate
                  </div>
                </CardContent>
              </Card>
            )}

            {userProfile.stats.winStreak !== null && (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.winStreak}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Win Streak
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Public Feed Placeholder */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Public betting activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}