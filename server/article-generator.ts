import OpenAI from "openai";
import { Express } from "express";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ArticleRequest {
  sport: string;
  gameId?: string;
  articleType: 'game-preview' | 'picks-analysis' | 'daily-roundup' | 'strategy-guide';
  tone: 'professional' | 'casual' | 'analytical';
  length: 'short' | 'medium' | 'long';
}

interface GeneratedArticle {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  articleType: string;
  sport: string;
}

export class ArticleGenerator {
  
  async generateGamePreview(homeTeam: string, awayTeam: string, gameData: any, tone: string = 'professional'): Promise<GeneratedArticle> {
    const prompt = `Write a comprehensive sports betting preview article for the upcoming ${awayTeam} vs ${homeTeam} game.

Game Details:
- Home Team: ${homeTeam}
- Away Team: ${awayTeam}
- Start Time: ${gameData.commence_time}
- Venue: ${gameData.venue || 'TBD'}
- Probable Pitchers: ${gameData.probablePitchers ? `Home: ${gameData.probablePitchers.home}, Away: ${gameData.probablePitchers.away}` : 'TBD'}

Current Odds:
${gameData.bookmakers?.length > 0 ? this.formatOddsForPrompt(gameData.bookmakers) : 'Betting lines not yet available'}

Write in a ${tone} tone and include:
1. Team analysis and recent form
2. Head-to-head matchup breakdown
3. Key player spotlight
4. Betting analysis with value picks
5. Final prediction with confidence level

Format as JSON with: title, content (markdown), summary, tags array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert sports analyst and betting writer. Create engaging, informative articles that help readers make informed betting decisions. Always include factual analysis and responsible gambling messaging."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const article = JSON.parse(response.choices[0].message.content);
    
    return {
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'game-preview',
      sport: gameData.sport_key || 'baseball_mlb'
    };
  }

  async generateDailyRoundup(games: any[], sport: string, tone: string = 'professional'): Promise<GeneratedArticle> {
    const gamesWithOdds = games.filter(g => g.bookmakers?.length > 0);
    const topGames = gamesWithOdds.slice(0, 5);

    const prompt = `Write a daily sports betting roundup article for ${sport.toUpperCase()}.

Today's Featured Games:
${topGames.map(game => `
- ${game.away_team} @ ${game.home_team}
  Start: ${new Date(game.commence_time).toLocaleTimeString()}
  Odds: ${this.extractKeyOdds(game)}
`).join('')}

Write in a ${tone} tone and include:
1. Daily betting landscape overview
2. Top 3 value picks with reasoning
3. Games to avoid and why
4. Injury/weather updates affecting lines
5. Responsible gambling reminder

Format as JSON with: title, content (markdown), summary, tags array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are a professional sports betting analyst. Write daily roundups that help bettors identify the best opportunities while promoting responsible gambling."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500
    });

    const article = JSON.parse(response.choices[0].message.content);
    
    return {
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'daily-roundup',
      sport
    };
  }

  async generateStrategyGuide(topic: string, sport: string): Promise<GeneratedArticle> {
    const prompt = `Write an educational betting strategy guide about "${topic}" for ${sport} betting.

Include:
1. Introduction to the concept
2. Step-by-step implementation
3. Real examples from ${sport}
4. Common mistakes to avoid
5. Advanced tips for experienced bettors
6. Risk management advice

Make it educational and actionable. Format as JSON with: title, content (markdown), summary, tags array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert betting educator. Create comprehensive guides that teach sound betting principles and strategies while emphasizing responsible gambling."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000
    });

    const article = JSON.parse(response.choices[0].message.content);
    
    return {
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'strategy-guide',
      sport
    };
  }

  private formatOddsForPrompt(bookmakers: any[]): string {
    const book = bookmakers[0];
    if (!book?.markets) return 'No odds available';
    
    const h2h = book.markets.find(m => m.key === 'h2h');
    const spreads = book.markets.find(m => m.key === 'spreads');
    const totals = book.markets.find(m => m.key === 'totals');
    
    let oddsText = `${book.title}:\n`;
    
    if (h2h?.outcomes) {
      oddsText += `Moneyline: ${h2h.outcomes.map(o => `${o.name} ${o.price > 0 ? '+' : ''}${o.price}`).join(', ')}\n`;
    }
    
    if (spreads?.outcomes) {
      const homeSpread = spreads.outcomes.find(o => o.point);
      if (homeSpread) {
        oddsText += `Spread: ${homeSpread.point > 0 ? '+' : ''}${homeSpread.point}\n`;
      }
    }
    
    if (totals?.outcomes) {
      const total = totals.outcomes.find(o => o.name === 'Over');
      if (total) {
        oddsText += `Total: O/U ${total.point}\n`;
      }
    }
    
    return oddsText;
  }

  private extractKeyOdds(game: any): string {
    if (!game.bookmakers?.length) return 'TBD';
    
    const book = game.bookmakers[0];
    const h2h = book.markets?.find(m => m.key === 'h2h');
    
    if (h2h?.outcomes?.length >= 2) {
      return `${h2h.outcomes[0].name} ${h2h.outcomes[0].price > 0 ? '+' : ''}${h2h.outcomes[0].price}, ${h2h.outcomes[1].name} ${h2h.outcomes[1].price > 0 ? '+' : ''}${h2h.outcomes[1].price}`;
    }
    
    return 'Lines pending';
  }
}

export function registerArticleRoutes(app: Express) {
  const generator = new ArticleGenerator();

  // Generate game preview article
  app.post('/api/articles/game-preview', async (req, res) => {
    try {
      const { gameId, tone = 'professional' } = req.body;
      
      // Fetch game data
      const gamesResponse = await fetch(`http://localhost:5000/api/mlb/complete-schedule`);
      const games = await gamesResponse.json();
      const game = games.find(g => g.id === gameId || g.gameId === gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      const article = await generator.generateGamePreview(
        game.home_team,
        game.away_team,
        game,
        tone
      );
      
      res.json(article);
    } catch (error) {
      console.error('Error generating game preview:', error);
      res.status(500).json({ 
        error: 'Failed to generate article',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate daily roundup
  app.post('/api/articles/daily-roundup', async (req, res) => {
    try {
      const { sport = 'baseball_mlb', tone = 'professional' } = req.body;
      
      // Fetch today's games
      const gamesResponse = await fetch(`http://localhost:5000/api/mlb/complete-schedule`);
      const games = await gamesResponse.json();
      
      const article = await generator.generateDailyRoundup(games, sport, tone);
      
      res.json(article);
    } catch (error) {
      console.error('Error generating daily roundup:', error);
      res.status(500).json({ 
        error: 'Failed to generate article',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate strategy guide
  app.post('/api/articles/strategy-guide', async (req, res) => {
    try {
      const { topic, sport = 'baseball_mlb' } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const article = await generator.generateStrategyGuide(topic, sport);
      
      res.json(article);
    } catch (error) {
      console.error('Error generating strategy guide:', error);
      res.status(500).json({ 
        error: 'Failed to generate article',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get predefined article topics
  app.get('/api/articles/topics/:sport', (req, res) => {
    const { sport } = req.params;
    
    const topics = {
      baseball_mlb: [
        "Pitcher vs Batter Matchup Analysis",
        "Weather Impact on Baseball Betting",
        "Understanding Run Line Betting",
        "Bullpen Strength Analysis",
        "Home Field Advantage in MLB",
        "Betting Totals (Over/Under) Strategy",
        "Live Betting MLB Games",
        "Playoff Baseball Betting Differences"
      ],
      americanfootball_nfl: [
        "Understanding Point Spreads",
        "Moneyline vs Spread Betting",
        "Weather's Impact on NFL Games", 
        "Divisional Game Betting Strategy",
        "Prime Time Game Factors",
        "Injury Report Analysis",
        "Road Team Psychology",
        "Season-Long Trends to Track"
      ],
      basketball_nba: [
        "Back-to-Back Game Analysis",
        "Home Court Advantage Factors",
        "Player Prop Betting Strategy",
        "Pace of Play Impact",
        "Rest vs Rust Analysis",
        "Playoff Basketball Betting",
        "Live Betting NBA Strategy",
        "Understanding Team Totals"
      ]
    };
    
    res.json(topics[sport] || []);
  });
}