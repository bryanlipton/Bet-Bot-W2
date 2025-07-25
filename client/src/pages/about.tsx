import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { 
  TrendingUp, 
  Brain, 
  Database, 
  Shield, 
  Target, 
  Zap, 
  BarChart3,
  Clock,
  Info
} from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

export default function AboutPage() {
  const [darkMode, setDarkMode] = useState(true);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <ActionStyleHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <div className="flex justify-center mb-6">
            <img src={betbotLogo} alt="Bet Bot" className="w-24 h-24 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            About Bet Bot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            AI-Powered Sports Betting Intelligence Platform
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Bet Bot is a machine learning-powered sports betting platform built to deliver accurate, actionable insights.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              We combine advanced statistical models, real-time data sources, and clean user tools to help bettors make informed decisions across every stage of the betting process.
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                What We Do
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bet Bot levels the playing field between bettors and sportsbooks by providing access to the kind of data and analysis typically reserved for professionals. From predictive picks to transparent performance tracking, we help users bet smarter with tools designed for clarity, not clutter.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Key Features
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Machine Learning-Driven Picks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bet recommendations are generated daily by a proprietary machine learning model built in TensorFlow.js. It analyzes over 27 input features including team statistics, pitching matchups, park effects, umpire data, and weather conditions to identify profitable betting opportunities.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Odds Comparison</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Instantly view odds from major U.S. sportsbooks including FanDuel, DraftKings, Caesars, and BetMGM with deep links to place bets directly.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Confidence Grading</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Every pick is scored from A+ to D based on six core evaluation metrics such as offensive efficiency, pitching matchups, and market inefficiencies. This helps users quickly understand where value may exist.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Performance Tracking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Users can log bets, monitor outcomes, analyze ROI and win rates, and build or track parlays. The system supports configurable units and automatic status grading.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Profile and Community Tools</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create a profile, follow other users, and view public betting activity with full control over privacy settings and data visibility.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Designed for Any Platform</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Whether you're using a mobile phone, tablet, or desktop, Bet Bot offers a consistent and intuitive experience across all devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data and Technology */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Data and Technology
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              All insights are powered by real-time, verified data from trusted sources including the MLB Stats API, Baseball Savant, and national weather services. Picks and odds update dynamically as games progress and new data becomes available.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tech Stack</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">React, TypeScript, Node.js, PostgreSQL, WebSockets</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Infrastructure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custom TensorFlow.js model with continuous learning and validation</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Security</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Secure OAuth login, session management, and user data isolation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsible Use */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Responsible Use
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                  Bet Bot is built for informed, responsible engagement with sports betting. All tools are provided for educational and entertainment purposes. Please bet within your means and consult responsible gaming resources if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


      </main>
      
      <Footer />
    </div>
  );
}