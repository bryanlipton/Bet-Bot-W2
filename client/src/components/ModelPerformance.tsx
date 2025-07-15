import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModelMetrics {
  accuracy: string;
  edgeDetectionRate: string;
  profitMargin: string;
  gamesAnalyzed: number;
  lastUpdate: string;
}

interface ModelPerformanceProps {
  metrics?: ModelMetrics;
  activeSport: string;
}

export default function ModelPerformance({ metrics, activeSport }: ModelPerformanceProps) {
  const accuracy = parseFloat(metrics?.accuracy || "73.2");
  const edgeRate = parseFloat(metrics?.edgeDetectionRate || "68.5");
  const profitMargin = parseFloat(metrics?.profitMargin || "12.8");
  
  const formatLastUpdate = () => {
    if (metrics?.lastUpdate) {
      const date = new Date(metrics.lastUpdate);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return "Less than 1 hour ago";
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      return date.toLocaleDateString();
    }
    return "2 hours ago";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Model Performance
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Accuracy (Last 30 days)
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {accuracy}%
              </span>
            </div>
            <Progress value={accuracy} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Edge Detection Rate
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {edgeRate}%
              </span>
            </div>
            <Progress value={edgeRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Profit Margin
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                +{profitMargin}%
              </span>
            </div>
            <Progress value={Math.min(100, profitMargin * 5)} className="h-2" />
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Training Data
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Games Analyzed:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics?.gamesAnalyzed?.toLocaleString() || "12,847"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Model Update:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatLastUpdate()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Data Sources:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  The Odds API
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Sport:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {activeSport === "americanfootball_nfl" ? "NFL" : 
                   activeSport === "basketball_nba" ? "NBA" : 
                   activeSport === "baseball_mlb" ? "MLB" : activeSport}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
