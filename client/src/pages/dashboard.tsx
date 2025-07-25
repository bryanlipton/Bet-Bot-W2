import { useState, useEffect } from "react";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import { ActionStyleDashboard } from "@/components/ActionStyleDashboard";
import ChatSidebar from "@/components/ChatSidebar";
import MainDashboard from "@/components/MainDashboard";
import BaseballAI from "@/components/BaseballAI";
import { BacktestResults } from "@/components/BacktestResults";
import { LiveMLBGames } from "@/components/LiveMLBGames";
import { PredictionChat } from "@/components/PredictionChat";
import { GPTDownloader } from "@/components/GPTDownloader";
import Footer from "@/components/Footer";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSport, setActiveSport] = useState("americanfootball_nfl");
  const [activeTab, setActiveTab] = useState("action-dashboard");
  
  // Initialize WebSocket connection
  useWebSocket();

  // Initialize dark mode from localStorage (default to dark mode)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    // Default to dark mode if no preference is saved
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    // Save the default preference if none exists
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

  return (
    <div className="min-h-screen bg-background">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      {activeTab === "action-dashboard" ? (
        <div className="min-h-screen flex flex-col">
          <ActionStyleDashboard />
          <Footer />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-64px)]">
          <ChatSidebar />
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("action-dashboard")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "action-dashboard"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "dashboard"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Classic Dashboard
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
                <button
                  onClick={() => setActiveTab("prediction-chat")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "prediction-chat"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Prediction Chat
                </button>
                <button
                  onClick={() => setActiveTab("gpt-download")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "gpt-download"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Download GPT Files
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
              {activeTab === "prediction-chat" && (
                <div className="p-6">
                  <PredictionChat />
                </div>
              )}
              {activeTab === "gpt-download" && (
                <div className="p-6">
                  <GPTDownloader />
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      )}
    </div>
  );
}