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

// [Keep all the existing interfaces - LiveOddsGame, ProcessedGame]

import React, { useState, useEffect } from 'react';

// Fixed DailyPick component with click handlers
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

  // [Keep the existing getStadiumFromTeam function]
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

  // [Keep the existing formatGameTime function]
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

  // [Keep the existing getLiveOdds function]
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

  // ADD THESE NEW HANDLER FUNCTIONS
  const handlePick = (e) => {
    if (!pick) return;
    
    const button = e.currentTarget;
    const originalText = button.textContent;
    
    const pickData = {
      id: `pick-${Date.now()}`,
      gameInfo: {
        gameId: pick.gameId || `${pick.awayTeam}-${pick.homeTeam}-${Date.now()}`,
        sport: 'MLB',
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        startTime: pick.startTime || pick.gameTime || pick.commence_time,
        venue: pick.venue || getStadiumFromTeam(pick.homeTeam) || 'TBD'
      },
      betInfo: {
        type: 'moneyline',
        pick: pick.pickTeam,
        odds: getLiveOdds() || pick.odds,
        amount: 100,
        confidence: pick.confidence,
        grade: pick.grade,
        analysis: pick.analysis
      },
      bookmaker: {
        name: 'Bet Bot AI Pick',
        url: '#'
      },
      timestamp: Date.now(),
      status: 'pending',
      isPick: true,
      reasoning: pick.reasoning
    };

    try {
      const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
      existingPicks.unshift(pickData);
      localStorage.setItem('userPicks', JSON.stringify(existingPicks));
      
      // Visual feedback
      button.textContent = '✓ Picked!';
      button.classList.add('bg-green-700');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-700');
      }, 2000);
      
      console.log('✅ Pick saved:', pickData);
    } catch (error) {
      console.error('Error saving pick:', error);
      alert('Error saving pick. Please try again.');
    }
  };

  const handleFade = (e) => {
    if (!pick) return;
    
    const button = e.currentTarget;
    const originalText = button.textContent;
    
    const oppositeTeam = pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam;
    
    let oppositeOdds;
    if (pick.odds > 0) {
      oppositeOdds = -(pick.odds + 100);
    } else {
      oppositeOdds = Math.abs(pick.odds) - 100;
    }
    
    const fadeData = {
      id: `fade-${Date.now()}`,
      gameInfo: {
        gameId: pick.gameId || `${pick.awayTeam}-${pick.homeTeam}-${Date.now()}`,
        sport: 'MLB',
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        startTime: pick.startTime || pick.gameTime || pick.commence_time,
        venue: pick.venue || getStadiumFromTeam(pick.homeTeam) || 'TBD'
      },
      betInfo: {
        type: 'moneyline',
        pick: oppositeTeam,
        odds: oppositeOdds,
        amount: 100,
        confidence: 100 - pick.confidence,
        grade: invertGrade(pick.grade),
        isFade: true
      },
      bookmaker: {
        name: 'Bet Bot AI Fade',
        url: '#'
      },
      timestamp: Date.now(),
      status: 'pending',
      isFade: true,
      originalPick: pick.pickTeam,
      reasoning: `Fading AI pick: ${pick.pickTeam}`
    };

    try {
      const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
      existingPicks.unshift(fadeData);
      localStorage.setItem('userPicks', JSON.stringify(existingPicks));
      
      // Visual feedback
      button.textContent = '✓ Faded!';
      button.classList.add('bg-red-700');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-red-700');
      }, 2000);
      
      console.log('✅ Fade saved:', fadeData);
    } catch (error) {
      console.error('Error saving fade:', error);
      alert('Error saving fade. Please try again.');
    }
  };

  const invertGrade = (grade) => {
    const gradeMap = {
      'A+': 'F', 'A': 'D', 'A-': 'D+',
      'B+': 'C-', 'B': 'C', 'B-': 'C+',
      'C+': 'B-', 'C': 'B', 'C-': 'B+',
      'D+': 'A-', 'D': 'A', 'F': 'A+'
    };
    return gradeMap[grade] || 'C';
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
      
      {/* UPDATED BUTTONS WITH HANDLERS */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handlePick}
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
        >
          Pick
        </button>
        <button 
          onClick={handleFade}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
        >
          Fade
        </button>
      </div>
    </div>
  );
}

