import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ChatSidebar from "@/components/ChatSidebar";
import MainDashboard from "@/components/MainDashboard";
import BaseballAI from "@/components/BaseballAI";
import { BacktestResults } from "@/components/BacktestResults";
import { LiveMLBGames } from "@/components/LiveMLBGames";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSport, setActiveSport] = useState("americanfootball_nfl");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, baseball-ai, backtest, live-games
  
  // Initialize WebSocket connection
  useWebSocket();

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
      <AppHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="flex h-[calc(100vh-80px)]">
        <ChatSidebar />
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("baseball-ai")}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "baseball-ai"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Baseball AI
              </button>
              <button
                onClick={() => setActiveTab("backtest")}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "backtest"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Backtest
              </button>
              <button
                onClick={() => setActiveTab("live-games")}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "live-games"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Live Games
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "dashboard" && (
              <MainDashboard activeSport={activeSport} onSportChange={setActiveSport} />
            )}
            {activeTab === "baseball-ai" && (
              <div className="p-6">
                <BaseballAI />
              </div>
            )}
            {activeTab === "backtest" && (
              <div className="p-6">
                <BacktestResults />
              </div>
            )}
            {activeTab === "live-games" && (
              <div className="p-6">
                <LiveMLBGames />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
