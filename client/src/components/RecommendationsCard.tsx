import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Recommendation {
  id: number;
  gameId: number;
  market: string;
  bet: string;
  edge: string;
  confidence: string;
  modelProbability: string;
  impliedProbability: string;
  bestOdds: string;
  bookmaker: string;
  status: string;
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

export default function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const getConfidenceLevel = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return { label: "HIGH CONFIDENCE", color: "bg-success" };
    if (conf >= 65) return { label: "MEDIUM CONFIDENCE", color: "bg-warning" };
    return { label: "LOW CONFIDENCE", color: "bg-gray-500" };
  };

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return "text-success";
    if (conf >= 65) return "text-warning";
    return "text-gray-500";
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-2">No recommendations available</div>
        <div className="text-sm text-gray-400 dark:text-gray-500">
          Check back later for AI-generated betting recommendations
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.slice(0, 3).map((rec) => {
        const confidenceLevel = getConfidenceLevel(rec.confidence);
        const confidenceColor = getConfidenceColor(rec.confidence);
        const edge = parseFloat(rec.edge);
        
        return (
          <div
            key={rec.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              edge >= 10
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : edge >= 7
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Badge className={`${confidenceLevel.color} text-white text-xs font-medium`}>
                  {confidenceLevel.label}
                </Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Game #{rec.gameId}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {rec.bet} ({rec.market})
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className={`font-medium ${
                  edge >= 10 ? "text-success" : edge >= 7 ? "text-warning" : "text-primary"
                }`}>
                  +{rec.edge}% Edge
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Model: {rec.modelProbability}% | Implied: {rec.impliedProbability}%
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Best Odds: {rec.bestOdds} ({rec.bookmaker})
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className={`text-lg font-bold ${confidenceColor}`}>
                  {rec.confidence}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Confidence</div>
              </div>
              <Button
                size="sm"
                className={`text-sm font-medium ${
                  edge >= 10
                    ? "bg-success hover:bg-green-600"
                    : edge >= 7
                    ? "bg-warning hover:bg-orange-600"
                    : "bg-primary hover:bg-blue-700"
                }`}
              >
                View Details
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
