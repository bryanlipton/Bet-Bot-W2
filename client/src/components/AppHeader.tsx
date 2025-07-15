import { Bot, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AppHeader({ darkMode, onToggleDarkMode }: AppHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bet Bot</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI Sports Betting Analytics</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm text-green-800 dark:text-green-200">API Connected</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="text-gray-600 dark:text-gray-300" size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
