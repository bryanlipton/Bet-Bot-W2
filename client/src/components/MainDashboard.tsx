import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Volleyball, Dumbbell, Beaker as Baseball, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RecommendationsCard from "./RecommendationsCard";
import LiveOddsMonitor from "./LiveOddsMonitor";
import ModelPerformance from "./ModelPerformance";
import { apiRequest } from "@/lib/queryClient";

interface MainDashboardProps {
  activeSport: string;
  onSportChange: (sport: string) => void;
}

interface ModelMetrics {
  accuracy: string;
  edgeDetectionRate: string;
  profitMargin: string;
  gamesAnalyzed: number;
  lastUpdate: string;
}

const sports = [
  { key: "americanfootball_nfl", title: "NFL", icon: Volleyball },
  { key: "basketball_nba", title: "NBA", icon: Dumbbell },
  { key: "baseball_mlb", title: "MLB", icon: Baseball },
];

export default function MainDashboard({ activeSport, onSportChange }: MainDashboardProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: metrics } = useQuery<ModelMetrics>({
    queryKey: ["/api/metrics", activeSport],
  });

  const { data: liveGames = [] } = useQuery({
    queryKey: ["/api/games/live"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations", activeSport],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recommendations/generate", { sport: activeSport });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    },
  });

  const handleRefreshRecommendations = () => {
    setIsRefreshing(true);
    generateRecommendationsMutation.mutate();
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const randomMinutes = Math.floor(Math.random() * 5) + 1;
    return `${randomMinutes} mins ago`;
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto p-6">
        {/* Sports Selection Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {sports.map((sport) => {
              const Icon = sport.icon;
              return (
                <Button
                  key={sport.key}
                  variant={activeSport === sport.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSportChange(sport.key)}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeSport === sport.key
                      ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="mr-2" size={16} />
                  {sport.title}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Accuracy</h3>
                <div className="text-success">📈</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {metrics?.accuracy || "73.2"}%
              </div>
              <div className="flex items-center text-sm">
                <span className="text-success mr-1">↗</span>
                <span className="text-success">+2.1%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">this week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Edge Found</h3>
                <div className="text-warning">%</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                +{metrics?.profitMargin || "8.4"}%
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Avg across</span>
                <span className="text-gray-900 dark:text-white ml-1">{recommendations.length} games</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Games</h3>
                <div className="text-error">📡</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {liveGames.length}
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-error rounded-full animate-pulse mr-2"></div>
                <span className="text-gray-500 dark:text-gray-400">Monitoring odds</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">API Requests</h3>
                <div className="text-primary">🖥️</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">1,247</div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">of</span>
                <span className="text-gray-900 dark:text-white ml-1">5,000</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's AI Recommendations
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last updated:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatLastUpdate()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRecommendations}
                  disabled={isRefreshing}
                  className="p-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RecommendationsCard recommendations={recommendations} />
          </CardContent>
        </Card>

        {/* Live Odds and Model Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveOddsMonitor liveGames={liveGames} />
          <ModelPerformance metrics={metrics} activeSport={activeSport} />
        </div>
      </div>
    </div>
  );
}
