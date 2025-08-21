import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { getTeamColor } from "@/utils/teamLogos";
import MobileHeader from "@/components/MobileHeader";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3,
  Users,
  Clock,
  Star,
  Zap,
  RefreshCw,
  Newspaper
} from "lucide-react";

interface LiveOddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface ProcessedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  sportKey: string;
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
  rawBookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
    last_update: string;
  }>;
}

import React, { useState, useEffect } from 'react';
// Fixed DailyPick component that properly maps API fields
function DailyPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-pick')
      .then(res => res.json())
      .then(data => {
        console.log('Daily Pick API Response:', data);
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching daily pick:', err);
        setLoading(false);
      });
  }, []);

  // Helper to get stadium name from home team
  const getStadiumFromTeam = (homeTeam) => {
    const stadiums = {
      'Yankees': 'Yankee Stadium',
      'Mets': 'Citi Field',
      'Red Sox': 'Fenway Park',
      'Phillies': 'Citizens Bank Park',
      'Nationals': 'Nationals Park',
      'Orioles': 'Oriole Park at Camden Yards',
      'Pirates': 'PNC Park',
      'Guardians': 'Progressive Field',
      'Blue Jays': 'Rogers Centre',
      'Braves': 'Truist Park',
      'Marlins': 'loanDepot Park',
      'Rays': 'George M. Steinbrenner Field',
      'Cubs': 'Wrigley Field',
      'White Sox': 'Rate Field',
      'Tigers': 'Comerica Park',
      'Royals': 'Kauffman Stadium',
      'Cardinals': 'Busch Stadium',
      'Twins': 'Target Field',
      'Brewers': 'American Family Field',
      'Astros': 'Daikin Park',
      'Rangers': 'Globe Life Field',
      'Athletics': 'Sutter Health Park',
      'Rockies': 'Coors Field',
      'Diamondbacks': 'Chase Field',
      'Dodgers': 'Dodger Stadium',
      'Angels': 'Angel Stadium',
      'Padres': 'Petco Park',
      'Giants': 'Oracle Park',
      'Mariners': 'T-Mobile Park',
      'Reds': 'Great American Ball Park'
    };
    
    if (stadiums[homeTeam]) return stadiums[homeTeam];
    
    for (const [team, stadium] of Object.entries(stadiums)) {
      if (homeTeam?.includes(team) || team.includes(homeTeam)) {
        return stadium;
      }
    }
    
    return null;
  };

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || 
                      pick?.commence_time || 
                      pick?.gameTime || 
                      pick?.scheduledTime ||
                      pick?.game_time;
    
   const venue = getStadiumFromTeam(pick?.homeTeam) || 
              pick?.venue || 
              pick?.stadium || 
              pick?.ballpark ||
              'Stadium TBD';
    
    if (!dateString) {
      if (venue) return `Time TBD • ${venue}`;
      return "TBD";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return venue ? `Time TBD • ${venue}` : "TBD";
      }
      
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      const options = {
        timeZone: "America/New_York",
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      const timeStr = date.toLocaleString("en-US", options);
      const formattedTime = `${timeStr} ET`;
      const location = venue || 'Stadium TBD';
      
      if (isToday) {
        return `${formattedTime} • ${location}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month} ${day} at ${formattedTime} • ${location}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return venue ? `Time TBD • ${venue}` : "TBD";
    }
  };

  // LIVE ODDS FUNCTION - PROPERLY PLACED
  const getLiveOdds = () => {
    if (!pick) return null;
    if (!liveGameData) return pick.odds;
    
    if (pick.pickTeam === liveGameData.homeTeam) {
      return liveGameData.homeOdds || pick.odds;
    } else if (pick.pickTeam === liveGameData.awayTeam) {
      return liveGameData.awayOdds || pick.odds;
    }
    
    return pick.odds;
  };

  if (loading) {
    return (
      <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-400/30 rounded-xl p-6 shadow-lg shadow-blue-500/10">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded w-32 mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-48 mb-3"></div>
          <div className="h-8 bg-blue-100 dark:bg-blue-900/30 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-400/30 rounded-xl p-6 shadow-lg shadow-blue-500/10">
        <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Pick of the Day</h3>
        <p className="text-gray-700 dark:text-gray-300">No Pick Available Today</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check back when games are available</p>
      </div>
    );
  }

  return (
    <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/50 rounded-xl p-6 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:border-blue-500/70 transition-all duration-300">
      <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
        {pick.grade}
      </div>
      
      <h3 className="text-xl font-bold mb-1 text-blue-600 dark:text-blue-400">Pick of the Day</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">AI-backed Data Analysis</p>
      
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {pick.pickTeam} ML <span className="text-yellow-600 dark:text-yellow-400">
          {getLiveOdds() > 0 ? '+' : ''}{getLiveOdds()}
        </span>
        {liveGameData && getLiveOdds() !== pick.odds && (
          <span className="text-xs text-gray-500 ml-2">
            (opened {pick.odds > 0 ? '+' : ''}{pick.odds})
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        {pick.awayTeam} @ {pick.homeTeam}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {formatGameTime(pick)}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
          Pick
        </button>
        <button className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
          Fade
        </button>
      </div>
    </div>
  );
}
function LoggedInLockPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-pick/lock')
      .then(res => res.json())
      .then(data => {
        console.log('Lock Pick API Response:', data);
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lock pick:', err);
        setLoading(false);
      });
  }, []);

  const getStadiumFromTeam = (homeTeam) => {
    const stadiums = {
      'Yankees': 'Yankee Stadium',
      'Mets': 'Citi Field',
      'Red Sox': 'Fenway Park',
      'Phillies': 'Citizens Bank Park',
      'Nationals': 'Nationals Park',
      'Orioles': 'Oriole Park at Camden Yards',
      'Pirates': 'PNC Park',
      'Guardians': 'Progressive Field',
      'Blue Jays': 'Rogers Centre',
      'Braves': 'Truist Park',
      'Marlins': 'loanDepot Park',
      'Rays': 'George M. Steinbrenner Field',
      'Cubs': 'Wrigley Field',
      'White Sox': 'Rate Field',
      'Tigers': 'Comerica Park',
      'Royals': 'Kauffman Stadium',
      'Cardinals': 'Busch Stadium',
      'Twins': 'Target Field',
      'Brewers': 'American Family Field',
      'Astros': 'Daikin Park',
      'Rangers': 'Globe Life Field',
      'Athletics': 'Sutter Health Park',
      'Rockies': 'Coors Field',
      'Diamondbacks': 'Chase Field',
      'Dodgers': 'Dodger Stadium',
      'Angels': 'Angel Stadium',
      'Padres': 'Petco Park',
      'Giants': 'Oracle Park',
      'Mariners': 'T-Mobile Park',
      'Reds': 'Great American Ball Park'
    };
    
    if (stadiums[homeTeam]) return stadiums[homeTeam];
    
    for (const [team, stadium] of Object.entries(stadiums)) {
      if (homeTeam?.includes(team) || team.includes(homeTeam)) {
        return stadium;
      }
    }
    
    return null;
  };

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || 
                      pick?.commence_time || 
                      pick?.gameTime || 
                      pick?.scheduledTime ||
                      pick?.game_time;
    
    const venue = getStadiumFromTeam(pick?.homeTeam) || 
              pick?.venue || 
              pick?.stadium || 
              pick?.ballpark ||
              'Stadium TBD';
    
    if (!dateString) {
      if (venue) return `Time TBD • ${venue}`;
      return "TBD";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return venue ? `Time TBD • ${venue}` : "TBD";
      }
      
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      const options = {
        timeZone: "America/New_York",
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      const timeStr = date.toLocaleString("en-US", options);
      const formattedTime = `${timeStr} ET`;
      const location = venue || 'Stadium TBD';
      
      if (isToday) {
        return `${formattedTime} • ${location}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month} ${day} at ${formattedTime} • ${location}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return venue ? `Time TBD • ${venue}` : "TBD";
    }
  };

  // LIVE ODDS FUNCTION - PROPERLY PLACED
  const getLiveOdds = () => {
    if (!pick) return null;
    if (!liveGameData) return pick.odds;
    
    if (pick.pickTeam === liveGameData.homeTeam) {
      return liveGameData.homeOdds || pick.odds;
    } else if (pick.pickTeam === liveGameData.awayTeam) {
      return liveGameData.awayOdds || pick.odds;
    }
    
    return pick.odds;
  };

  if (loading) {
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <div className="animate-pulse">
          <div className="h-6 bg-orange-100 dark:bg-orange-900/30 rounded w-40 mb-2"></div>
          <div className="h-4 bg-orange-100 dark:bg-orange-900/30 rounded w-56 mb-3"></div>
          <div className="h-8 bg-orange-100 dark:bg-orange-900/30 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <h3 className="text-xl font-bold mb-2 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">Premium picks available for authenticated users</p>
        <div className="mt-6">
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
            Log in to view pick
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-500/50 rounded-xl p-6 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:border-orange-500/70 transition-all duration-300">
      <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
        {pick.grade}
      </div>
      
      <h3 className="text-xl font-bold mb-1 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Exclusive pick for authenticated users</p>
      
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {pick.pickTeam} ML <span className="text-yellow-600 dark:text-yellow-400">
          {getLiveOdds() > 0 ? '+' : ''}{getLiveOdds()}
        </span>
        {liveGameData && getLiveOdds() !== pick.odds && (
          <span className="text-xs text-gray-500 ml-2">
            (opened {pick.odds > 0 ? '+' : ''}{pick.odds})
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        {pick.awayTeam} @ {pick.homeTeam}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {formatGameTime(pick)}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
          Pick
        </button>
        <button className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
          Fade
        </button>
      </div>
    </div>
  );
}
// Demo container matching your app's grey background
export default function PickCardsDemo() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header matching your app */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white underline">
            Bet Bot Sports Genie AI Picks
          </h1>
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
            Pro Users
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyPick />
          <LoggedInLockPick />
        </div>
        
        {/* Sports tabs matching your app */}
        <div className="mt-8 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
          <button className="py-3 px-4 font-medium text-sm border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">
            MLB
          </button>
          <button className="py-3 px-4 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400">
            NFL
          </button>
          <button className="py-3 px-4 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400">
            NBA
          </button>
        </div>
        
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-4">Updated Design Features:</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <li>• Subtle <span className="text-blue-500">blue glow</span> on grey background for Pick of the Day</li>
            <li>• Subtle <span className="text-orange-500">orange glow</span> on grey background for Lock Pick</li>
            <li>• Lighter, translucent card backgrounds that work on grey</li>
            <li>• <span className="text-yellow-600">Yellow/gold odds numbers</span> for emphasis</li>
            <li>• Stronger hover states with increased glow and border opacity</li>
            <li>• Matches your existing app's grey background theme</li>
            <li>• Professional, clean look without being too flashy</li>
            <li>• Proper dark mode support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


import { ProGameCard } from "./ProGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";

// ULTRA SAFE DATE HELPER FUNCTION - REMOVED TIMEZONE
const safeFormatDate = (dateString: string | null | undefined): string => {
  try {
    if (!dateString) {
      return "TBD";
    }
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date received: ${dateString}`);
      return "TBD";
    }
    
    // ULTRA SAFE formatting - NO TIMEZONE OPTION
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.warn(`Error formatting date "${dateString}":`, error);
    return "TBD";
  }
};

// SAFE DATE COMPARISON FUNCTION
const isGameUpcoming = (dateString: string | null | undefined): boolean => {
  try {
    if (!dateString) return false;
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return false;
    
    const now = new Date();
    return gameDate > now;
  } catch (error) {
    console.warn(`Error comparing date "${dateString}":`, error);
    return false;
  }
};

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isProUser, isLoading: proLoading } = useProStatus();
  
  // Fetch complete schedule from MLB API + Odds API
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: selectedSport === 'baseball_mlb' ? ['/api/mlb/complete-schedule'] : ['/api/odds/events', selectedSport],
    queryFn: async () => {
      try {
        const response = await fetch(
          selectedSport === 'baseball_mlb' 
            ? '/api/mlb/complete-schedule' 
            : `/api/odds/events?sport=${selectedSport}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching odds data:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/recommendations?sport=${selectedSport}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch daily pick data
  const { data: dailyPick } = useQuery({
    queryKey: ['/api/daily-pick'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/daily-pick');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching daily pick:', error);
        return null;
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch lock pick data
  const { data: lockPick } = useQuery({
    queryKey: ['/api/daily-pick/lock'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/daily-pick/lock');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching lock pick:', error);
        return null;
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch user auth status
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Helper function to check if a game matches the daily pick
  const isGameDailyPick = (game: any) => {
    if (!dailyPick) return false;
    return game.homeTeam === dailyPick.homeTeam && game.awayTeam === dailyPick.awayTeam;
  };

  // Helper function to check if a game matches the lock pick
  const isGameLockPick = (game: any) => {
    if (!lockPick) return false;
    return game.homeTeam === lockPick.homeTeam && game.awayTeam === lockPick.awayTeam;
  };

  // Process live odds data into game format  
  const processLiveGames = (oddsData: LiveOddsGame[]): ProcessedGame[] => {
    if (!Array.isArray(oddsData)) {
      console.warn('Invalid odds data received:', oddsData);
      return [];
    }
    
    const shouldLog = Math.floor(Date.now() / 30000) % 5 === 0;
    if (shouldLog) {
      console.log(`Processing ${oddsData.length} games from API`);
    }
    
    // Filter out games that have already started - SAFE VERSION
    const upcomingGames = oddsData.filter(game => {
      if (!game || !game.commence_time) return false;
      return isGameUpcoming(game.commence_time);
    });
    
    // Sort games by commence time (chronological order) - SAFE VERSION
    const sortedGames = [...upcomingGames].sort((a, b) => {
      try {
        const dateA = new Date(a.commence_time || 0);
        const dateB = new Date(b.commence_time || 0);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Keep original order if dates are invalid
        }
        
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.warn('Error sorting games by date:', error);
        return 0;
      }
    });
    
    const processedGames = sortedGames.map((game, index) => {
      if (shouldLog) {
        console.log(`Processing game ${index + 1}: ${game.away_team} @ ${game.home_team} - Bookmakers: ${game.bookmakers?.length || 0}`);
      }
      
      // Safe bookmaker data extraction
      const firstBookmaker = Array.isArray(game.bookmakers) && game.bookmakers.length > 0 ? game.bookmakers[0] : null;
      const h2hMarket = firstBookmaker?.markets?.find(m => m.key === 'h2h');
      const spreadsMarket = firstBookmaker?.markets?.find(m => m.key === 'spreads');
      const totalsMarket = firstBookmaker?.markets?.find(m => m.key === 'totals');
      
      const homeOutcome = h2hMarket?.outcomes?.find(o => o.name === game.home_team);
      const awayOutcome = h2hMarket?.outcomes?.find(o => o.name === game.away_team);
      const spreadOutcome = spreadsMarket?.outcomes?.find(o => o.name === game.home_team);
      const totalOutcome = totalsMarket?.outcomes?.find(o => o.name === 'Over');

      // Extract bookmaker lines (first 3 books) - prioritize major sportsbooks
      const priorityBooks = ['FanDuel', 'DraftKings', 'BetMGM', 'Caesars', 'PointsBet'];
      const sortedBookmakers = Array.isArray(game.bookmakers) 
        ? game.bookmakers.sort((a, b) => {
            const aIndex = priorityBooks.indexOf(a.title);
            const bIndex = priorityBooks.indexOf(b.title);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          })
        : [];
      
      const bookmakers = sortedBookmakers.slice(0, 3).map(book => {
        const bookH2h = book.markets?.find(m => m.key === 'h2h');
        const bookSpreads = book.markets?.find(m => m.key === 'spreads');
        const bookTotals = book.markets?.find(m => m.key === 'totals');
        
        const bookHomeOdds = bookH2h?.outcomes?.find(o => o.name === game.home_team)?.price;
        const bookAwayOdds = bookH2h?.outcomes?.find(o => o.name === game.away_team)?.price;
        const bookSpread = bookSpreads?.outcomes?.find(o => o.name === game.home_team)?.point;
        const bookTotal = bookTotals?.outcomes?.find(o => o.name === 'Over')?.point;

        return {
          name: book.title,
          homeOdds: bookHomeOdds,
          awayOdds: bookAwayOdds,
          spread: bookSpread,
          total: bookTotal
        };
      });

 return {
  id: game.id || `game_${index}`,
  homeTeam: game.home_team || 'Home Team',
  awayTeam: game.away_team || 'Away Team',
  homeOdds: homeOutcome?.price || null,
  awayOdds: awayOutcome?.price || null,
  spread: spreadOutcome?.point || null,
  total: totalOutcome?.point || null,
 startTime: game.commence_time,
  sportKey: game.sport_key || selectedSport,
  bookmakers,
  rawBookmakers: Array.isArray(game.bookmakers) ? game.bookmakers : [],
  gameId: game.gameId || game.id || `game_${index}`,
  probablePitchers: game.probablePitchers,
  venue: game.venue
};
    });
    
    if (shouldLog) {
      console.log(`Processed ${processedGames.length} games successfully`);
    }
    return processedGames;
  };

  const featuredGames = processLiveGames(liveOddsData || []);
// ADD THESE HELPER FUNCTIONS
const getDailyPickLiveGame = () => {
  if (!dailyPick || !featuredGames.length) return null;
  
  const matchingGame = featuredGames.find(game => 
    game.homeTeam === dailyPick.homeTeam && 
    game.awayTeam === dailyPick.awayTeam
  );
  
  return matchingGame;
};

const getLockPickLiveGame = () => {
  if (!lockPick || !featuredGames.length) return null;
  
  const matchingGame = featuredGames.find(game => 
    game.homeTeam === lockPick.homeTeam && 
    game.awayTeam === lockPick.awayTeam
  );
  
  return matchingGame;
};
  // Mock prediction function (replace with actual API call)
  const getPrediction = (homeTeam: string, awayTeam: string) => {
    // Simplified team strengths for demo
    const teamStrengths: Record<string, number> = {
      'Yankees': 0.72, 'Dodgers': 0.70, 'Astros': 0.68, 'Braves': 0.67,
      'Phillies': 0.65, 'Padres': 0.64, 'Mets': 0.62, 'Orioles': 0.61,
      'Guardians': 0.60, 'Brewers': 0.59, 'Red Sox': 0.58, 'Cardinals': 0.57
    };

    const homeStrength = teamStrengths[homeTeam] || 0.50;
    const awayStrength = teamStrengths[awayTeam] || 0.50;
    const homeFieldBonus = 0.035;
    
    let homeWinProb = (homeStrength / (homeStrength + awayStrength)) + homeFieldBonus;
    homeWinProb = Math.max(0.25, Math.min(0.75, homeWinProb));
    const awayWinProb = 1 - homeWinProb;
    
    const confidence = Math.abs(homeWinProb - 0.5) * 1.5 + 0.6;
    const winnerProb = Math.max(homeWinProb, awayWinProb);
    const edge = winnerProb > 0.52 ? ((winnerProb - 0.52) * 100).toFixed(1) + '%' : 'No edge';

    return {
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      confidence: Math.min(0.85, confidence),
      edge
    };
  };

  // Sports tabs
  const sports = [
    { key: "baseball_mlb", name: "MLB", active: selectedSport === "baseball_mlb" },
    { key: "americanfootball_nfl", name: "NFL", active: selectedSport === "americanfootball_nfl" },
    { key: "basketball_nba", name: "NBA", active: selectedSport === "basketball_nba" },
  ];

  return (
    <>
      <MobileHeader />
      {/* Mobile-first container with proper mobile navigation padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 md:space-y-6 pb-20 sm:pb-6">

      {/* Bet Bot Sports Genie AI Picks - Prominently positioned at top for logged in users */}
      {isAuthenticated && (
        <div className="space-y-3 mb-4 sm:mb-6 mt-2 sm:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 md:gap-3">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white underline">
                Bet Bot Sports Genie AI Picks
              </h2>
            </div>
            <Badge variant="outline" className={`${isProUser ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white border-none self-start sm:self-auto text-xs md:text-xs lg:text-sm`}>
              {isProUser ? 'Pro Users' : 'Free Users'}
            </Badge>
          </div>
          
          {/* WORKING PICK COMPONENTS */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
  <DailyPick liveGameData={getDailyPickLiveGame()} />
  <LoggedInLockPick liveGameData={getLockPickLiveGame()} />
</div>
        </div>
      )}

      {/* Pick of the Day Section - For logged out users */}
      {!isAuthenticated && (
        <div className="space-y-4">
          {/* Bet Bot Sports Genie AI Picks - Always at top, no tired of guessing section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white underline">
                Bet Bot Sports Genie AI Picks
              </h2>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none self-start sm:self-auto text-xs md:text-xs lg:text-sm">
              Free Users
            </Badge>
          </div>
          
          {/* WORKING PICK COMPONENTS */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
  <DailyPick liveGameData={getDailyPickLiveGame()} />
  <LoggedInLockPick liveGameData={getLockPickLiveGame()} />
</div>
        </div>
      )}

      {/* Sports Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {sports.map((sport) => (
          <button
            key={sport.key}
            onClick={() => setSelectedSport(sport.key)}
            className={`py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
              selectedSport === sport.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {sport.name}
          </button>
        ))}
      </div>

      {/* Featured Games */}
      <div>
        {/* Mobile-optimized games header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              {selectedSport === 'baseball_mlb' ? 'MLB Game Odds' : 
               selectedSport === 'americanfootball_nfl' ? 'NFL Game Odds' :
               selectedSport === 'basketball_nba' ? 'NBA Game Odds' : 
               `${sports.find(s => s.key === selectedSport)?.name} Game Odds`}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              {featuredGames.length} games
              {featuredGames.length < 10 && (
                <span className="hidden sm:inline ml-1">
                  • Some games may have TBD betting lines • Started games automatically removed
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOdds()}
              disabled={oddsLoading}
              className="flex items-center gap-1 text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <RefreshCw className={`w-3 h-3 ${oddsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-1.5 sm:px-2">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">Live</span> Odds
            </Badge>
          </div>
        </div>

        {oddsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Mobile-optimized game cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {featuredGames.map((game) => (
                isProUser ? (
                  <ProGameCard
                    key={game.id}
                    homeTeam={game.homeTeam}
                    awayTeam={game.awayTeam}
                    homeOdds={game.homeOdds}
                    awayOdds={game.awayOdds}
                    spread={game.spread}
                    total={game.total}
                    startTime={game.startTime}
                    gameId={game.gameId}
                    probablePitchers={game.probablePitchers}
                    rawBookmakers={game.rawBookmakers}
                  />
                ) : (
                  <ActionStyleGameCard
                    key={game.id}
                    homeTeam={game.homeTeam}
                    awayTeam={game.awayTeam}
                    homeOdds={game.homeOdds}
                    awayOdds={game.awayOdds}
                    spread={game.spread}
                    total={game.total}
                    startTime={game.startTime}
                    prediction={getPrediction(game.homeTeam, game.awayTeam)}
                    bookmakers={game.bookmakers}
                    gameId={game.gameId}
                    probablePitchers={game.probablePitchers}
                    isDailyPick={isGameDailyPick(game)}
                    dailyPickTeam={dailyPick?.pickTeam}
                    dailyPickGrade={dailyPick?.grade}
                    dailyPickId={dailyPick?.id}
                    lockPickTeam={isGameLockPick(game) ? lockPick?.pickTeam : undefined}
                    lockPickGrade={isGameLockPick(game) ? lockPick?.grade : undefined}
                    lockPickId={isGameLockPick(game) ? lockPick?.id : undefined}
                    isAuthenticated={!!user}
                    rawBookmakers={game.rawBookmakers}
                  />
                )
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Live Games
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No games are currently available for {sports.find(s => s.key === selectedSport)?.name}. 
                Check back later or try a different sport.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      </div>
    </>
  );
}

