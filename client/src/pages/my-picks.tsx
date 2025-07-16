import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  BarChart3,
  Zap
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function MyPicksPage() {
  const [location] = useLocation();

  // Navigation tabs
  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Picks
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your betting performance and statistics
            </p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center px-6">
          {navigationTabs.map((tab) => (
            <Link key={tab.path} href={tab.path}>
              <button
                className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                  tab.active
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.name}
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-6">

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