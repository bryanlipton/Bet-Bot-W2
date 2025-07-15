import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const gptFiles = [
  {
    name: "gpt-complete-system.json",
    description: "Main data file with team strengths and prediction algorithms",
    icon: "📊",
    size: "~15KB",
    content: {
      systemInfo: {
        name: "Bet Bot MLB Prediction System",
        version: "2.1",
        lastUpdated: "2025-07-15T19:00:00Z",
        description: "Complete MLB betting analytics system with real-time odds and prediction engine"
      },
      teamStrengths: {
        "Yankees": { "strength": 0.72, "city": "New York", "league": "AL", "division": "East" },
        "Dodgers": { "strength": 0.70, "city": "Los Angeles", "league": "NL", "division": "West" },
        "Astros": { "strength": 0.68, "city": "Houston", "league": "AL", "division": "West" },
        "Braves": { "strength": 0.67, "city": "Atlanta", "league": "NL", "division": "East" },
        "Phillies": { "strength": 0.65, "city": "Philadelphia", "league": "NL", "division": "East" },
        "Padres": { "strength": 0.64, "city": "San Diego", "league": "NL", "division": "West" },
        "Mets": { "strength": 0.62, "city": "New York", "league": "NL", "division": "East" },
        "Orioles": { "strength": 0.61, "city": "Baltimore", "league": "AL", "division": "East" },
        "Guardians": { "strength": 0.60, "city": "Cleveland", "league": "AL", "division": "Central" },
        "Brewers": { "strength": 0.59, "city": "Milwaukee", "league": "NL", "division": "Central" },
        "Red Sox": { "strength": 0.58, "city": "Boston", "league": "AL", "division": "East" },
        "Cardinals": { "strength": 0.57, "city": "St. Louis", "league": "NL", "division": "Central" },
        "Giants": { "strength": 0.56, "city": "San Francisco", "league": "NL", "division": "West" },
        "Mariners": { "strength": 0.55, "city": "Seattle", "league": "AL", "division": "West" },
        "Tigers": { "strength": 0.54, "city": "Detroit", "league": "AL", "division": "Central" },
        "Cubs": { "strength": 0.53, "city": "Chicago", "league": "NL", "division": "Central" },
        "Twins": { "strength": 0.52, "city": "Minnesota", "league": "AL", "division": "Central" },
        "Diamondbacks": { "strength": 0.51, "city": "Arizona", "league": "NL", "division": "West" },
        "Rays": { "strength": 0.50, "city": "Tampa Bay", "league": "AL", "division": "East" },
        "Royals": { "strength": 0.49, "city": "Kansas City", "league": "AL", "division": "Central" },
        "Blue Jays": { "strength": 0.48, "city": "Toronto", "league": "AL", "division": "East" },
        "Rangers": { "strength": 0.47, "city": "Texas", "league": "AL", "division": "West" },
        "Angels": { "strength": 0.46, "city": "Los Angeles", "league": "AL", "division": "West" },
        "Pirates": { "strength": 0.45, "city": "Pittsburgh", "league": "NL", "division": "Central" },
        "Reds": { "strength": 0.44, "city": "Cincinnati", "league": "NL", "division": "Central" },
        "Nationals": { "strength": 0.43, "city": "Washington", "league": "NL", "division": "East" },
        "Athletics": { "strength": 0.42, "city": "Oakland", "league": "AL", "division": "West" },
        "Marlins": { "strength": 0.41, "city": "Miami", "league": "NL", "division": "East" },
        "Rockies": { "strength": 0.40, "city": "Colorado", "league": "NL", "division": "West" },
        "White Sox": { "strength": 0.38, "city": "Chicago", "league": "AL", "division": "Central" }
      },
      predictionEngine: {
        algorithm: "analytics-based",
        homeFieldAdvantage: 0.035,
        confidenceRange: [0.60, 0.85],
        steps: [
          "1. Parse team names from user query",
          "2. Get homeTeam and awayTeam strengths from teamStrengths",
          "3. Calculate: homeWinProb = (homeStrength / (homeStrength + awayStrength)) + 0.035",
          "4. Ensure homeWinProb between 0.25 and 0.75",
          "5. Calculate: awayWinProb = 1 - homeWinProb",
          "6. Calculate: confidence = Math.min(0.85, Math.abs(homeWinProb - 0.5) * 1.5 + 0.6)",
          "7. Determine bet: 'home' if homeWinProb > 0.55, 'away' if awayWinProb > 0.55, else 'none'",
          "8. Calculate edge: if max(homeWinProb, awayWinProb) > 0.52, edge = (maxProb - 0.52) * 100"
        ]
      }
    }
  },
  {
    name: "gpt-instructions.md",
    description: "Instructions for how your Custom GPT should behave",
    icon: "📋",
    size: "~8KB",
    content: `# Custom GPT Instructions for Bet Bot MLB System

## Your Role
You are an expert MLB betting analyst with access to a sophisticated prediction system and live odds data. Provide accurate, data-driven betting recommendations using the Bet Bot prediction engine.

## Core Prediction Formula
When asked about any MLB team matchup:

\`\`\`
homeWinProb = (homeStrength / (homeStrength + awayStrength)) + 0.035
awayWinProb = 1 - homeWinProb
confidence = Math.min(0.85, Math.abs(homeWinProb - 0.5) * 1.5 + 0.6)
\`\`\`

## Response Format
For prediction queries, respond like this:

\`\`\`
🏀 Yankees vs Dodgers Prediction

📊 Win Probabilities:
• Dodgers (Home): 52.8% (strength: 0.70)
• Yankees (Away): 47.2% (strength: 0.72)

🎯 Analysis:
• Confidence: 64.2%
• Recommended Bet: None (too close)
• Edge: 0.8%
• Reasoning: Very close matchup between elite teams.

💰 Betting Recommendation: 
Pass on this game - insufficient edge for profitable betting.
\`\`\`

## Team Recognition
Recognize variations like Yankees, NY Yankees, NYY, etc. All 30 teams available.

## Betting Guidelines
- High Confidence (75%+): Strong recommendation
- Medium (65-75%): Moderate opportunity  
- Low (60-65%): Proceed with caution
- Edge 5%+: Excellent value, 2-5%: Good value, 0-2%: Marginal`
  },
  {
    name: "gpt-test-examples.md",
    description: "Test examples to verify your Custom GPT works correctly",
    icon: "🧪",
    size: "~3KB",
    content: `# Test Your Custom GPT

After uploading files, test with these queries:

**Test 1:** "Who will win Yankees vs Dodgers?"
**Expected:** Dodgers 52.8%, Yankees 47.2%, confidence 64.2%

**Test 2:** "Predict Astros vs White Sox"  
**Expected:** Astros 60.6%, White Sox 39.4%, bet Astros, edge 8.6%

**Test 3:** "Team strength rankings"
**Expected:** Yankees 72%, Dodgers 70%, Astros 68%... White Sox 38%

**Test 4:** "Best value bets today"
**Expected:** Analysis of current games with highest edges

**Test 5:** "How good are the Phillies?"
**Expected:** Phillies 65% strength, 5th ranked team

If these work correctly, your Custom GPT is ready!`
  }
];

