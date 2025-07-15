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
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  articleType: string;
  sport: string;
  thumbnail: string;
  author: string;
  readTime: number;
  featured: boolean;
}

export class ArticleGenerator {

  async generateThumbnail(title: string, sport: string, articleType: string): Promise<string> {
    try {
      const prompt = this.createThumbnailPrompt(title, sport, articleType);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return a fallback SVG thumbnail
      return this.generateSVGThumbnail(title, sport, articleType);
    }
  }

  private createThumbnailPrompt(title: string, sport: string, articleType: string): string {
    const sportMap = {
      'baseball_mlb': 'baseball',
      'americanfootball_nfl': 'NFL football', 
      'basketball_nba': 'basketball'
    };

    const typeMap = {
      'game-preview': 'game preview with team matchup',
      'daily-roundup': 'daily betting roundup with multiple games',
      'strategy-guide': 'educational betting strategy guide',
      'picks-analysis': 'expert picks analysis'
    };

    return `Create a professional sports betting article thumbnail for "${title}". 
    
    Style: Modern, clean, Action Network inspired design
    Sport: ${sportMap[sport] || sport}
    Content: ${typeMap[articleType] || articleType}
    
    Include: Sports elements, betting odds graphics, professional typography, team colors if applicable
    Avoid: Gambling imagery, casino elements, inappropriate content
    Quality: High-resolution, magazine-style layout`;
  }

  private generateSVGThumbnail(title: string, sport: string, articleType: string): string {
    const sportColors = {
      'baseball_mlb': { primary: '#003087', secondary: '#C8102E' },
      'americanfootball_nfl': { primary: '#013369', secondary: '#D50A0A' },
      'basketball_nba': { primary: '#C8102E', secondary: '#1D428A' }
    };

    const colors = sportColors[sport] || { primary: '#1f2937', secondary: '#3b82f6' };
    
    const svg = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <rect x="20" y="20" width="360" height="260" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
        <text x="200" y="80" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
          ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}
        </text>
        <text x="200" y="120" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white" opacity="0.8">
          ${sport.toUpperCase().replace('_', ' ')}
        </text>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="white" opacity="0.6">
          BET BOT ANALYSIS
        </text>
      </svg>
    `).toString('base64')}`;
    
    return svg;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private generateArticleId(): string {
    return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
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
    const thumbnail = await this.generateThumbnail(article.title, gameData.sport_key || 'baseball_mlb', 'game-preview');
    
    return {
      id: this.generateArticleId(),
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'game-preview',
      sport: gameData.sport_key || 'baseball_mlb',
      thumbnail,
      author: 'Bet Bot AI',
      readTime: this.calculateReadTime(article.content),
      featured: false
    };
  }

