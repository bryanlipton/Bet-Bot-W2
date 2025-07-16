import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, BarChart3, TrendingUp, Zap } from "lucide-react";
import { LoginButton } from "@/components/LoginButton";
import betbotLogo from "@/assets/betbot-logo.png";

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
            <img 
              src={betbotLogo} 
              alt="BetBot Logo" 
              className="w-14 h-14 object-contain"
            />
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
            
            <div className="flex flex-col items-center gap-1">
              <LoginButton />
              <span 
                className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
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