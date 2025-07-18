import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { ProfileImagePicker } from "@/components/ProfileImagePicker";
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Edit,
  Settings,
  Eye,
  EyeOff,
  Camera,
  Flame
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
  // Privacy settings
  totalPicksPublic: boolean;
  pendingPicksPublic: boolean;
  winRatePublic: boolean;
  winStreakPublic: boolean;
  profilePublic: boolean;
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    profileImage: ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    totalPicksPublic: true,
    pendingPicksPublic: true,
    winRatePublic: true,
    winStreakPublic: true,
    profilePublic: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Calculate profile stats including win streak
  const profileStats = {
    totalPicks: picks.length,
    pendingPicks: picks.filter(p => p.status === 'pending').length,
    wonPicks: picks.filter(p => p.status === 'won').length,
    lostPicks: picks.filter(p => p.status === 'lost').length,
    winRate: picks.length > 0 ? (picks.filter(p => p.status === 'won').length / picks.filter(p => p.status !== 'pending').length) * 100 : 0,
    totalUnits: picks.reduce((sum, pick) => sum + (pick.betInfo?.units || 1), 0),
    winStreak: calculateWinStreak(picks)
  };

  // Calculate current win streak
  function calculateWinStreak(picks: Pick[]): number {
    const sortedPicks = picks
      .filter(p => p.status === 'won' || p.status === 'lost')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    let streak = 0;
    for (const pick of sortedPicks) {
      if (pick.status === 'won') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Enhanced user profile data with privacy settings
  const userProfile: UserProfile = {
    id: user?.id || '1',
    username: user?.username || user?.firstName || user?.email?.split('@')[0] || 'BetBot User',
    email: user?.email || 'user@example.com', 
    profileImage: user?.profileImageUrl,
    followers: user?.followers || 0,
    following: user?.following || 0,
    totalPicks: profileStats.totalPicks,
    winRate: profileStats.winRate,
    totalUnits: profileStats.totalUnits,
    joinDate: user?.createdAt || '2024-01-15',
    bio: user?.bio || '',
    // Privacy settings
    totalPicksPublic: user?.totalPicksPublic ?? true,
    pendingPicksPublic: user?.pendingPicksPublic ?? true,
    winRatePublic: user?.winRatePublic ?? true,
    winStreakPublic: user?.winStreakPublic ?? true,
    profilePublic: user?.profilePublic ?? true
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || user.firstName || user.email?.split('@')[0] || '',
        bio: user.bio || '',
        profileImage: user.profileImageUrl || ''
      });
      setPrivacySettings({
        totalPicksPublic: user.totalPicksPublic ?? true,
        pendingPicksPublic: user.pendingPicksPublic ?? true,
        winRatePublic: user.winRatePublic ?? true,
        winStreakPublic: user.winStreakPublic ?? true,
        profilePublic: user.profilePublic ?? true
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      username: editForm.username,
      bio: editForm.bio,
      profileImageUrl: editForm.profileImage,
      ...privacySettings
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    setEditForm({...editForm, profileImage: imageUrl});
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

        {/* Profile Info Card - Instagram/Twitter Style */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Profile Picture with Edit Button */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userProfile.profileImage} alt={userProfile.username} />
                  <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditingProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.username}
                  </h2>
                  
                  {/* Edit Profile Button */}
                  <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Profile Picture */}
                        <div className="space-y-2">
                          <Label>Profile Picture</Label>
                          <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={editForm.profileImage} alt="Preview" />
                              <AvatarFallback className="text-lg font-bold bg-blue-600 text-white">
                                {editForm.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsImagePickerOpen(true)}
                              className="flex items-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              Choose Picture
                            </Button>
                          </div>
                        </div>
                        
                        {/* Username */}
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            placeholder="Enter username"
                          />
                        </div>
                        
                        {/* Bio */}
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            placeholder="Tell everyone about yourself..."
                            rows={3}
                          />
                        </div>
                        
                        {/* Privacy Settings */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Privacy Settings</h3>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="totalPicksPublic">Total Picks</Label>
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              <Switch
                                id="totalPicksPublic"
                                checked={privacySettings.totalPicksPublic}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings({...privacySettings, totalPicksPublic: checked})
                                }
                              />
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="pendingPicksPublic">Pending Picks</Label>
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              <Switch
                                id="pendingPicksPublic"
                                checked={privacySettings.pendingPicksPublic}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings({...privacySettings, pendingPicksPublic: checked})
                                }
                              />
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="winRatePublic">Win Rate</Label>
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              <Switch
                                id="winRatePublic"
                                checked={privacySettings.winRatePublic}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings({...privacySettings, winRatePublic: checked})
                                }
                              />
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="winStreakPublic">Win Streak</Label>
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              <Switch
                                id="winStreakPublic"
                                checked={privacySettings.winStreakPublic}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings({...privacySettings, winStreakPublic: checked})
                                }
                              />
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="profilePublic">Public Profile</Label>
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4" />
                              <Switch
                                id="profilePublic"
                                checked={privacySettings.profilePublic}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings({...privacySettings, profilePublic: checked})
                                }
                              />
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Save Button */}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Bio - Only show if exists */}
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

        {/* Stats Cards with Privacy Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Picks */}
          {userProfile.totalPicksPublic && (
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
          )}

          {/* Pending Picks */}
          {userProfile.pendingPicksPublic && (
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
          )}

          {/* Win Rate */}
          {userProfile.winRatePublic && (
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
          )}

          {/* Win Streak with Fire Emoji */}
          {userProfile.winStreakPublic && (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {profileStats.winStreak}
                      {profileStats.winStreak > 0 && <span>🔥</span>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Win Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Public Feed */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Public Profile
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
      
      {/* Profile Image Picker Modal */}
      <ProfileImagePicker
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        currentImage={editForm.profileImage}
        onImageSelect={handleImageSelect}
        username={editForm.username}
      />
    </div>
  );
}