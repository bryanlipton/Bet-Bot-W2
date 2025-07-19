import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActionStyleHeader } from "@/components/ActionStyleHeader";
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

        {/* Mission Statement */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Bet Bot is a data-driven sports betting platform built to deliver accurate, actionable insights.
            </p>
            <br />
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              We use artificial intelligence, machine learning, and real-time data integration to help bettors make smarter decisions—without the need for spreadsheets or hours of research.
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
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Bet Bot provides users with reliable daily picks, odds comparisons from major sportsbooks, and tools to track performance—all powered by official data sources and advanced analytics.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              While sportsbooks rely on vast teams and proprietary models, everyday bettors often rely on instinct. Bet Bot aims to close that gap, giving individuals access to a professional-grade betting assistant.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Daily Picks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Picks are generated every morning at 2 AM EST using models built with 27+ statistical features, including data from Baseball Savant, official MLB APIs, and weather conditions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Odds Comparison</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Real-time odds from leading sportsbooks including DraftKings, FanDuel, Caesars, and BetMGM—refreshed every 15 minutes and linked directly to the bet slip.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Transparent Confidence Grading</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Each pick is assigned a grade from A+ to D, reflecting confidence levels based on six analytical factors such as offensive production, pitching matchup, and market inefficiencies.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Bet Tracking and History</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Log picks, track performance over time, and view detailed metrics like ROI, win rate, and betting trends. Parlay support and unit-based tracking included.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">User Profiles and Community</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optional public profiles with follower systems, privacy controls, and performance visibility allow for connection without compromising data ownership.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Mobile-First Design</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bet Bot is optimized for mobile use, with touch-friendly layouts and responsive grids that adapt to any screen size.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Integrity */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Data Integrity
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All data used by Bet Bot comes from official sources. No simulations, no biased inputs—just verified statistics and real-time game conditions. Picks update automatically as lineups change or games begin.
            </p>
          </CardContent>
        </Card>

        {/* Our Technology Stack */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Our Technology Stack
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Frontend</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Backend</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Node.js</Badge>
                  <Badge variant="outline">Express</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Database</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">PostgreSQL</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Live Features</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">WebSockets</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI/ML</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">TensorFlow.js</Badge>
                </div>
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
                  Bet Bot is intended for informational and educational purposes. Betting carries risk, and past performance does not guarantee future outcomes. Users are encouraged to gamble responsibly.
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