export function GPTDownloader() {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const downloadFile = (filename: string, content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Downloaded",
      description: `${filename} has been downloaded to your computer`,
    });
  };

  const copyToClipboard = async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: `${filename} content copied. Create a new file and paste.`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please try downloading the file instead.",
        variant: "destructive",
      });
    }
  };

  const openAllFilesPage = () => {
    window.open('/ALL-GPT-FILES.txt', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Custom GPT Files
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get all the files you need to set up your Custom GPT with complete MLB prediction capabilities
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Action Buttons */}
          <div className="flex gap-3 mb-6">
            <Button onClick={openAllFilesPage} className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View All Files (One Page)
            </Button>
          </div>

          {/* Individual Files */}
          <div className="grid gap-4">
            {gptFiles.map((file, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{file.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {file.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {file.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Size: {file.size}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(
                          typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2),
                          file.name
                        )}
                        className="flex items-center gap-1"
                      >
                        {copiedFile === file.name ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedFile === file.name ? 'Copied!' : 'Copy'}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => downloadFile(
                          file.name,
                          typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2),
                          file.name.endsWith('.json') ? 'application/json' : 'text/markdown'
                        )}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Setup Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                Setup Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Download or copy all 3 files above</li>
                <li>Go to your Custom GPT in ChatGPT</li>
                <li>Upload all files to the Knowledge section</li>
                <li>Test with: "Who will win Yankees vs Dodgers?"</li>
                <li>Should return: Dodgers 52.8%, Yankees 47.2%</li>
              </ol>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">
                Your Custom GPT will then have complete MLB prediction capabilities with all 30 teams!
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}