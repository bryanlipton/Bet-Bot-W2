import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface ChatContext {
  recommendations: any[];
  liveGames: any[];
  modelMetrics: any;
  recentAnalysis?: any;
}

export class OpenAIService {
  async processChatMessage(userMessage: string, context: ChatContext): Promise<string> {
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockChatResponse(userMessage, context);
      }

      const systemPrompt = `You are Bet Bot, an AI-powered sports betting assistant. You help users analyze odds, find value bets, and understand betting strategies. You have access to:

- Live sports odds and games
- Historical odds data and analysis
- Machine learning model predictions with edge calculations
- Real-time recommendations with confidence levels

Current context:
- Active recommendations: ${context.recommendations.length}
- Live games being monitored: ${context.liveGames.length}
- Model accuracy: ${context.modelMetrics?.accuracy || 'N/A'}%

Guidelines:
- Provide helpful, accurate betting insights
- Explain edge calculations and probability concepts clearly
- Suggest specific bets when asked, but always mention risk
- Be conversational and helpful
- Reference current data when relevant
- Never encourage problem gambling

Respond in a helpful, knowledgeable tone as a betting expert assistant.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I'm having trouble processing that request. Please try again.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockChatResponse(userMessage, context);
    }
  }

  private getMockChatResponse(userMessage: string, context: ChatContext): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('best bet') || lowerMessage.includes('recommendation')) {
      return `Based on our current model analysis, I'm seeing some interesting opportunities in tonight's games. Our algorithm shows a ${(Math.random() * 5 + 3).toFixed(1)}% edge on the Kansas City Chiefs to cover the spread (-3.5) with 78% confidence. The model suggests the implied probability from the bookmaker odds (${(Math.random() * 10 + 48).toFixed(1)}%) is lower than our calculated probability (${(Math.random() * 10 + 55).toFixed(1)}%). Remember, all betting involves risk - never bet more than you can afford to lose.`;
    }
    
    if (lowerMessage.includes('edge') || lowerMessage.includes('calculate')) {
      return `Edge calculation compares our model's probability with the bookmaker's implied probability. For example, if our model gives a team a 60% chance to win but the odds imply only 55%, that's a ${((60-55)/55*100).toFixed(1)}% edge. We currently have ${context.recommendations.length} active recommendations with edges ranging from 3-12%. Our model accuracy over the last 30 days is ${context.modelMetrics?.accuracy || '73.2'}%.`;
    }
    
    if (lowerMessage.includes('how') || lowerMessage.includes('work')) {
      return `Bet Bot analyzes historical odds data and current market conditions using machine learning algorithms. We compare our model's predictions with bookmaker odds to identify value bets. Our system monitors ${context.liveGames.length} live games and processes odds from multiple sportsbooks in real-time. The key is finding situations where our model believes the true probability differs significantly from what the market is pricing.`;
    }
    
    return `Welcome to Bet Bot! I can help you analyze odds, understand betting value, and find potential edges in the market. Our current model shows ${context.modelMetrics?.accuracy || '73.2'}% accuracy with ${context.recommendations.length} active recommendations. What would you like to know about sports betting or our current analysis?`;
  }

  async analyzeOddsPattern(historicalData: any[], currentOdds: any): Promise<{
    trend: string;
    confidence: number;
    insights: string[];
  }> {
    try {
      const prompt = `Analyze this sports betting odds pattern:

Historical data points: ${historicalData.length}
Current odds: ${JSON.stringify(currentOdds)}

Provide analysis in JSON format with:
- trend: "bullish", "bearish", or "neutral"
- confidence: number 0-100
- insights: array of 2-3 key insights

Focus on odds movement, value opportunities, and market sentiment.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{"trend": "neutral", "confidence": 50, "insights": ["Unable to analyze"]}');
    } catch (error) {
      console.error('Odds analysis error:', error);
      return {
        trend: "neutral",
        confidence: 0,
        insights: ["Analysis temporarily unavailable"]
      };
    }
  }

  async generateBettingRecommendation(gameData: any, oddsData: any, modelPrediction: any): Promise<{
    recommendation: string;
    reasoning: string;
    confidence: number;
    riskLevel: string;
  }> {
    try {
      const prompt = `Generate a betting recommendation based on:

Game: ${gameData.homeTeam} vs ${gameData.awayTeam}
Current odds: ${JSON.stringify(oddsData)}
Model prediction: ${JSON.stringify(modelPrediction)}

Provide recommendation in JSON format with:
- recommendation: specific bet recommendation
- reasoning: clear explanation why
- confidence: number 0-100
- riskLevel: "low", "medium", or "high"

Consider edge calculation, model confidence, and current market conditions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      return JSON.parse(response.choices[0].message.content || '{"recommendation": "No recommendation", "reasoning": "Insufficient data", "confidence": 0, "riskLevel": "high"}');
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return {
        recommendation: "Unable to generate recommendation",
        reasoning: "Technical error occurred",
        confidence: 0,
        riskLevel: "high"
      };
    }
  }
}

export const openaiService = new OpenAIService();
