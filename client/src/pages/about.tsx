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
              We're here to level the playing field. While sportsbooks have teams of analysts and massive data resources, 
              most bettors are flying blind. Bet Bot gives you the same analytical edge that professionals use, 
              but in a simple format that saves you hours of research.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Expert Picks, Daily</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Wake up to carefully analyzed picks with clear reasoning - no guesswork required
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Best Odds, Instantly</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compare odds across all major sportsbooks and place bets with one click
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Track Your Success</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See exactly how you're performing and share your wins with the community
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Real Sports Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Everything is based on official MLB statistics - no made-up numbers or biased opinions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Always Fresh</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Picks update automatically as games start, so you never miss an opportunity
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Your Privacy Matters</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose what to share and what to keep private - it's your betting journey
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How You'll Use It */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                How You'll Use It
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Check Your Picks</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Every morning, new picks are waiting for you. Our AI model generates each pick by analyzing 
                    dozens of factors - team stats, pitcher matchups, weather, recent form, and more. Each comes with a clear grade (A+ to D) 
                    and simple explanation of why it's a good bet. No spreadsheets, no complicated math - just the info you need.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Find the Best Odds</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click any pick to see odds from all the major sportsbooks. We'll show you who's offering 
                    the best payout and take you directly to place your bet. More money in your pocket, less time shopping around.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Track and Share</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Log your bets to see your win rate, profit, and hot streaks. Follow other successful bettors 
                    and share your own wins. It's like social media, but for people who actually know sports.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why You'll Love It */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Why You'll Love It
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save Hours Every Day</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No more endless research or second-guessing. Fresh picks every morning at 2 AM, 
                  updated automatically when games change
                </p>
              </div>
              
              <div className="text-center p-4">
                <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Never Miss the Best Odds</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare every major sportsbook instantly and place bets with one click. 
                  More winnings, less hassle
                </p>
              </div>
              
              <div className="text-center p-4">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Join the Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follow successful bettors, share your wins, and learn from others. 
                  Betting is more fun when you're not doing it alone
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