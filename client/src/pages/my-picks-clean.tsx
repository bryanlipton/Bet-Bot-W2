import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ActionStyleHeader from '@/components/ActionStyleHeader';
import { Target } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(true);
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

  // Use database approach with proper error handling
  const { data: userPicks, isLoading, error } = useQuery({
    queryKey: ['/api/user/picks'],
    enabled: isAuthenticated,
    retry: false,
  });

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="text-center">Loading your picks...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="text-center text-red-500">Error loading picks</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const picks = Array.isArray(userPicks) ? userPicks : [];

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

  const formatBet = (pick: any) => {
    if (!pick || !pick.betInfo) return 'Unknown bet';
    
    const { market, selection, odds } = pick.betInfo;
    const oddsText = odds ? (odds > 0 ? `+${odds}` : `${odds}`) : '';
    
    if (market === 'moneyline') {
      return `${selection} ML ${oddsText}`;
    }
    return `${selection} ${oddsText}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-6 py-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            My Picks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your betting history and performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {picks.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Picks
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {picks.filter((p: any) => p?.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {picks.filter((p: any) => p?.status === 'won' || p?.status === 'win').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Won
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {picks.filter((p: any) => p?.status === 'lost' || p?.status === 'loss').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Lost
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Picks List */}
        <div className="space-y-4">
          {picks.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Picks Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start making picks to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            picks.map((pick: any, index: number) => (
              <Card key={pick.id || index} className="bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatBet(pick)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {pick.gameInfo || 'Game info not available'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pick.betInfo?.units || 1} units
                        </div>
                      </div>
                      {getStatusBadge(pick.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}