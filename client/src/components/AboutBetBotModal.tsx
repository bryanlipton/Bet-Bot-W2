import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Target, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface AboutBetBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutBetBotModal({ isOpen, onClose }: AboutBetBotModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <img src={betbotLogo} alt="Bet Bot" className="w-12 h-12 rounded-lg" />
            <div>
              <DialogTitle className="text-xl font-bold">Bet Bot</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Sports Betting Intelligence</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* What We Do */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              What We Do
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Bet Bot analyzes real-time sports data using advanced AI to identify the best betting opportunities. 
              We combine machine learning, statistical analysis, and market intelligence to give you an edge.
            </p>
          </div>

          <Separator />

          {/* Key Features */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Key Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Daily AI Picks</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Expertly analyzed betting recommendations updated daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Real-Time Odds</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Live odds from 8+ major sportsbooks with best line detection</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Advanced Analytics</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Deep statistical analysis with 27+ data factors per game</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Authentic Data</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">100% real data from official MLB Stats API and The Odds API</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sports Covered */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Sports Covered</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">MLB Baseball</Badge>
              <Badge variant="secondary" className="text-xs">NFL Football</Badge>
              <Badge variant="secondary" className="text-xs">NBA Basketball</Badge>
              <Badge variant="secondary" className="text-xs">NHL Hockey</Badge>
              <Badge variant="secondary" className="text-xs">NCAA Sports</Badge>
            </div>
          </div>

          <Separator />

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
              <strong>Disclaimer:</strong> Bet Bot provides analysis and insights for entertainment purposes. 
              Sports betting involves risk and should be done responsibly. Only bet what you can afford to lose. 
              Must be 21+ and located in legal jurisdictions.
            </p>
          </div>

          {/* Version Info */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Version 2.0 • Built with ❤️ for sports fans
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}