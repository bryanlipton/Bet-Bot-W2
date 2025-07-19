import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Brain, Database, Shield, Target, Zap } from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface AboutBetBotProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutBetBot({ open, onClose }: AboutBetBotProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <img src={betbotLogo} alt="Bet Bot" className="w-8 h-8" />
            About Bet Bot
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Information about Bet Bot, an AI-powered sports betting intelligence platform with machine learning analysis and real-time data.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              AI-Powered Sports Betting Intelligence
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bet Bot is a comprehensive sports betting platform that combines artificial intelligence, 
              real-time data analysis, and machine learning to provide intelligent betting insights and recommendations.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">AI Analysis</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced machine learning models analyze 27+ factors including team stats, weather, and ballpark conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Real Data</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  100% authentic data from official MLB Stats API and The Odds API - no simulated or synthetic data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Live Odds</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time odds from 8+ major sportsbooks with intelligent edge detection and value identification.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Smart Picks</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Daily free picks and premium lock picks with detailed analysis and confidence scoring.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Data Collection</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time gathering of team statistics, player performance, weather conditions, and betting odds.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">AI Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Machine learning models process data through advanced algorithms to identify betting value.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Smart Recommendations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate graded picks with detailed reasoning and confidence scores for informed betting decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Trusted Data Sources
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">MLB Stats API</h4>
                <p className="text-gray-600 dark:text-gray-400">Official baseball statistics and game data</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">The Odds API</h4>
                <p className="text-gray-600 dark:text-gray-400">Live betting odds from major sportsbooks</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Baseball Savant</h4>
                <p className="text-gray-600 dark:text-gray-400">Advanced Statcast metrics and analytics</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Weather APIs</h4>
                <p className="text-gray-600 dark:text-gray-400">Real-time stadium weather conditions</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Disclaimer:</strong> Bet Bot provides analysis and insights for educational purposes. 
              Sports betting involves risk and should be done responsibly. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}