import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, TrendingUp, Target, BarChart3 } from "lucide-react";

// Team strength data - same as in the JSON file
const teamStrengths = {
  "Yankees": 0.72, "Dodgers": 0.70, "Astros": 0.68, "Braves": 0.67,
  "Phillies": 0.65, "Padres": 0.64, "Mets": 0.62, "Orioles": 0.61,
  "Guardians": 0.60, "Brewers": 0.59, "Red Sox": 0.58, "Cardinals": 0.57,
  "Giants": 0.56, "Mariners": 0.55, "Tigers": 0.54, "Cubs": 0.53,
  "Twins": 0.52, "Diamondbacks": 0.51, "Rays": 0.50, "Royals": 0.49,
  "Blue Jays": 0.48, "Rangers": 0.47, "Angels": 0.46, "Pirates": 0.45,
  "Reds": 0.44, "Nationals": 0.43, "Athletics": 0.42, "Marlins": 0.41,
  "Rockies": 0.40, "White Sox": 0.38
};

// Team name variations for better matching
const teamAliases = {
  "new york yankees": "Yankees", "ny yankees": "Yankees", "nyy": "Yankees",
  "los angeles dodgers": "Dodgers", "la dodgers": "Dodgers", "lad": "Dodgers",
  "houston astros": "Astros", "hou": "Astros",
  "atlanta braves": "Braves", "atl": "Braves",
  "philadelphia phillies": "Phillies", "phi": "Phillies",
  "san diego padres": "Padres", "sd": "Padres",
  "new york mets": "Mets", "ny mets": "Mets", "nym": "Mets",
  "baltimore orioles": "Orioles", "bal": "Orioles",
  "cleveland guardians": "Guardians", "cle": "Guardians",
  "milwaukee brewers": "Brewers", "mil": "Brewers",
  "boston red sox": "Red Sox", "bos": "Red Sox",
  "st louis cardinals": "Cardinals", "stl": "Cardinals",
  "san francisco giants": "Giants", "sf": "Giants",
  "seattle mariners": "Mariners", "sea": "Mariners",
  "detroit tigers": "Tigers", "det": "Tigers",
  "chicago cubs": "Cubs", "chc": "Cubs",
  "minnesota twins": "Twins", "min": "Twins",
  "arizona diamondbacks": "Diamondbacks", "ari": "Diamondbacks",
  "tampa bay rays": "Rays", "tb": "Rays",
  "kansas city royals": "Royals", "kc": "Royals",
  "toronto blue jays": "Blue Jays", "tor": "Blue Jays",
  "texas rangers": "Rangers", "tex": "Rangers",
  "los angeles angels": "Angels", "la angels": "Angels", "laa": "Angels",
  "pittsburgh pirates": "Pirates", "pit": "Pirates",
  "cincinnati reds": "Reds", "cin": "Reds",
  "washington nationals": "Nationals", "was": "Nationals",
  "oakland athletics": "Athletics", "oak": "Athletics",
  "miami marlins": "Marlins", "mia": "Marlins",
  "colorado rockies": "Rockies", "col": "Rockies",
  "chicago white sox": "White Sox", "chw": "White Sox"
};

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  prediction?: PredictionResult;
}

interface PredictionResult {
  homeTeam: string;
  awayTeam: string;
  homeWinProbability: number;
  awayWinProbability: number;
  confidence: number;
  recommendedBet: string;
  edge: string;
  analysis: string;
}

function normalizeTeamName(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Direct match in teamStrengths
  const directMatch = Object.keys(teamStrengths).find(
    team => team.toLowerCase() === normalized
  );
  if (directMatch) return directMatch;
  
  // Check aliases
  if (teamAliases[normalized]) {
    return teamAliases[normalized];
  }
  
  // Partial match
  const partialMatch = Object.keys(teamStrengths).find(
    team => team.toLowerCase().includes(normalized) || normalized.includes(team.toLowerCase())
  );
  
  return partialMatch || null;
}

