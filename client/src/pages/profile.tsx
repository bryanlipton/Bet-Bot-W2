import { useState, useEffect, useRef } from "react";
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
import ActionStyleHeader from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";

import UserAvatar from "@/components/UserAvatar";
import { getAvatarUrl, getRandomAnimalAvatar, isEmojiAvatar, getAnimalAvatarById, getAnimalAvatarByEmoji } from '@/data/avatars';
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';
import { apiRequest } from "@/lib/queryClient";
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
  Edit,
  Eye,
  EyeOff,

  Flame,
  Lock,
  Search,
  UserCheck,
  X,
  Trash2,
  Camera
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  avatar?: string; // Emoji avatar
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
}

interface PublicFeedItem {
  id: string;
  type: 'pick' | 'win' | 'loss';
  pick: Pick;
  timestamp: string;
  result?: 'win' | 'loss' | 'push';
  status?: 'win' | 'loss' | 'push' | 'pending';
}

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [publicFeed, setPublicFeed] = useState<PublicFeedItem[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [isFriendSearchOpen, setIsFriendSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    profileImage: '',
    avatar: ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    totalPicksPublic: true,
    pendingPicksPublic: true,
    winRatePublic: true,
    winStreakPublic: true
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

  // Fetch user data and authentication status
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const isAuthenticated = !!user;

  // Fetch followers list
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/followers`],
    enabled: !!user?.id && showFollowersModal,
    retry: false,
  });

  // Fetch following list
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/following`],
    enabled: !!user?.id && showFollowingModal,
    retry: false,
  });

  // Fetch following list for search badge check
  const { data: userFollowingList = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/following`],
    enabled: !!user?.id,
    retry: false,
  });

  // Fetch user pick statistics from API
  const { data: pickStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/picks/stats'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch user picks from API with no caching to ensure fresh data
  const { data: userPicks = [], isLoading: picksLoading } = useQuery({
    queryKey: ['/api/user/picks'],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the results (updated from cacheTime)
  });

  // Force cache invalidation on component mount to ensure fresh data
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
      queryClient.refetchQueries({ queryKey: ['/api/user/picks'] });
    }
  }, [isAuthenticated, queryClient]);

  // Load picks data
  useEffect(() => {
    if (Array.isArray(userPicks) && userPicks.length > 0) {
      setPicks(userPicks as Pick[]);
      
      // Generate public feed from API picks with proper data mapping
      const feedItems: PublicFeedItem[] = (userPicks as any[])
        .filter((pick: any) => {
          // FIXED PRIVACY LOGIC:
          // User should ALWAYS see their own bets (both public and private)
          // This is the user's own profile, so show ALL bets regardless of privacy toggle
          // The privacy toggle only affects what followers can see
          return true; // Show all bets to the profile owner
        })
        .sort((a: any, b: any) => new Date(b.createdAt || b.gameDate || b.timestamp).getTime() - new Date(a.createdAt || a.gameDate || a.timestamp).getTime())
        .slice(0, 20) // Show latest 20 items
        .map((pick: any) => ({
          id: pick.id?.toString() || `pick_${Date.now()}_${Math.random()}`,
          type: 'pick' as const,
          pick: {
            ...pick,
            // Map database fields to expected format
            timestamp: pick.createdAt || pick.gameDate,
            isPublic: pick.isPublic,
            betInfo: {
              units: pick.units || 1,
              odds: pick.odds || 0,
              bookmaker: pick.bookmakerDisplayName || pick.bookmaker || 'Unknown',
              market: pick.market || 'moneyline',
              selection: pick.selection || pick.team || 'Unknown'
            }
          },
          timestamp: pick.createdAt || pick.gameDate,
          result: pick.status === 'win' ? 'win' : pick.status === 'loss' ? 'loss' : undefined,
          status: pick.status // Add status to the feed item directly
        }));
      
      setPublicFeed(feedItems);
    }
    
    // Don't mix localStorage picks with API picks to avoid confusion
    // The API should be the single source of truth for authenticated users
    const addPicksToFeed = () => {
      // Skip localStorage picks for authenticated users - use API data only
      if (isAuthenticated) {
        return;
      }
      
      const localPicks = pickStorage.getPicks();
      const pendingFeedItems = localPicks
        .filter(pick => pick.status === 'pending')
        .map(pick => ({
          id: pick.id,
          type: 'pick' as const,
          pick: {
            ...pick,
            betInfo: {
              ...pick.betInfo,
              bookmaker: pick.bookmaker?.displayName || 'Unknown'
            }
          },
          timestamp: pick.timestamp,
          result: undefined // Pending picks have no result yet
        }));

      // Add your real settled picks from yesterday
      const realSettledPicks = [
        {
          id: 'blue_jays_ml',
          type: 'pick' as const,
          pick: {
            gameInfo: { homeTeam: 'Toronto Blue Jays', awayTeam: 'San Francisco Giants', gameTime: '2025-07-18T19:00:00Z', sport: 'baseball_mlb' },
            betInfo: { selection: 'Toronto Blue Jays', market: 'moneyline', odds: 130, units: 1.5, line: null, bookmaker: 'DraftKings' },
          },
          timestamp: '2025-07-18T12:00:00Z',
          result: 'win'
        },
        {
          id: 'orioles_mets_parlay',
          type: 'pick' as const,
          pick: {
            gameInfo: { homeTeam: 'Parlay', awayTeam: 'Baltimore Orioles + New York Mets', gameTime: '2025-07-18T19:00:00Z', sport: 'baseball_mlb' },
            betInfo: { selection: '2-Leg Parlay', market: 'parlay', odds: 280, units: 1.0, line: null, bookmaker: 'FanDuel' },
          },
          timestamp: '2025-07-18T11:30:00Z',
          result: 'loss'
        }
      ];

      // Combine pending picks first, then real settled picks
      const combinedFeedItems = [...pendingFeedItems, ...realSettledPicks];
      setPublicFeed(combinedFeedItems);
    };
    
    // Always load localStorage picks and add historical picks
    const loadLocalStoragePicks = async () => {
      try {
        const localPicks = pickStorage.getPicks();
        const mergedPicks = [...picks];
        localPicks.forEach(localPick => {
          if (!mergedPicks.find(p => p.id === localPick.id)) {
            mergedPicks.push(localPick);
          }
        });
        setPicks(mergedPicks);
      } catch (error) {
        console.error('Error loading localStorage picks:', error);
        const localPicks = pickStorage.getPicks();
        setPicks(localPicks);
      }
      
      // Add picks to public feed
      addPicksToFeed();
    };

    loadLocalStoragePicks();
  }, [userPicks]);

  // Calculate stats based on actual displayed picks in the public feed
  const visiblePicks = publicFeed.map(item => item.pick);
  const totalPicks = visiblePicks.length;
  const pendingPicksCount = visiblePicks.filter(pick => pick.status === 'pending').length;
  const wonPicks = visiblePicks.filter(pick => pick.status === 'win' || pick.status === 'won').length;
  const lostPicks = visiblePicks.filter(pick => pick.status === 'loss' || pick.status === 'lost').length;
  const pushPicks = visiblePicks.filter(pick => pick.status === 'push').length;
  const settledPicks = wonPicks + lostPicks + pushPicks;
  const winRate = settledPicks > 0 ? (wonPicks / settledPicks) * 100 : 0;
  
  // Calculate win streak from most recent settled picks
  const sortedSettledPicks = visiblePicks
    .filter(pick => pick.status === 'win' || pick.status === 'won' || pick.status === 'loss' || pick.status === 'lost')
    .sort((a, b) => new Date(b.timestamp || b.createdAt || '').getTime() - new Date(a.timestamp || a.createdAt || '').getTime());
  
  let winStreak = 0;
  for (const pick of sortedSettledPicks) {
    if (pick.status === 'win' || pick.status === 'won') {
      winStreak++;
    } else {
      break; // Stop at first loss
    }
  }
  
  // Create record string (W-L-P format)
  const record = `${wonPicks}-${lostPicks}${pushPicks > 0 ? `-${pushPicks}` : ''}`;
  
  const profileStats = {
    totalPicks,
    pendingPicks: pendingPicksCount,
    wonPicks,
    lostPicks,
    pushPicks,
    winRate,
    winStreak,
    record
  };

  // Calculate current win streak
  function calculateWinStreak(picks: any[]): number {
    const sortedPicks = picks
      .filter(p => p.status === 'win' || p.status === 'loss' || p.status === 'won' || p.status === 'lost')
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp).getTime();
        const timeB = new Date(b.createdAt || b.timestamp).getTime();
        return timeB - timeA;
      });
    
    let streak = 0;
    for (const pick of sortedPicks) {
      if (pick.status === 'won' || pick.status === 'win') {
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
    profileImage: user?.profileImageUrl, // Only use actual profile image URL
    avatar: user?.avatar || '🐱', // Use the dedicated avatar field for emoji avatars
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
    winStreakPublic: user?.winStreakPublic ?? true
  };

  // Update profile mutation
  // Search for users
  const handleSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced username validation
  const usernameCheckTimeout = useRef<NodeJS.Timeout>();
  
  const handleUsernameChange = (username: string) => {
    setUsernameError('');
    
    // Clear existing timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    // Basic validation first
    if (!username.trim()) {
      setUsernameError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }
    
    if (username.length > 30) {
      setUsernameError('Username must be less than 30 characters');
      return;
    }
    
    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    // Skip check if username hasn't changed
    if (username === user?.username) {
      return;
    }
    
    // Debounced API call to check availability
    usernameCheckTimeout.current = setTimeout(async () => {
    
      try {
        const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (!result.available) {
            setUsernameError('Username is already taken');
          }
        }
      } catch (error) {
        console.error('Username check error:', error);
      }
    }, 500); // 500ms debounce
  };

  // Follow a user with real-time updates
  const followUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('/api/users/follow', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return response;
    },
    onSuccess: (data, userId) => {
      // Invalidate and refetch user data to update follower/following counts
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User followed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user.",
        variant: "destructive",
      });
    }
  });

  const handleFollowUser = (userId: string) => {
    followUserMutation.mutate(userId);
  };

  // Unfollow a user with real-time updates
  const unfollowUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('/api/users/follow', {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });
      return response;
    },
    onSuccess: (data, userId) => {
      // Invalidate and refetch user data to update follower/following counts
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Also invalidate followers/following lists if they're open
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/followers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/following`] });
      
      toast({
        title: "Success",
        description: "User unfollowed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user.",
        variant: "destructive",
      });
    }
  });

  const handleUnfollowUser = (userId: string) => {
    unfollowUserMutation.mutate(userId);
  };

  // Update pick visibility mutation (single toggle for public/private)
  const updatePickVisibilityMutation = useMutation({
    mutationFn: async ({ pickId, isPublic }: { pickId: string; isPublic: boolean }) => {
      console.log(`Updating pick ${pickId} visibility:`, { isPublic });
      
      const response = await fetch(`/api/user/picks/${pickId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to update visibility');
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      return result;
    },
    onMutate: async ({ pickId, isPublic }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/user/picks'] });

      // Snapshot the previous value
      const previousPicks = queryClient.getQueryData(['/api/user/picks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['/api/user/picks'], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => {
          if (item.id === pickId) {
            return {
              ...item,
              isPublic
            };
          }
          return item;
        });
      });

      // Return a context object with the snapshotted value
      return { previousPicks };
    },
    onSuccess: () => {
      // Silent success - no toast needed for simple toggle actions
      // Force immediate refetch to ensure UI stays in sync
      queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
      queryClient.refetchQueries({ queryKey: ['/api/user/picks'] });
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPicks) {
        queryClient.setQueryData(['/api/user/picks'], context.previousPicks);
      }
      console.error('Pick visibility update error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to update pick visibility.",
        variant: "destructive",
      });
      // Only invalidate on error to refresh from server
      queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      console.log("Sending profile update:", profileData);
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Profile update successful:", data);
      // Force immediate cache invalidation and refetch for all user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      
      // Also clear any cached user profile data
      queryClient.clear();
      
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated", 
        description: "Your avatar and profile have been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete pick mutation
  const deletePickMutation = useMutation({
    mutationFn: async (pickId: string) => {
      const response = await fetch(`/api/user/picks/${pickId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete pick');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh both picks and stats
      queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/picks/stats'] });
      toast({
        title: "Pick Deleted",
        description: "Your pick has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error("Delete pick error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete pick. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePick = async (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      deletePickMutation.mutate(pickId);
    }
  };

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || user.firstName || user.email?.split('@')[0] || '',
        bio: user.bio || '',
        profileImage: user.profileImageUrl || getRandomAnimalAvatar(),
        avatar: user.avatar || '🐱'
      });
      setPrivacySettings({
        totalPicksPublic: user.totalPicksPublic ?? true,
        pendingPicksPublic: user.pendingPicksPublic ?? true,
        winRatePublic: user.winRatePublic ?? true,
        winStreakPublic: user.winStreakPublic ?? true
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      username: editForm.username,
      bio: editForm.bio,
      profileImageUrl: editForm.profileImage,
      avatar: editForm.avatar,
      ...privacySettings
    });
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

  const getResultBadge = (status: string | undefined) => {
    if (status === 'win') return <Badge className="bg-green-600 text-white">Won</Badge>;
    if (status === 'loss') return <Badge className="bg-red-600 text-white">Lost</Badge>;
    if (status === 'push') return <Badge className="bg-gray-600 text-white">Push</Badge>;
    return <Badge className="bg-blue-600 text-white">Pending</Badge>;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show locked state for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Card className="bg-white dark:bg-gray-800 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-3">
                  <User className="w-16 h-16 text-gray-400 opacity-50" />
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    Profile Access Locked
                  </h2>
                  <p className="text-gray-500 dark:text-gray-500 max-w-md">
                    You need to be logged in to view and manage your profile. Log in to access your betting history, statistics, and preferences.
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Log in to View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          
          {/* Search for Friends Button */}
          <Dialog open={isFriendSearchOpen} onOpenChange={setIsFriendSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                    searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          {/* User Avatar */}
                          <UserAvatar 
                            user={{
                              username: user.username,
                              firstName: user.firstName
                            }}
                            size="sm"
                          />
                          
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.username || `${user.firstName} ${user.lastName}`.trim()}
                            </p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Following Badge */}
                          {userFollowingList.some((followedUser: any) => followedUser.id === user.id) && (
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              Following
                            </Badge>
                          )}
                          
                          {/* View Profile Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(`/user/${user.id}`, '_blank');
                            }}
                            className="flex items-center gap-1"
                          >
                            <User className="w-3 h-3" />
                            View Profile
                          </Button>
                          
                          {/* Follow Button - hide if already following */}
                          {!userFollowingList.some((followedUser: any) => followedUser.id === user.id) && (
                            <Button
                              size="sm"
                              onClick={() => handleFollowUser(user.id)}
                              className="flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              Follow
                            </Button>
                          )}
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

        {/* Profile Info Card - Instagram/Twitter Style */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Profile Picture with Edit Button */}
              <div className="relative flex-shrink-0">
                <UserAvatar 
                  user={{
                    profileImageUrl: user?.profileImageUrl?.startsWith('http') ? user.profileImageUrl : null,
                    avatar: user?.avatar || '🐱',
                    username: userProfile.username
                  }}
                  size="xl"
                  className="border-2 border-gray-200 dark:border-gray-600"
                />
                {isEditingProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => setIsImagePickerOpen(true)}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {userProfile.username}
                  </h2>
                  
                  {/* Edit Profile Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit Profile</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      </DialogTrigger>
                      
                    </Dialog>
                  </div>

                  {/* Edit Profile Dialog - Separate from buttons */}
                  <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Profile Picture */}
                        <div className="space-y-2">
                          <Label>Profile Picture</Label>
                          <div className="flex items-center gap-4">
                            <UserAvatar 
                              user={{
                                profileImageUrl: editForm.profileImage,
                                avatar: editForm.avatar,
                                username: editForm.username
                              }}
                              size="lg"
                              className="border-2 border-gray-200 dark:border-gray-600"
                            />
                            <div className="flex items-center justify-end w-full">
                              {/* Save Button - Aligned with right edge of inputs below */}
                              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending || usernameError !== ''}>
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Username */}
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => {
                              setEditForm({...editForm, username: e.target.value});
                              handleUsernameChange(e.target.value);
                            }}
                            placeholder="Enter username"
                            className={usernameError ? 'border-red-500' : ''}
                          />
                          {usernameError && (
                            <p className="text-sm text-red-500">{usernameError}</p>
                          )}
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
                            <Label htmlFor="totalPicksPublic">Do you want to share total picks on profile</Label>
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
                            <Label htmlFor="pendingPicksPublic">Do you want to share the number of pending picks on profile</Label>
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
                            <Label htmlFor="winRatePublic">Do you want to show record on profile</Label>
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
                            <Label htmlFor="winStreakPublic">Do you want to show win streak on profile</Label>
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
                          

                          

                        </div>
                        

                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Bio - Only show if exists */}
                {userProfile.bio && (
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 break-words">
                    {userProfile.bio}
                  </p>
                )}

                {/* Social Stats - Mobile friendly layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowFollowersModal(true)}
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {userProfile.followers}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">followers</span>
                    </button>
                    <button 
                      onClick={() => setShowFollowingModal(true)}
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {userProfile.following}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">following</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Joined {formatDate(userProfile.joinDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards with Privacy Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Picks - Always visible to user */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.totalPicks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    Total Picks
                    {!userProfile.totalPicksPublic && <EyeOff className="w-3 h-3 text-gray-500" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Picks - Always visible to user */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.pendingPicks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    Pending
                    {!userProfile.pendingPicksPublic && <EyeOff className="w-3 h-3 text-gray-500" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win Streak */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.winStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Win Streak
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Record */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileStats.record}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Record
                  </div>
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
              Public Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {publicFeed.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No picks yet.</p>
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
                            <div className="flex-1">
                              {/* Check if it's a parlay */}
                              {item.pick.betInfo?.market === 'parlay' && item.pick.betInfo?.parlayLegs && item.pick.betInfo.parlayLegs.length > 0 ? (
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                                    {item.pick.betInfo.parlayLegs.length}-Leg Parlay @ Multiple Games
                                  </div>
                                  <div className="space-y-2 mb-3">
                                    {item.pick.betInfo.parlayLegs.map((leg, index) => (
                                      <div key={index} className="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="font-medium text-gray-900 dark:text-white">{leg.game}</div>
                                        <div className="text-blue-600 dark:text-blue-400">
                                          {leg.selection}
                                          {leg.market === 'spread' && leg.line ? ` ${leg.line > 0 ? '+' : ''}${leg.line}` : ''}
                                          {leg.market === 'total' && leg.line ? ` ${leg.line}` : ''}
                                          {leg.market === 'moneyline' ? ' ML' : ''}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.pick.betInfo?.odds && `(${formatOdds(item.pick.betInfo.odds)})`}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {/* Show parlay team names if it's a parlay, otherwise show single game matchup */}
                                    {item.pick.parlayLegs && item.pick.parlayLegs.length > 0 ? (
                                      `${item.pick.parlayLegs.length}-Leg Parlay: ${item.pick.parlayLegs.map((leg: any) => leg.team).join(' + ')}`
                                    ) : (
                                      `${item.pick.awayTeam || item.pick.gameInfo?.awayTeam || 'Away Team'} @ ${item.pick.homeTeam || item.pick.gameInfo?.homeTeam || 'Home Team'}`
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {/* Show parlay details if it's a parlay */}
                                    {item.pick.parlayLegs && item.pick.parlayLegs.length > 0 ? (
                                      item.pick.parlayLegs.map((leg: any, index: number) => (
                                        <div key={index} className="text-xs">
                                          {leg.team} {leg.market === 'moneyline' ? 'ML' : leg.market}
                                        </div>
                                      ))
                                    ) : (
                                      <>
                                        {item.pick.selection || item.pick.betInfo?.selection}
                                        {item.pick.line && ` ${item.pick.line}`}
                                        {item.pick.betInfo?.line && ` ${item.pick.betInfo.line}`}
                                      </>
                                    )}
                                    {(item.pick.odds || item.pick.betInfo?.odds) && ` (${formatOdds(item.pick.odds || item.pick.betInfo.odds)})`}
                                  </div>
                                </div>
                              )}
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {item.pick.units || item.pick.betInfo?.units || 1} unit{(item.pick.units || item.pick.betInfo?.units || 1) !== 1 ? 's' : ''} • Game Time: {item.pick.gameDate ? new Date(item.pick.gameDate).toLocaleDateString() : 'TBD'} • Bet Placed: {formatTime(item.pick.createdAt)}
                              </div>
                              
                              {/* Single bet visibility control and delete button */}
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`public-${item.id}`}
                                    checked={item.pick.isPublic ?? true}
                                    onCheckedChange={(checked) => {
                                      // Single toggle controls both profile and feed visibility
                                      updatePickVisibilityMutation.mutate({
                                        pickId: item.id,
                                        isPublic: checked
                                      });
                                    }}
                                    disabled={updatePickVisibilityMutation.isPending}
                                  />
                                  <Label htmlFor={`public-${item.id}`} className="text-xs text-gray-600 dark:text-gray-400">
                                    Make Bet Public
                                  </Label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deletePick(item.id)}
                                  disabled={deletePickMutation.isPending}
                                  className="text-red-600 hover:text-red-700 p-1 h-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              {getResultBadge(item.status || item.pick.status)}
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


      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers ({userProfile.followers})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {followersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : followers.length > 0 ? (
              followers.map((follower: any) => (
                <div key={follower.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={{
                        profileImageUrl: follower.profileImageUrl,
                        avatar: follower.avatar,
                        username: follower.username,
                        firstName: follower.firstName
                      }}
                      size="sm"
                    />
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {follower.username || `${follower.firstName} ${follower.lastName}`.trim()}
                      </p>
                      {follower.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                          {follower.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(`/user/${follower.id}`, '_blank');
                      }}
                      className="flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      View Profile
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No followers yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following ({userProfile.following})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {followingLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : following.length > 0 ? (
              following.map((followedUser: any) => (
                <div key={followedUser.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={{
                        profileImageUrl: followedUser.profileImageUrl,
                        avatar: followedUser.avatar,
                        username: followedUser.username,
                        firstName: followedUser.firstName
                      }}
                      size="sm"
                    />
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {followedUser.username || `${followedUser.firstName} ${followedUser.lastName}`.trim()}
                      </p>
                      {followedUser.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                          {followedUser.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(`/user/${followedUser.id}`, '_blank');
                      }}
                      className="flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnfollowUser(followedUser.id)}
                      disabled={unfollowUserMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <UserMinus className="w-3 h-3" />
                      Unfollow
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}