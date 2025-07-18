import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Moon, Sun, BarChart3, TrendingUp, Zap, Info, Target, Brain, Shield, Clock } from "lucide-react";
import { LoginButton } from "@/components/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface ActionStyleHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function ActionStyleHeader({ darkMode, onToggleDarkMode }: ActionStyleHeaderProps) {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
  ];

  return (
    <TooltipProvider>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                // For logged-in users: simple clickable logo that navigates to odds
                <img 
                  src={betbotLogo} 
                  alt="BetBot Logo" 
                  className="w-9 h-9 object-contain cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-150"
                  onClick={() => navigate("/")}
                />
              ) : (
                // For non-logged-in users: no tooltip or popover on logo
                <img 
                  src={betbotLogo} 
                  alt="BetBot Logo" 
                  className="w-9 h-9 object-contain"
                />
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden lg:block">
                AI-powered sports insights, personalized for you
              </p>
            </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationTabs.map((tab) => (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={`font-medium text-sm transition-colors ${
                    tab.active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {tab.name}
                </button>
              </Link>
            ))}
            
            {/* About Bet Bot Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  About Bet Bot
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <img src={betbotLogo} alt="BetBot Logo" className="w-8 h-8 object-contain" />
                    About Bet Bot
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Mission Statement */}
                  <section>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Our Mission
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      At Bet Bot: Sports Genie AI, we empower sports bettors with intelligent, data-driven insights that turn casual wagers into strategic decisions. Our mission is simple: make sports betting smarter, easier, and more profitable through cutting-edge AI analysis.
                    </p>
                  </section>

                  {/* What We Offer */}
                  <section>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      What We Offer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">AI-Powered Analysis</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Advanced machine learning models analyze dozens of factors including weather, field conditions, projected team performance and past team performance.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Real-Time Odds</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Live odds from 8+ major sportsbooks with instant updates and best line detection.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Daily Expert Picks</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Curated daily picks with detailed analysis and confidence grades from A+ to D.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Pick Tracking</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive bet tracking with wager amounts, payouts, and ROI analytics.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* How It Works */}
                  <section>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      How It Works
                    </h3>
                    <ol className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">1</span>
                        <span>Our AI analyzes real-time data from official MLB sources, weather services, and historical performance metrics.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">2</span>
                        <span>Advanced algorithms identify value opportunities and calculate confidence scores for each prediction.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">3</span>
                        <span>You receive daily picks with detailed analysis, optimal sportsbook recommendations, and direct betting links.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">4</span>
                        <span>Track your bets, monitor performance, and refine your strategy with comprehensive analytics.</span>
                      </li>
                    </ol>
                  </section>

                  {/* Data Sources */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Trusted Data Sources
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>• Official MLB Stats API</div>
                      <div>• The Odds API</div>
                      <div>• Baseball Savant (Statcast)</div>
                      <div>• Real-time weather data</div>
                      <div>• Umpire performance metrics</div>
                      <div>• Historical ballpark factors</div>
                    </div>
                  </section>

                  {/* Footer */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Bet Bot • AI-powered sports insights, personalized for you
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDarkMode}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/get-pro">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm">
                    <Zap className="w-4 h-4 mr-1" />
                    Get Pro
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Get Pro Access</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                    <li>-Full access to BET BOT</li>
                    <li>-All genie expert game picks</li>
                    <li>-Daily News Articles</li>
                    <li>-Raffles for pro users</li>
                    <li>-Data analytics of your picks and ROI strategies</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex flex-col items-center">
              <LoginButton />
            </div>
          </div>
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
}