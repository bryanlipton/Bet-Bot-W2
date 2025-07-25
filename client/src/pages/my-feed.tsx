import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ActionStyleHeader from '@/components/ActionStyleHeader';
import MobileBottomNavigation from '@/components/MobileBottomNavigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Users, Clock, Sparkles } from 'lucide-react';

export default function MyFeed() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <MobileBottomNavigation darkMode={darkMode} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Feed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              See picks and activity from people you follow
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Log in to view your feed
            </Button>
          </div>
        </div>
        <MobileBottomNavigation darkMode={darkMode} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Coming Soon Content */}
        <div className="text-center py-16">
          <div className="relative mb-8">
            <Sparkles className="w-20 h-20 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
            <Clock className="w-8 h-8 absolute top-0 right-1/2 transform translate-x-8 text-orange-500" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Feed
          </h1>
          
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              Coming Soon!
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              We're building an amazing social feed where you can follow other bettors, 
              see their picks, and share your winning strategies. This feature will be 
              available soon!
            </p>
            
            <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-white">What's coming:</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Follow your favorite bettors
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  See real-time picks and results
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Track performance over time
                </li>
              </ul>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => window.location.href = '/my-picks'}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                View My Picks
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNavigation darkMode={darkMode} />
      <Footer />
    </div>
  );
}