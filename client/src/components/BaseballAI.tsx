import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Brain, TrendingUp, Target, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ModelInfo {
  modelVersion: string;
  isInitialized: boolean;
  latestTraining: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDataSize: number;
    trainedAt: string;
  } | null;
  featureCount: number;
  features: string[];
}

interface BaseballPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  overProbability: number;
  underProbability: number;
  predictedTotal: number;
  homeSpreadProbability: number;
  awaySpreadProbability: number;
  confidence: number;
}

export default function BaseballAI() {
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [prediction, setPrediction] = useState<BaseballPrediction | null>(null);
  const [homeTeam, setHomeTeam] = useState('New York Yankees');
  const [awayTeam, setAwayTeam] = useState('Boston Red Sox');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/baseball/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Training Complete",
          description: "Baseball AI model has been trained successfully!"
        });
        setModelInfo(data.modelInfo);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "Failed to train model",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam || !gameDate) {
      toast({
        title: "Missing Information",
        description: "Please provide both teams and game date",
        variant: "destructive"
      });
      return;
    }

    setIsPredicting(true);
    try {
      const response = await fetch('/api/baseball/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          gameDate,
          weather: {
            temperature: 75,
            windSpeed: 8,
            humidity: 60,
            condition: 'clear'
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPrediction(data);
        toast({
          title: "Prediction Generated",
          description: `AI prediction for ${homeTeam} vs ${awayTeam} is ready!`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Failed to generate prediction",
        variant: "destructive"
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('/api/baseball/model-info');
      const data = await response.json();
      if (response.ok) {
        setModelInfo(data);
      }
    } catch (error) {
      console.error('Error fetching model info:', error);
    }
  };

  useState(() => {
    fetchModelInfo();
  });

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Baseball AI Model
          </CardTitle>
          <CardDescription>
            Train and use our machine learning model for baseball predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleTrainModel} 
              disabled={isTraining}
              className="flex items-center gap-2"
            >
              {isTraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Training Model...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Train Model
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={fetchModelInfo}
            >
              Refresh Status
            </Button>
          </div>

          {modelInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Model Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={modelInfo.isInitialized ? "default" : "secondary"}>
                    {modelInfo.isInitialized ? "Ready" : "Not Initialized"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    v{modelInfo.modelVersion}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Features</Label>
                <div className="text-sm text-muted-foreground">
                  {modelInfo.featureCount} features including team stats, weather, and matchup history
                </div>
              </div>

              {modelInfo.latestTraining && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model Accuracy</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {(modelInfo.latestTraining.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Training Data Size</Label>
                    <div className="text-lg font-semibold">
                      {modelInfo.latestTraining.trainingDataSize} games
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Precision</Label>
                    <div className="text-sm font-medium">
                      {(modelInfo.latestTraining.precision * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Trained</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(modelInfo.latestTraining.trainedAt).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Generate Prediction
          </CardTitle>
          <CardDescription>
            Get AI-powered predictions for baseball games
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeTeam">Home Team</Label>
              <Input
                id="homeTeam"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="e.g., New York Yankees"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="awayTeam">Away Team</Label>
              <Input
                id="awayTeam"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="e.g., Boston Red Sox"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameDate">Game Date</Label>
              <Input
                id="gameDate"
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handlePredict} 
            disabled={isPredicting || !modelInfo?.isInitialized}
            className="flex items-center gap-2"
          >
            {isPredicting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Generate Prediction
              </>
            )}
          </Button>

          {prediction && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Prediction Results
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Home Win</Label>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatPercentage(prediction.homeWinProbability)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Away Win</Label>
                  <div className="text-lg font-semibold text-red-600">
                    {formatPercentage(prediction.awayWinProbability)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Over</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {formatPercentage(prediction.overProbability)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Under</Label>
                  <div className="text-lg font-semibold text-orange-600">
                    {formatPercentage(prediction.underProbability)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Predicted Total</Label>
                  <div className="text-lg font-semibold">
                    {prediction.predictedTotal.toFixed(1)} runs
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Confidence</Label>
                  <div className="text-lg font-semibold text-purple-600">
                    {formatPercentage(prediction.confidence)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Home Spread</Label>
                  <div className="text-sm font-medium">
                    {formatPercentage(prediction.homeSpreadProbability)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Away Spread</Label>
                  <div className="text-sm font-medium">
                    {formatPercentage(prediction.awaySpreadProbability)}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-background rounded border-l-4 border-l-blue-500">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommendation:</strong> The model predicts {' '}
                  {prediction.homeWinProbability > prediction.awayWinProbability ? homeTeam : awayTeam} {' '}
                  has a higher chance of winning with {' '}
                  {formatPercentage(Math.max(prediction.homeWinProbability, prediction.awayWinProbability))} {' '}
                  probability and {formatPercentage(prediction.confidence)} confidence.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}