// Fixed LoggedInLockPick component with click handlers
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

  // [Keep all the same helper functions as DailyPick]
  const getStadiumFromTeam = (homeTeam) => {
    // Same as in DailyPick
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
    // Same as in DailyPick
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

  // ADD THE SAME HANDLER FUNCTIONS FOR LOCK PICK
  const handlePick = (e) => {
    if (!pick) return;
    
    const button = e.currentTarget;
    const originalText = button.textContent;
    
    const pickData = {
      id: `lock-pick-${Date.now()}`,
      gameInfo: {
        gameId: pick.gameId || `${pick.awayTeam}-${pick.homeTeam}-${Date.now()}`,
        sport: 'MLB',
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        startTime: pick.startTime || pick.gameTime || pick.commence_time,
        venue: pick.venue || getStadiumFromTeam(pick.homeTeam) || 'TBD'
      },
      betInfo: {
        type: 'moneyline',
        pick: pick.pickTeam,
        odds: getLiveOdds() || pick.odds,
        amount: 100,
        confidence: pick.confidence,
        grade: pick.grade,
        analysis: pick.analysis,
        isLockPick: true
      },
      bookmaker: {
        name: 'Bet Bot Lock Pick',
        url: '#'
      },
      timestamp: Date.now(),
      status: 'pending',
      isLockPick: true,
      reasoning: pick.reasoning
    };

    try {
      const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
      existingPicks.unshift(pickData);
      localStorage.setItem('userPicks', JSON.stringify(existingPicks));
      
      button.textContent = '✓ Picked!';
      button.classList.add('bg-green-700');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-700');
      }, 2000);
      
      console.log('✅ Lock pick saved:', pickData);
    } catch (error) {
      console.error('Error saving lock pick:', error);
      alert('Error saving pick. Please try again.');
    }
  };

  const handleFade = (e) => {
    if (!pick) return;
    
    const button = e.currentTarget;
    const originalText = button.textContent;
    
    const oppositeTeam = pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam;
    
    let oppositeOdds;
    if (pick.odds > 0) {
      oppositeOdds = -(pick.odds + 100);
    } else {
      oppositeOdds = Math.abs(pick.odds) - 100;
    }
    
    const fadeData = {
      id: `lock-fade-${Date.now()}`,
      gameInfo: {
        gameId: pick.gameId || `${pick.awayTeam}-${pick.homeTeam}-${Date.now()}`,
        sport: 'MLB',
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        startTime: pick.startTime || pick.gameTime || pick.commence_time,
        venue: pick.venue || getStadiumFromTeam(pick.homeTeam) || 'TBD'
      },
      betInfo: {
        type: 'moneyline',
        pick: oppositeTeam,
        odds: oppositeOdds,
        amount: 100,
        confidence: 100 - pick.confidence,
        grade: invertGrade(pick.grade),
        isFade: true,
        isLockFade: true
      },
      bookmaker: {
        name: 'Bet Bot Lock Fade',
        url: '#'
      },
      timestamp: Date.now(),
      status: 'pending',
      isFade: true,
      isLockFade: true,
      originalPick: pick.pickTeam,
      reasoning: `Fading lock pick: ${pick.pickTeam}`
    };

    try {
      const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
      existingPicks.unshift(fadeData);
      localStorage.setItem('userPicks', JSON.stringify(existingPicks));
      
      button.textContent = '✓ Faded!';
      button.classList.add('bg-red-700');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-red-700');
      }, 2000);
      
      console.log('✅ Lock fade saved:', fadeData);
    } catch (error) {
      console.error('Error saving fade:', error);
      alert('Error saving fade. Please try again.');
    }
  };

  const invertGrade = (grade) => {
    const gradeMap = {
      'A+': 'F', 'A': 'D', 'A-': 'D+',
      'B+': 'C-', 'B': 'C', 'B-': 'C+',
      'C+': 'B-', 'C': 'B', 'C-': 'B+',
      'D+': 'A-', 'D': 'A', 'F': 'A+'
    };
    return gradeMap[grade] || 'C';
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
      
      {/* UPDATED BUTTONS WITH HANDLERS */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handlePick}
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
        >
          Pick
        </button>
        <button 
          onClick={handleFade}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
        >
          Fade
        </button>
      </div>
    </div>
  );
}

// [Keep the rest of your ActionStyleDashboard component exactly as is]
// The main export and all other code remains unchanged