function calculatePrediction(homeTeam: string, awayTeam: string): PredictionResult {
  const homeStrength = teamStrengths[homeTeam] || 0.50;
  const awayStrength = teamStrengths[awayTeam] || 0.50;
  
  // Calculate home win probability with home field advantage
  let homeWinProb = (homeStrength / (homeStrength + awayStrength)) + 0.035;
  
  // Ensure probability is between 0.25 and 0.75
  homeWinProb = Math.max(0.25, Math.min(0.75, homeWinProb));
  
  const awayWinProb = 1 - homeWinProb;
  
  // Calculate confidence
  const confidence = Math.min(0.85, Math.abs(homeWinProb - 0.5) * 1.5 + 0.6);
  
  // Determine recommended bet
  let recommendedBet = 'none';
  if (homeWinProb > 0.55) recommendedBet = 'home';
  else if (awayWinProb > 0.55) recommendedBet = 'away';
  
  // Calculate edge
  const winnerProb = Math.max(homeWinProb, awayWinProb);
  const edge = winnerProb > 0.52 ? `${((winnerProb - 0.52) * 100).toFixed(1)}%` : 'No edge';
  
  // Generate analysis
  const winner = homeWinProb > awayWinProb ? homeTeam : awayTeam;
  const winnerProb_pct = (Math.max(homeWinProb, awayWinProb) * 100).toFixed(1);
  
  let analysis = `${winner} favored with ${winnerProb_pct}% win probability. `;
  
  if (confidence > 0.75) {
    analysis += "High confidence prediction - strong betting opportunity.";
  } else if (confidence > 0.65) {
    analysis += "Moderate confidence - proceed with caution.";
  } else {
    analysis += "Low confidence - close matchup, consider avoiding.";
  }
  
  return {
    homeTeam,
    awayTeam,
    homeWinProbability: homeWinProb,
    awayWinProbability: awayWinProb,
    confidence,
    recommendedBet,
    edge,
    analysis
  };
}

function processMessage(message: string): { response: string; prediction?: PredictionResult } {
  const msg = message.toLowerCase();
  
  // Check for prediction request patterns
  const predictionPatterns = [
    /who.*win.*(\w+).*vs.*(\w+)/,
    /predict.*(\w+).*vs.*(\w+)/,
    /(\w+).*vs.*(\w+).*prediction/,
    /(\w+).*(\w+).*odds/,
    /(\w+).*against.*(\w+)/,
    /(\w+).*at.*(\w+)/,
    /(\w+).*@.*(\w+)/
  ];
  
  for (const pattern of predictionPatterns) {
    const match = msg.match(pattern);
    if (match) {
      const team1 = normalizeTeamName(match[1]);
      const team2 = normalizeTeamName(match[2]);
      
      if (team1 && team2) {
        // Determine home team (second team mentioned is usually home)
        const homeTeam = team2;
        const awayTeam = team1;
        
        const prediction = calculatePrediction(homeTeam, awayTeam);
        
        return {
          response: `Here's my prediction for ${awayTeam} @ ${homeTeam}:`,
          prediction
        };
      } else {
        return {
          response: `I couldn't find one or both teams. Available teams: ${Object.keys(teamStrengths).join(', ')}`
        };
      }
    }
  }
  
  // Handle general questions
  if (msg.includes('team') && msg.includes('strength')) {
    const topTeams = Object.entries(teamStrengths)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([team, strength]) => `${team}: ${(strength * 100).toFixed(1)}%`)
      .join(', ');
    
    return {
      response: `Top 10 team strengths: ${topTeams}`
    };
  }
  
  if (msg.includes('help') || msg.includes('how')) {
    return {
      response: `I can predict any MLB matchup! Try asking:\n• "Who will win Yankees vs Dodgers?"\n• "Predict Astros vs Braves"\n• "Team strength rankings"\n• "Phillies at Mets odds"`
    };
  }
  
  return {
    response: `I can help with MLB predictions! Try asking "Who will win [Team A] vs [Team B]?" or type "help" for more options.`
  };
}

export function PredictionChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your MLB prediction assistant. Ask me about any team matchup like 'Who will win Yankees vs Dodgers?' or 'Predict Astros vs Braves'.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Process the message
    setTimeout(() => {
      const { response, prediction } = processMessage(input.trim());
      
      const botMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date(),
        prediction
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            MLB Prediction Chat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.prediction && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {message.prediction.homeTeam} (Home)
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {(message.prediction.homeWinProbability * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {message.prediction.awayTeam} (Away)
                          </div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {(message.prediction.awayWinProbability * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>Confidence: {(message.prediction.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Edge: {message.prediction.edge}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>Bet: {message.prediction.recommendedBet}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {message.prediction.analysis}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about any MLB matchup..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}