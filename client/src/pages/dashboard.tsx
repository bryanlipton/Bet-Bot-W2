import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ChatSidebar from "@/components/ChatSidebar";
import MainDashboard from "@/components/MainDashboard";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSport, setActiveSport] = useState("americanfootball_nfl");
  
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
        <MainDashboard activeSport={activeSport} onSportChange={setActiveSport} />
      </div>
    </div>
  );
}
