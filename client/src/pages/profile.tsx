import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';
import { 
  User, 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Trophy,
  Clock,
  DollarSign
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  followers: number;
  following: number;
  totalPicks: number;
  winRate: number;
  totalUnits: number;
  joinDate: string;
  bio?: string;
}

interface PublicFeedItem {
  id: string;
  type: 'pick' | 'win' | 'loss';
  pick: Pick;
  timestamp: string;
  result?: 'win' | 'loss' | 'push';
}

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [publicFeed, setPublicFeed] = useState<PublicFeedItem[]>([]);

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

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Load picks data
  useEffect(() => {
    const loadPicks = async () => {
      try {
        const databasePicks = await databasePickStorage.getPicks();
        const localPicks = pickStorage.getPicks();
        
        // Combine and deduplicate picks
        const combinedPicks = [...databasePicks, ...localPicks];
        const uniquePicks = combinedPicks.filter((pick, index, self) => 
          index === self.findIndex(p => p.id === pick.id)
        );
        
        setPicks(uniquePicks);
        
        // Generate public feed from picks
        const feedItems: PublicFeedItem[] = uniquePicks
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20) // Show latest 20 items
          .map(pick => ({
            id: pick.id,
            type: 'pick' as const,
            pick,
            timestamp: pick.timestamp,
            result: pick.status === 'won' ? 'win' : pick.status === 'lost' ? 'loss' : undefined
          }));
        
        setPublicFeed(feedItems);
      } catch (error) {
        console.error('Error loading picks:', error);
        const localPicks = pickStorage.getPicks();
        setPicks(localPicks);
        
        const feedItems: PublicFeedItem[] = localPicks
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20)
          .map(pick => ({
            id: pick.id,
            type: 'pick' as const,
            pick,
            timestamp: pick.timestamp,
            result: pick.status === 'won' ? 'win' : pick.status === 'lost' ? 'loss' : undefined
          }));
        
        setPublicFeed(feedItems);
      }
    };

    loadPicks();
  }, []);

  // Calculate profile stats
  const profileStats = {
    totalPicks: picks.length,
    pendingPicks: picks.filter(p => p.status === 'pending').length,
    wonPicks: picks.filter(p => p.status === 'won').length,
    lostPicks: picks.filter(p => p.status === 'lost').length,
    winRate: picks.length > 0 ? (picks.filter(p => p.status === 'won').length / picks.filter(p => p.status !== 'pending').length) * 100 : 0,
    totalUnits: picks.reduce((sum, pick) => sum + (pick.betInfo?.units || 1), 0),
    profitLoss: picks.reduce((sum, pick) => {
      if (pick.status === 'won') return sum + (pick.betInfo?.units || 1);
      if (pick.status === 'lost') return sum - (pick.betInfo?.units || 1);
      return sum;
    }, 0)
  };

  // Mock user profile data (in production, this would come from API)
  const userProfile: UserProfile = {
    id: user?.id || '1',
    username: user?.username || user?.email?.split('@')[0] || 'BetBot User',
    email: user?.email || 'user@example.com',
    profileImage: user?.profileImage,
    followers: 127, // Mock data
    following: 89,  // Mock data
    totalPicks: profileStats.totalPicks,
    winRate: profileStats.winRate,
    totalUnits: profileStats.totalUnits,
    joinDate: '2024-01-15', // Mock data
    bio: 'Sharp sports bettor focused on MLB and NFL. Follow for winning picks! 📈🏆'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getResultBadge = (result: string | undefined) => {
    if (result === 'win') return <Badge className="bg-green-600 text-white">Won</Badge>;
    if (result === 'loss') return <Badge className="bg-red-600 text-white">Lost</Badge>;
    if (result === 'push') return <Badge className="bg-gray-600 text-white">Push</Badge>;
    return <Badge className="bg-blue-600 text-white">Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          </div>
        </div>

        {/* Profile Info Card */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <Avatar className="w-24 h-24">
                <AvatarImage src={userProfile.profileImage} alt={userProfile.username} />
                <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                  {userProfile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Profile Details */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.username}
                  </h2>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </Button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {userProfile.email}
                </p>
                
                {userProfile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {userProfile.bio}
                  </p>
                )}

                {/* Social Stats */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {userProfile.followers}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {userProfile.following}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">following</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Joined {formatDate(userProfile.joinDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.totalPicks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Picks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.pendingPicks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className={`w-8 h-8 ${profileStats.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                <div>
                  <div className={`text-2xl font-bold ${profileStats.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {profileStats.profitLoss >= 0 ? '+' : ''}{profileStats.profitLoss.toFixed(1)}u
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Profit/Loss</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Public Feed */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Public Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {publicFeed.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No picks yet. Start betting to build your feed!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {publicFeed.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-blue-600 text-white">
                              {userProfile.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {userProfile.username}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            placed a {item.pick.betInfo?.market} bet
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.pick.gameInfo?.awayTeam} @ {item.pick.gameInfo?.homeTeam}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.pick.betInfo?.selection}
                                {item.pick.betInfo?.line && ` ${item.pick.betInfo.line}`}
                                {item.pick.betInfo?.odds && ` (${formatOdds(item.pick.betInfo.odds)})`}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.pick.betInfo?.units || 1} units • {item.pick.bookmaker?.displayName}
                              </div>
                            </div>
                            <div className="text-right">
                              {getResultBadge(item.result)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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