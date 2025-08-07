import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, TrendingUp, Target, Eye, Edit, Trash2, Plus, ExternalLink, Bookmark, BookmarkCheck, Filter, Search, RefreshCw, Tag, Globe, Lock } from "lucide-react";
import Footer from "@/components/Footer";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";

interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  created_date: string;
  last_login: string;
  total_picks: number;
  winning_percentage: number;
  total_profit: number;
  favorite_sports: string[];
  betting_style: string;
  experience_level: string;
  is_verified: boolean;
  is_premium: boolean;
}

interface ProfileStats {
  total_users: number;
  active_users: number;
  premium_users: number;
  avg_winning_percentage: number;
  top_performer: Profile;
  most_active_user: Profile;
}

export default function ProfilesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'winrate' | 'profit' | 'picks'>('winrate');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'premium'>('all');
  
  // Profile form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    full_name: '',
    bio: '',
    favorite_sports: '',
    betting_style: '',
    experience_level: ''
  });

  const queryClient = useQueryClient();

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['profiles', searchTerm, sortBy, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('sort', sortBy);
      if (filterType !== 'all') params.append('filter', filterType);
      
      const response = await apiRequest(`/api/profiles?${params.toString()}`);
      return response.profiles || [];
    }
  });

  // Fetch profile stats
  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/profiles/stats');
      return response.stats;
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof profileForm }) => {
      return apiRequest(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          favorite_sports: data.favorite_sports.split(',').map(sport => sport.trim()).filter(Boolean)
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      setIsEditModalOpen(false);
      setEditingProfile(null);
    }
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest(`/api/profiles/${profileId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    }
  });

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileForm({
      username: profile.username,
      email: profile.email,
      full_name: profile.full_name,
      bio: profile.bio,
      favorite_sports: profile.favorite_sports.join(', '),
      betting_style: profile.betting_style,
      experience_level: profile.experience_level
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = () => {
    if (editingProfile) {
      updateProfileMutation.mutate({ id: editingProfile.id, data: profileForm });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return a.username.localeCompare(b.username);
      case 'winrate':
        return b.winning_percentage - a.winning_percentage;
      case 'profit':
        return b.total_profit - a.total_profit;
      case 'picks':
        return b.total_picks - a.total_picks;
      default:
        return 0;
    }
  });

  if (profilesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="animate-spin text-primary mr-2" size={24} />
            <span className="text-gray-600 dark:text-gray-400">Loading profiles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (profilesError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertDescription>
              Failed to load profiles. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profiles</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and view betting community profiles
            </p>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2">
            <Plus size={18} />
            <span>Create Profile</span>
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total_users?.toLocaleString() || 0}
                    </p>
                  </div>
                  <User className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.active_users?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Target className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Premium Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.premium_users?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Badge className="text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.avg_winning_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="text-blue-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="winrate">Sort by Win Rate</option>
              <option value="profit">Sort by Profit</option>
              <option value="picks">Sort by Total Picks</option>
              <option value="username">Sort by Username</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {profile.username}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {profile.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {profile.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                    {profile.is_premium && (
                      <Badge className="text-xs bg-yellow-500 text-white">
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile.total_picks}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Picks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile.winning_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Win Rate</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${
                        profile.total_profit >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${profile.total_profit.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Profit</p>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {profile.favorite_sports.slice(0, 3).map((sport, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {profile.favorite_sports.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.favorite_sports.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {new Date(profile.created_date).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProfile(profile)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProfileMutation.mutate(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedProfiles.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No profiles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No user profiles available.'}
            </p>
          </div>
        )}

        {/* Edit Profile Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? 'Edit Profile' : 'Create Profile'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  placeholder="Enter bio"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="favorite_sports">Favorite Sports (comma-separated)</Label>
                <Input
                  id="favorite_sports"
                  value={profileForm.favorite_sports}
                  onChange={(e) => setProfileForm({...profileForm, favorite_sports: e.target.value})}
                  placeholder="e.g. NFL, NBA, MLB"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="betting_style">Betting Style</Label>
                  <select
                    id="betting_style"
                    value={profileForm.betting_style}
                    onChange={(e) => setProfileForm({...profileForm, betting_style: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select style</option>
                    <option value="conservative">Conservative</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="balanced">Balanced</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <select
                    id="experience_level"
                    value={profileForm.experience_level}
                    onChange={(e) => setProfileForm({...profileForm, experience_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
      <MobileBottomNavigation />
    </div>
  );
}