  async generateDailyRoundup(games: any[], sport: string, tone: string = 'professional'): Promise<GeneratedArticle> {
    // Filter for upcoming games only
    const now = new Date();
    const upcomingGames = games.filter(game => {
      const gameTime = new Date(game.startTime || game.commence_time);
      return gameTime > now;
    });

    const gamesWithOdds = upcomingGames.filter(g => g.bookmakers?.length > 0);
    const topGames = gamesWithOdds.slice(0, 6);

    const gamesList = topGames.map(game => {
      const gameTime = new Date(game.startTime || game.commence_time);
      const timeString = gameTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
      
      return `- ${game.awayTeam || game.away_team} @ ${game.homeTeam || game.home_team}
  Start: ${timeString} ET
  Odds: ${this.extractKeyOdds(game)}`;
    }).join('\n');

    const prompt = `Write a daily sports betting roundup article for today's upcoming ${sport.toUpperCase()} games.

TODAY'S UPCOMING GAMES:
${gamesList}

Write in a ${tone} tone and include:
1. Analysis of today's betting landscape
2. Top 3 value picks from these specific games with detailed reasoning
3. Key pitching matchups affecting the lines
4. Games to approach with caution and why
5. Weather or injury updates that could impact outcomes
6. Specific bet recommendations with reasoning

Focus on these actual games happening today. Be specific about which teams and what bets you recommend.

Format as JSON with: title, content (markdown), summary, tags array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are a professional sports betting analyst. Write daily roundups analyzing specific upcoming games, helping bettors identify the best opportunities while promoting responsible gambling."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500
    });

    const article = JSON.parse(response.choices[0].message.content);
    const thumbnail = await this.generateThumbnail(article.title, sport, 'daily-roundup');
    
    return {
      id: this.generateArticleId(),
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'daily-roundup',
      sport,
      thumbnail,
      author: 'Bet Bot',
      readTime: this.calculateReadTime(article.content),
      featured: true
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
    const thumbnail = await this.generateThumbnail(article.title, sport, 'strategy-guide');
    
    return {
      id: this.generateArticleId(),
      ...article,
      publishedAt: new Date().toISOString(),
      articleType: 'strategy-guide',
      sport,
      thumbnail,
      author: 'Bet Bot AI',
      readTime: this.calculateReadTime(article.content),
      featured: false
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
  const generator = new ExtendedArticleGenerator();

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

  // Get all articles
  app.get('/api/articles', async (req, res) => {
    try {
      const { sport, type, limit = 10 } = req.query;
      
      // For now, return mock articles - in production, fetch from database
      const articles = await generator.getMockArticles(sport as string, type as string, parseInt(limit as string));
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  // Generate daily articles automatically
  app.post('/api/articles/generate-daily', async (req, res) => {
    try {
      const articles = await generator.generateDailyArticles();
      res.json({ 
        message: `Generated ${articles.length} daily articles`,
        articles: articles.map(a => ({ id: a.id, title: a.title, type: a.articleType }))
      });
    } catch (error) {
      console.error('Error generating daily articles:', error);
      res.status(500).json({ error: 'Failed to generate daily articles' });
    }
  });
}

// Add these methods to ArticleGenerator class
export class ExtendedArticleGenerator extends ArticleGenerator {
  
  private recentArticles: GeneratedArticle[] = [];

  async getMockArticles(sport?: string, type?: string, limit: number = 10): Promise<GeneratedArticle[]> {
    // Return recently generated articles or generate new ones based on live games
    if (this.recentArticles.length === 0) {
      await this.generateArticlesFromLiveGames();
    }

    let filtered = this.recentArticles;
    
    if (sport) {
      filtered = filtered.filter(a => a.sport === sport);
    }
    
    if (type) {
      filtered = filtered.filter(a => a.articleType === type);
    }
    
    return filtered.slice(0, limit);
  }

  async generateArticlesFromLiveGames(): Promise<void> {
    try {
      // Fetch current live games from the API
      const gamesResponse = await fetch(`http://localhost:5000/api/mlb/complete-schedule`);
      const games = await gamesResponse.json();
      
      const upcomingGames = games.filter((game: any) => {
        const gameTime = new Date(game.startTime);
        const now = new Date();
        return gameTime > now; // Only upcoming games
      }).slice(0, 4); // Limit to top 4 games

      this.recentArticles = [];

      // Generate game preview articles for top upcoming games
      for (const game of upcomingGames.slice(0, 2)) {
        if (game.homeTeam && game.awayTeam) {
          const preview = await this.generateGamePreview(
            game.homeTeam, 
            game.awayTeam, 
            game, 
            'professional'
          );
          this.recentArticles.push(preview);
        }
      }

      // Generate daily roundup with all upcoming games
      if (upcomingGames.length > 0) {
        const roundup = await this.generateDailyRoundup(upcomingGames, 'baseball_mlb', 'professional');
        this.recentArticles.push(roundup);
      }

      // Generate strategy guide
      const strategyTopics = [
        "Analyzing Pitcher Matchups in Today's Games",
        "Weather Impact on Today's MLB Slate",
        "Bullpen Usage Trends for Active Teams"
      ];
      
      const topic = strategyTopics[Math.floor(Math.random() * strategyTopics.length)];
      const strategy = await this.generateStrategyGuide(topic, 'baseball_mlb');
      this.recentArticles.push(strategy);

    } catch (error) {
      console.error('Error generating articles from live games:', error);
      // Fallback to simple articles if API fails
      this.recentArticles = [{
        id: 'fallback_1',
        title: 'Loading Today\'s Game Analysis...',
        content: '# Analysis Loading\n\nGenerating content based on upcoming games...',
        summary: 'AI analysis of today\'s games is being generated.',
        tags: ['MLB', 'Loading'],
        publishedAt: new Date().toISOString(),
        articleType: 'daily-roundup',
        sport: 'baseball_mlb',
        thumbnail: this.generateSVGThumbnail('Loading Analysis', 'baseball_mlb', 'daily-roundup'),
        author: 'Bet Bot',
        readTime: 2,
        featured: false
      }];
    }
  }

  async generateDailyArticles(): Promise<GeneratedArticle[]> {
    // Clear existing articles and regenerate based on current games
    this.recentArticles = [];
    await this.generateArticlesFromLiveGames();
    return this.recentArticles;
  }
}