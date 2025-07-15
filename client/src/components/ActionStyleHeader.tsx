import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, BarChart3, TrendingUp, Zap } from "lucide-react";

interface ActionStyleHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ActionStyleHeader({ darkMode, onToggleDarkMode }: ActionStyleHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bet Bot</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sports Betting Intelligence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm">
              Home
            </Link>
            <Link href="/odds" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm">
              Live Odds
            </Link>
            <Link href="/predictions" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm">
              Predictions
            </Link>
            <Link href="/analytics" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm">
              Analytics
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Zap className="w-4 h-4 mr-1" />
              Get Pro
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}