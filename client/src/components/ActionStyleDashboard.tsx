import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { OddsComparisonModal } from "./OddsComparisonModal";

// ADD THESE IMPORTS FOR ML INTEGRATION
import { MLApiService } from '../services/mlApi';
import { MLGradeDisplay } from './MLGradeDisplay';

// Your existing DailyPick component stays the same
function DailyPick({ liveGameData }) {
  // ... keep all your existing DailyPick code exactly as is ...
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameOdds, setGameOdds] = useState(null);
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  
  useEffect(() => {
    fetch('/api/daily-pick')
      .then(res => res.json())
      .then(data => {
        console.log('Daily Pick API Response:', data);
        setPick(data);
        setLoading(false);
        
        // Fetch odds for this specific game
        if (data && data.homeTeam && data.awayTeam) {
          fetch('/api/mlb/complete-schedule')
            .then(res => res.json())
            .then(games => {
              const matchingGame = games.find(g => 
                (g.home_team === data.homeTeam && g.away_team === data.awayTeam) ||
                (g.home_team.includes(data.homeTeam) && g.away_team.includes(data.awayTeam))
              );
              if (matchingGame) {
                setGameOdds(matchingGame);
                console.log('Found matching game with odds:', matchingGame);
              }
            })
            .catch(err => console.error('Error fetching game odds:', err));
            
          // Fetch game result if game is finished
          fetch(`/api/mlb/game-result?homeTeam=${encodeURIComponent(data.homeTeam)}&awayTeam=${encodeURIComponent(data.awayTeam)}&gameId=${data.gameId}`)
            .then(res => res.json())
            .then(resultData => {
              if (resultData && (resultData.status === 'finished' || resultData.status === 'in-progress')) {
                setGameResult(resultData);
              }
            })
            .catch(err => console.error('Error fetching game result:', err));
        }
      })
      .catch(err => {
        console.error('Error fetching daily pick:', err);
        setLoading(false);
      });
  }, []);

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!dateString) return "TBD";
    
    try {
      const date = new Date(dateString);
      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString("en-US", options) + " ET";
    } catch {
      return "TBD";
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

  // Check game status
  const getGameStatus = () => {
    if (!pick) return 'pending';
    
    // If we have game result data with finished status
    if (gameResult && gameResult.status === 'finished') {
      return 'finished';
    }
    
    // If we have game result data with in-progress status
    if (gameResult && gameResult.status === 'in-progress') {
      return 'in-progress';
    }
    
    const gameTime = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!gameTime) return 'pending';
    
    const now = new Date();
    const gameDate = new Date(gameTime);
    
    // Game has started but no result data yet
    if (now > gameDate) {
      return 'in-progress';
    }
    
    return 'pending';
  };

  // Determine pick result (Won/Lost/Push)
  const getPickResult = () => {
    if (!gameResult || gameResult.status !== 'finished' || !pick) return null;
    
    const homeScore = gameResult.homeScore;
    const awayScore = gameResult.awayScore;
    const pickTeam = pick.pickTeam;
    const homeTeam = pick.homeTeam;
    const awayTeam = pick.awayTeam;
    
    // Determine winner
    let winner = null;
    if (homeScore > awayScore) {
      winner = homeTeam;
    } else if (awayScore > homeScore) {
      winner = awayTeam;
    } else {
      return 'PUSH'; // Tie game
    }
    
    // Check if pick was correct
    if (winner === pickTeam) {
      return 'WON';
    } else {
      return 'LOST';
    }
  };

  // Navigate to scores tab for this specific game
  const handleSeeScore = () => {
    window.location.href = '/scores';
    
    if (pick) {
      localStorage.setItem('highlightGame', JSON.stringify({
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        gameId: pick.gameId
      }));
    }
  };

  const handlePick = (e) => {
    if (!pick || getGameStatus() !== 'pending') return;
    setSelectedBetType('pick');
    setShowOddsModal(true);
  };

  const handleFade = (e) => {
    if (!pick || getGameStatus() !== 'pending') return;
    setSelectedBetType('fade');
    setShowOddsModal(true);
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

  const gameStatus = getGameStatus();
  const pickResult = getPickResult();

  // Style based on game status
  const getCardStyle = () => {
    switch (gameStatus) {
      case 'finished':
        if (pickResult === 'WON') {
          return 'bg-green-50/50 dark:bg-green-950/20 border-2 border-green-500/50 shadow-green-500/20';
        } else if (pickResult === 'LOST') {
          return 'bg-red-50/50 dark:bg-red-950/20 border-2 border-red-500/50 shadow-red-500/20';
        } else {
          return 'bg-yellow-50/50 dark:bg-yellow-950/20 border-2 border-yellow-500/50 shadow-yellow-500/20';
        }
      case 'in-progress':
        return 'bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/50 shadow-blue-500/20';
      default:
        return 'bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/50 shadow-blue-500/20 hover:shadow-blue-500/30 hover:border-blue-500/70';
    }
  };

  const getHeaderColor = () => {
    switch (gameStatus) {
      case 'finished':
        if (pickResult === 'WON') return 'text-green-600 dark:text-green-400';
        if (pickResult === 'LOST') return 'text-red-600 dark:text-red-400';
        return 'text-yellow-600 dark:text-yellow-400';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getBadgeColor = () => {
    if (gameStatus === 'finished' && pickResult) {
      switch (pickResult) {
        case 'WON': return 'bg-green-500';
        case 'LOST': return 'bg-red-500';
        case 'PUSH': return 'bg-yellow-500';
      }
    }
    return 'bg-blue-500';
  };

  return (
    <>
      <div className={`relative rounded-xl p-6 shadow-xl transition-all duration-300 ${getCardStyle()}`}>
        <div className="absolute top-4 right-4">
          {gameStatus === 'finished' && pickResult ? (
            <div className={`${getBadgeColor()} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg`}>
              {pickResult}
            </div>
          ) : gameStatus !== 'finished' && pick.grade ? (
            <div className={`${getBadgeColor()} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg`}>
              {pick.grade}
            </div>
          ) : null}
        </div>
        
        <h3 className={`text-xl font-bold mb-1 ${getHeaderColor()}`}>
          Pick of the Day
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {gameStatus === 'finished' ? 'Game finished' : 
           gameStatus === 'in-progress' ? (
             <span className="inline-flex items-center text-red-500 font-bold text-sm">
               <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
               LIVE
             </span>
           ) : 
           'AI-backed Data Analysis'}
        </p>
        
        <div className={`text-2xl font-bold mb-3 ${
          gameStatus === 'in-progress' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
        }`}>
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
          {gameResult && gameStatus === 'finished' && (
            <span className="ml-2 font-semibold">
              {gameResult.awayScore} - {gameResult.homeScore}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {formatGameTime(pick)} • {pick.venue || 'Stadium TBD'}
        </div>
        
        {gameStatus === 'pending' ? (
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
        ) : gameStatus === 'finished' ? (
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Final Score
            </div>
            <div className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              {pick.awayTeam} {gameResult.awayScore} - {gameResult.homeScore} {pick.homeTeam}
            </div>
          </div>
        ) : (
          <button 
            onClick={handleSeeScore}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            View Live Score
          </button>
        )}
      </div>

      {showOddsModal && pick && gameStatus === 'pending' && (
        <OddsComparisonModal
          open={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          gameInfo={{
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            gameId: pick.gameId,
            sport: 'baseball_mlb',
            gameTime: pick.startTime || pick.gameTime || pick.commence_time
          }}
          bookmakers={gameOdds?.bookmakers || liveGameData?.rawBookmakers || []}
          selectedBet={{
            market: 'moneyline',
            selection: selectedBetType === 'fade' ? 
              (pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam) : 
              pick.pickTeam
          }}
        />
      )}
    </>
  );
}

// Your existing LoggedInLockPick component stays the same
function LoggedInLockPick({ liveGameData }) {
  // Keep all your existing LoggedInLockPick code exactly as is
  const { isAuthenticated, signInWithGoogle, isLoading: authLoading } = useAuth();
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState(null);
  const [gameOdds, setGameOdds] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    setLoading(true);
    
    if (!isAuthenticated) {
      setTimeout(() => {
        setPick(null);
        setLoading(false);
      }, 300);
      return;
    }
    
    fetch('/api/daily-pick/lock')
      .then(res => res.json())
      .then(data => {
        setPick(data);
        setTimeout(() => {
          setLoading(false);
        }, 100);
        
        if (data && data.homeTeam && data.awayTeam) {
          fetch('/api/mlb/complete-schedule')
            .then(res => res.json())
            .then(games => {
              const matchingGame = games.find(g => 
                (g.home_team === data.homeTeam && g.away_team === data.awayTeam) ||
                (g.home_team.includes(data.homeTeam) && g.away_team.includes(data.awayTeam))
              );
              if (matchingGame) {
                setGameOdds(matchingGame);
              }
            })
            .catch(err => console.error('Error fetching lock game odds:', err));
            
          // Fetch game result if game is finished
          fetch(`/api/mlb/game-result?homeTeam=${encodeURIComponent(data.homeTeam)}&awayTeam=${encodeURIComponent(data.awayTeam)}&gameId=${data.gameId}`)
            .then(res => res.json())
            .then(resultData => {
              if (resultData && (resultData.status === 'finished' || resultData.status === 'in-progress')) {
                setGameResult(resultData);
              }
            })
            .catch(err => console.error('Error fetching game result:', err));
        }
      })
      .catch(err => {
        console.error('Error fetching lock pick:', err);
        setPick(null);
        setLoading(false);
      });
  }, [isAuthenticated, authLoading]);

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!dateString) return "TBD";
    
    try {
      const date = new Date(dateString);
      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString("en-US", options) + " ET";
    } catch {
      return "TBD";
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

  // Check game status
  const getGameStatus = () => {
    if (!pick) return 'pending';
    
    if (gameResult && gameResult.status === 'finished') {
      return 'finished';
    }
    
    if (gameResult && gameResult.status === 'in-progress') {
      return 'in-progress';
    }
    
    const gameTime = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!gameTime) return 'pending';
    
    const now = new Date();
    const gameDate = new Date(gameTime);
    
    if (now > gameDate) {
      return 'in-progress';
    }
    
    return 'pending';
  };

  // Determine pick result (Won/Lost/Push)
  const getPickResult = () => {
    if (!gameResult || gameResult.status !== 'finished' || !pick) return null;
    
    const homeScore = gameResult.homeScore;
    const awayScore = gameResult.awayScore;
    const pickTeam = pick.pickTeam;
    const homeTeam = pick.homeTeam;
    const awayTeam = pick.awayTeam;
    
    let winner = null;
    if (homeScore > awayScore) {
      winner = homeTeam;
    } else if (awayScore > homeScore) {
      winner = awayTeam;
    } else {
      return 'PUSH';
    }
    
    if (winner === pickTeam) {
      return 'WON';
    } else {
      return 'LOST';
    }
  };

  const handleSeeScore = () => {
    window.location.href = '/scores';
    
    if (pick) {
      localStorage.setItem('highlightGame', JSON.stringify({
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        gameId: pick.gameId
      }));
    }
  };

  const handlePick = () => {
    if (!pick || getGameStatus() !== 'pending') return;
    setSelectedBetType('pick');
    setShowOddsModal(true);
  };

  const handleFade = () => {
    if (!pick || getGameStatus() !== 'pending') return;
    setSelectedBetType('fade');
    setShowOddsModal(true);
  };

  if (loading || authLoading) {
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <div className="animate-pulse">
          <div className="h-6 bg-orange-100 dark:bg-orange-900/30 rounded w-32 mb-2"></div>
          <div className="h-4 bg-orange-100 dark:bg-orange-900/30 rounded w-48 mb-3"></div>
          <div className="h-8 bg-orange-100 dark:bg-orange-900/30 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    if (isAuthenticated) {
      return (
        <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
          <h3 className="text-xl font-bold mb-2 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
          <p className="text-gray-700 dark:text-gray-300">No Lock Pick Available Today</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check back when games are available</p>
        </div>
      );
    }
    
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <h3 className="text-xl font-bold mb-2 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">Premium picks available for authenticated users</p>
        <div className="mt-6">
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
          >
            Log in to view pick
          </button>
        </div>
      </div>
    );
  }

  const gameStatus = getGameStatus();
  const pickResult = getPickResult();

  const getCardStyle = () => {
    switch (gameStatus) {
      case 'finished':
        if (pickResult === 'WON') {
          return 'bg-green-50/40 dark:bg-green-950/20 border-2 border-green-500/50 shadow-green-500/20';
        } else if (pickResult === 'LOST') {
          return 'bg-red-50/40 dark:bg-red-950/20 border-2 border-red-500/50 shadow-red-500/20';
        } else {
          return 'bg-yellow-50/40 dark:bg-yellow-950/20 border-2 border-yellow-500/50 shadow-yellow-500/20';
        }
      case 'in-progress':
        return 'bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-500/50 shadow-orange-500/20';
      default:
        return 'bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-500/50 shadow-orange-500/20 hover:shadow-orange-500/30 hover:border-orange-500/70';
    }
  };

  const getHeaderColor = () => {
    switch (gameStatus) {
      case 'finished':
        if (pickResult === 'WON') return 'text-green-600 dark:text-green-400';
        if (pickResult === 'LOST') return 'text-red-600 dark:text-red-400';
        return 'text-yellow-600 dark:text-yellow-400';
      case 'in-progress':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-orange-600 dark:text-orange-400';
    }
  };

  const getBadgeColor = () => {
    if (gameStatus === 'finished' && pickResult) {
      switch (pickResult) {
        case 'WON': return 'bg-green-500';
        case 'LOST': return 'bg-red-500';
        case 'PUSH': return 'bg-yellow-500';
      }
    }
    return 'bg-orange-500';
  };

  return (
    <>
      <div className={`relative rounded-xl p-6 shadow-xl transition-all duration-300 ${getCardStyle()}`}>
        <div className="absolute top-4 right-4">
          {gameStatus === 'finished' && pickResult ? (
            <div className={`${getBadgeColor()} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg`}>
              {pickResult}
            </div>
          ) : gameStatus !== 'finished' && pick.grade ? (
            <div className={`${getBadgeColor()} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg`}>
              {pick.grade}
            </div>
          ) : null}
        </div>
        
        <h3 className={`text-xl font-bold mb-1 ${getHeaderColor()}`}>
          Logged in Lock Pick
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {gameStatus === 'finished' ? 'Game finished' : 
           gameStatus === 'in-progress' ? (
             <span className="inline-flex items-center text-red-500 font-bold text-sm">
               <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
               LIVE
             </span>
           ) : 
           'Exclusive pick for authenticated users'}
        </p>
        
        <div className={`text-2xl font-bold mb-3 ${
          gameStatus === 'in-progress' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
        }`}>
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
          {gameResult && gameStatus === 'finished' && (
            <span className="ml-2 font-semibold">
              {gameResult.awayScore} - {gameResult.homeScore}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {formatGameTime(pick)} • {pick.venue || 'Stadium TBD'}
        </div>
        
        {gameStatus === 'pending' ? (
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
        ) : gameStatus === 'finished' ? (
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Final Score
            </div>
            <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              {pick.awayTeam} {gameResult.awayScore} - {gameResult.homeScore} {pick.homeTeam}
            </div>
          </div>
        ) : (
          <button 
            onClick={handleSeeScore}
            className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            View Live Score
          </button>
        )}
      </div>

      {showOddsModal && pick && gameStatus === 'pending' && (
        <OddsComparisonModal
          open={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          gameInfo={{
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            gameId: pick.gameId,
            sport: 'baseball_mlb',
            gameTime: pick.startTime || pick.gameTime || pick.commence_time
          }}
          bookmakers={gameOdds?.bookmakers || liveGameData?.rawBookmakers || []}
          selectedBet={{
            market: 'moneyline',
            selection: selectedBetType === 'fade' ? 
              (pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam) : 
              pick.pickTeam
          }}
        />
      )}
    </>
  );
}

// MAIN COMPONENT WITH ML INTEGRATION
function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const { isAuthenticated } = useAuth();
  const { isProUser } = useProStatus();

  // NEW: ML API QUERIES FOR PREDICTIONS
  const { data: nflPicks, isLoading: nflPicksLoading } = useQuery({
    queryKey: ['nfl-picks'],
    queryFn: () => MLApiService.getNFLPicks(),
    enabled: selectedSport === 'americanfootball_nfl',
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: cfbPicks, isLoading: cfbPicksLoading } = useQuery({
    queryKey: ['cfb-picks'],
    queryFn: () => MLApiService.getCFBPicks(),
    enabled: selectedSport === 'americanfootball_ncaaf',
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // NEW: ML HEALTH CHECK
  const { data: mlHealth } = useQuery({
    queryKey: ['ml-health'],
    queryFn: () => MLApiService.checkHealth(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // EXISTING: Fetch odds data based on selected sport
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: [selectedSport, 'complete-schedule'],
    queryFn: async () => {
      try {
        let endpoint;
        switch (selectedSport) {
          case 'baseball_mlb':
            endpoint = '/api/mlb/complete-schedule';
            break;
          case 'americanfootball_nfl':
            endpoint = '/api/nfl/complete-schedule';
            break;
          case 'basketball_nba':
            endpoint = '/api/nba/complete-schedule';
            break;
          case 'americanfootball_ncaaf':
            endpoint = '/api/cfb/complete-schedule';
            break;
          default:
            endpoint = '/api/mlb/complete-schedule';
        }
        
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching odds:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Process games data
  const processGames = (games) => {
    if (!Array.isArray(games)) return [];
    
    const now = new Date();
    const upcomingGames = games.filter(game => {
      if (!game.commence_time) return false;
      const gameTime = new Date(game.commence_time);
      return gameTime > now;
    });
    
    return upcomingGames.map(game => {
      const firstBookmaker = game.bookmakers?.[0];
      
      const h2hMarket = firstBookmaker?.markets?.find(m => m.key === 'h2h');
      const spreadsMarket = firstBookmaker?.markets?.find(m => m.key === 'spreads');
      const totalsMarket = firstBookmaker?.markets?.find(m => m.key === 'totals');
      
      const homeMoneyline = h2hMarket?.outcomes?.find(o => o.name === game.home_team)?.price;
      const awayMoneyline = h2hMarket?.outcomes?.find(o => o.name === game.away_team)?.price;
      
      const homeSpread = spreadsMarket?.outcomes?.find(o => o.name === game.home_team)?.point;
      const awaySpread = spreadsMarket?.outcomes?.find(o => o.name === game.away_team)?.point;
      
      const totalLine = totalsMarket?.outcomes?.find(o => o.name === 'Over')?.point;
      
      return {
        id: game.id || `game_${Date.now()}`,
        homeTeam: game.home_team || 'Home',
        awayTeam: game.away_team || 'Away',
        homeOdds: homeMoneyline,
        awayOdds: awayMoneyline,
        spread: homeSpread,
        total: totalLine,
        startTime: game.commence_time,
        sportKey: game.sport_key,
        rawBookmakers: game.bookmakers || []
      };
    });
  };

  // NEW: COMBINE GAMES WITH ML PREDICTIONS
  const combineGamesWithPredictions = (games, mlPicks) => {
    if (!mlPicks || !Array.isArray(mlPicks)) return games;

    return games.map(game => {
      const mlPick = mlPicks.find(pick => 
        (pick.homeTeam === game.homeTeam && pick.awayTeam === game.awayTeam) ||
        (pick.homeTeam.includes(game.homeTeam.split(' ').pop()) && 
         pick.awayTeam.includes(game.awayTeam.split(' ').pop()))
      );

      return {
        ...game,
        mlPrediction: mlPick || null
      };
    });
  };

  // Process games and combine with ML predictions
  let games = processGames(liveOddsData);
  
  // NEW: GET CURRENT ML PREDICTIONS
  const getCurrentMLPicks = () => {
    switch (selectedSport) {
      case "americanfootball_nfl": return nflPicks;
      case "americanfootball_ncaaf": return cfbPicks;
      default: return null;
    }
  };

  const currentMLPicks = getCurrentMLPicks();
  games = combineGamesWithPredictions(games, currentMLPicks);

  // NEW: SEPARATE GAMES WITH AND WITHOUT PREDICTIONS
  const gamesWithPredictions = games.filter(game => game.mlPrediction);
  const gamesWithoutPredictions = games.filter(game => !game.mlPrediction);

  const sports = [
    { key: "baseball_mlb", name: "MLB" },
    { key: "americanfootball_nfl", name: "NFL" },
    { key: "basketball_nba", name: "NBA" },
    { key: "americanfootball_ncaaf", name: "CFB" },
  ];

  return (
    <>
      <MobileHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-1 sm:pt-4 pb-20 sm:pb-6 space-y-4 md:space-y-6">
        {/* Header with ML Health Status */}
        <div className="space-y-2 mb-1 sm:mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white underline">
              Bet Bot Sports Genie AI Picks
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${isProUser ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white border-none self-start sm:self-auto`}>
                {isProUser ? 'Pro Users' : 'Free Users'}
              </Badge>
              
              {/* NEW: ML HEALTH STATUS */}
              <div className={`px-3 py-1 rounded-full text-xs ${
                mlHealth?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                AI: {mlHealth?.status || 'offline'}
              </div>
            </div>
          </div>
          
          {/* Pick Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
            <DailyPick liveGameData={games.find(g => 
              g.homeTeam === 'Cincinnati Reds' && g.awayTeam === 'St. Louis Cardinals'
            )} />
            <LoggedInLockPick liveGameData={games.find(g => 
              g.homeTeam === 'Houston Astros' || g.awayTeam === 'Houston Astros'
            )} />
          </div>
        </div>

        {/* Sports Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {sports.map((sport) => (
            <button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              className={`py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap relative ${
                selectedSport === sport.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {sport.name}
              {/* NEW: SHOW INDICATOR FOR SPORTS WITH ML PREDICTIONS */}
              {((sport.key === 'americanfootball_nfl' && nflPicks?.length > 0) || 
                (sport.key === 'americanfootball_ncaaf' && cfbPicks?.length > 0)) && (
                <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Games Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {sports.find(s => s.key === selectedSport)?.name || 'MLB'} Game Odds
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {games.length} games available
              </p>
            </div>
          </div>

          {oddsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* NEW: GAMES WITH AI PREDICTIONS */}
              {gamesWithPredictions.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Predictions & Grades
                    </h3>
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {gamesWithPredictions.length} Games
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {gamesWithPredictions.map((game) => (
                      <div key={game.id} className="relative">
                        {/* ML GRADE HEADER */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-t-lg border-b">
                          <MLGradeDisplay 
                            grade={game.mlPrediction.recommendation.grade}
                            confidence={game.mlPrediction.recommendation.confidence}
                            edge={game.mlPrediction.recommendation.edge}
                            compact={true}
                          />
                          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-blue-500">
                            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Recommended: {game.mlPrediction.recommendation.market.toUpperCase()} - {game.mlPrediction.recommendation.pick.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {game.mlPrediction.recommendation.reasoning}
                            </div>
                          </div>
                        </div>

                        {/* GAME CARD */}
                        <div className="rounded-b-lg overflow-hidden border border-t-0">
                          <ActionStyleGameCard
                            key={game.id}
                            homeTeam={game.homeTeam}
                            awayTeam={game.awayTeam}
                            homeOdds={game.homeOdds}
                            awayOdds={game.awayOdds}
                            spread={game.spread}
                            total={game.total}
                            startTime={game.startTime}
                            gameId={game.id}
                            isAuthenticated={isAuthenticated}
                            rawBookmakers={game.rawBookmakers}
                            sport={selectedSport}
                            mlPrediction={game.mlPrediction}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REGULAR GAMES */}
              {gamesWithoutPredictions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gamesWithPredictions.length > 0 ? 'Additional Games' : 'Live Odds'}
                    </h3>
                    <Badge variant="outline">
                      {gamesWithoutPredictions.length} Games
                    </Badge>
                    {(selectedSport === 'americanfootball_nfl' || selectedSport === 'americanfootball_ncaaf') && gamesWithPredictions.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        AI predictions coming soon
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {gamesWithoutPredictions.map((game) => (
                      <ActionStyleGameCard
                        key={game.id}
                        homeTeam={game.homeTeam}
                        awayTeam={game.awayTeam}
                        homeOdds={game.homeOdds}
                        awayOdds={game.awayOdds}
                        spread={game.spread}
                        total={game.total}
                        startTime={game.startTime}
                        gameId={game.id}
                        isAuthenticated={isAuthenticated}
                        rawBookmakers={game.rawBookmakers}
                        sport={selectedSport}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* NO GAMES MESSAGE */}
              {games.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Live Games
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No games are currently available. Check back later.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ActionStyleDashboard;
