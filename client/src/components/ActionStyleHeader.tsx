import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Moon, Sun, BarChart3, TrendingUp, Zap } from "lucide-react";
import { LoginButton } from "@/components/LoginButton";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface ActionStyleHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ActionStyleHeader({ darkMode, onToggleDarkMode }: ActionStyleHeaderProps) {
  const [location] = useLocation();

  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
  ];

  return (
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <img 
                    src={betbotLogo} 
                    alt="BetBot Logo" 
                    className="w-14 h-14 object-contain cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-150"
                  />
                </PopoverTrigger>
                <PopoverContent 
                  side="bottom" 
                  className="max-w-xs p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg"
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Tired of guessing?</h4>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Let BET BOT Sports Genie AI do the heavy lifting. Our machine-powered pick engine scans odds, player stats, betting trends, and more—to deliver the best picks for our users, every day.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationTabs.map((tab) => (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={`font-medium text-sm transition-colors ${
                    tab.active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {tab.name}
                </button>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDarkMode}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm">
              <Zap className="w-4 h-4 mr-1" />
              Get Pro
            </Button>
            
            <div className="flex flex-col items-center">
              <LoginButton />
              <span 
                className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 mt-1"
                onClick={() => {
                  alert('Authentication system is being set up. Please check back soon!');
                }}
              >
                Login for another free pick
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}