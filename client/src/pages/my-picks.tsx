import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import { 
  TrendingUp, 
  Target, 
  BarChart3,
  Zap
} from "lucide-react";

export default function MyPicksPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">+$2,847</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">73%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hit Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Bets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">High Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional content for My Picks page */}
      <div className="space-y-6">
        {/* Recent Picks Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Picks
            </h3>
            <div className="text-gray-600 dark:text-gray-400 text-center py-8">
              Your recent picks and their outcomes will appear here
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Overview
            </h3>
            <div className="text-gray-600 dark:text-gray-400 text-center py-8">
              Performance charts and analytics will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}