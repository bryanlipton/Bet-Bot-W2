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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Bet Bot is a comprehensive sports betting platform that combines artificial intelligence, 
              real-time data analysis, and machine learning to provide intelligent betting insights and recommendations. 
              We democratize access to professional-grade sports analytics, helping users make more informed betting decisions.
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
              Bet Bot analyzes real-time sports data using advanced AI to identify the best betting opportunities. 
              We combine machine learning, statistical analysis, and market intelligence to give you an edge.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Daily Picks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI-generated daily picks with detailed analysis and confidence ratings
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Real-Time Odds</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Live odds comparison across multiple sportsbooks with deep linking
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Performance Tracking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Comprehensive analytics and performance metrics for your bets
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Data Integration</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Integration with official MLB Stats API and The Odds API for authentic data
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Updates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Real-time game monitoring and automatic pick rotation system
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Privacy Controls</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Granular privacy settings for your betting activity and statistics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                How It Works
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Collection</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We continuously gather real-time sports data, including game statistics, weather conditions, 
                    team performance, and betting market movements from official sources.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our machine learning models analyze historical patterns, current form, matchup dynamics, 
                    and market inefficiencies to identify value betting opportunities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    The system generates daily picks with confidence ratings, detailed analysis, 
                    and optimal timing recommendations based on comprehensive data analysis.
                  </p>
                </div>
              </div>
            </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Daily Pick Rotation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated daily picks generated at 2 AM EST with intelligent rotation when games begin
                </p>
              </div>
              
              <div className="text-center p-4">
                <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Live Odds Comparison</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time odds from multiple sportsbooks with direct deep linking to bet slips
                </p>
              </div>
              
              <div className="text-center p-4">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Features</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Instagram/Twitter-style social networking with friend following and public feeds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Technology & Data Sources
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Artificial Intelligence</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Powered by TensorFlow.js machine learning models with 27 advanced features including 
                  Baseball Savant integration, weather analytics, and ballpark factors.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Official Data Sources</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">MLB Stats API</Badge>
                  <Badge variant="secondary">The Odds API</Badge>
                  <Badge variant="secondary">Baseball Savant</Badge>
                  <Badge variant="secondary">Weather Services</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Modern Tech Stack</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">React & TypeScript</Badge>
                  <Badge variant="outline">Node.js & Express</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                  <Badge variant="outline">WebSocket Real-time</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Important Disclaimer
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                  <strong>Responsible Gaming:</strong> Bet Bot provides analysis and insights for educational purposes. 
                  Sports betting involves risk and should be done responsibly. Past performance does not guarantee future results. 
                  Please bet responsibly and within your means. If you have a gambling problem, seek help from appropriate resources.
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