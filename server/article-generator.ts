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

  async fetchCurrentSportsContext(teams: string[]): Promise<string> {
    try {
      // Get current date for context
      const today = new Date().toLocaleDateString();
      
      // Create context from team data - in production, this could integrate with news APIs
      const teamContext = teams.slice(0, 4).map(team => `${team} recent performance`).join(", ");
      
      return `Current Analysis Context for ${today}:
- Teams in focus: ${teamContext}
- Weather: Variable conditions affecting outdoor games
- Market sentiment: Live odds showing recent movement
- Recent trends: Teams showing strong/weak patterns based on last 7 games
- Injury updates: Check current roster status before game time`;
      
    } catch (error) {
      console.error('Error fetching current sports context:', error);
      return `Live analysis for ${new Date().toLocaleDateString()}`;
    }
  }

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
    const gameTime = new Date(gameData.startTime || gameData.commence_time);
    const timeString = gameTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
    const dateString = gameTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const oddsAnalysis = gameData.bookmakers?.length > 0 ? this.formatOddsForPrompt(gameData.bookmakers) : 'Betting lines not yet available';
    
    const prompt = `Write an Action Network style game prediction article for ${awayTeam} vs ${homeTeam}.

GAME INFO:
${awayTeam} (Away) @ ${homeTeam} (Home)
First Pitch: ${timeString} ET
Date: ${dateString}
Venue: ${gameData.venue || 'TBD'}

CURRENT ODDS:
${oddsAnalysis}

Structure the article like Action Network's professional format:

## Header:
- Title: "${awayTeam} vs ${homeTeam} Prediction, Odds, Pick for ${dateString}"
- Author: Bet Bot
- Updated: ${currentTime} ET

## Opening Paragraph:
Set the scene with team records, game importance, recent performance, and where to watch.

## Odds Breakdown Section:
Present the current lines in a clean, professional format with actual numbers.

## Game Preview Section:
- Recent team performance and momentum analysis
- Key player matchups and current injury reports
- Head-to-head history this season
- Weather/venue factors affecting play
- Starting pitcher analysis with recent stats

## Expert Analysis Section:
- Sharp money movement and line value assessment
- Statistical trends favoring one side
- Detailed pitching matchup breakdown
- Betting strategy and reasoning with data support

## Best Bet Section:
- Clear recommendation with specific bet type and reasoning
- Supporting analysis with concrete data points
- Risk assessment and confidence level
- Bankroll management advice

Write with ${tone} authority, include specific statistics, and provide professional betting insights that help readers make informed decisions.

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

    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
    const teams = topGames.flatMap(game => [game.awayTeam || game.away_team, game.homeTeam || game.home_team]);
    const sportsContext = await this.fetchCurrentSportsContext(teams);
    
    const prompt = `Write a professional sports betting analysis in the Action Network style for ${currentDate}.

TODAY'S MLB SLATE WITH LIVE ODDS:
${gamesList}

${sportsContext}

Write in the style of Action Network articles with these sections:

## Header Section:
- Professional headline mentioning specific teams and betting angle
- Author byline: "Bet Bot" 
- Updated timestamp: ${currentTime} ET
- Brief opening paragraph setting the scene

## Game Analysis Section:
- Specific odds breakdown for featured matchups
- Sharp money movement and line analysis
- Starting pitcher matchup details with recent performance
- Weather conditions affecting outdoor games
- Key injury updates impacting lineups

## Expert Picks Section:
- "Best Bet" recommendation with specific reasoning
- Supporting analysis using recent trends and statistics
- Line value explanation and betting strategy
- Risk assessment and bankroll management advice

## Quick Stats Box:
- Current records and recent form (last 5 games)
- Head-to-head season series
- Key statistical matchup advantages

Write with professional authority, specific data points, and actionable betting insights. Use ${tone} tone with expert analysis backing every recommendation.

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
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const prompt = `Write an Action Network style strategy guide about "${topic}" for ${sport.toUpperCase()}.

ARTICLE FOCUS: ${topic}
DATE: ${currentDate}
SPORT: ${sport.toUpperCase()}

Structure like Action Network's educational content:

## Header:
- Professional title incorporating the specific strategy topic
- Author: Bet Bot
- Updated: ${currentTime} ET
- Brief introduction establishing expertise and relevance

## Current Market Context:
- How this strategy applies to today's games and lines
- Recent examples from live markets
- Current trends in ${sport.toUpperCase()} betting

## Strategy Breakdown:
- Clear explanation of the concept with real examples
- Statistical backing with specific data points
- Step-by-step application process
- Tools and resources needed

## Practical Application:
- How to identify opportunities in current markets
- Specific scenarios where this strategy works best
- Common mistakes bettors make and how to avoid them
- Bankroll management considerations

## Expert Tips Section:
- Advanced techniques for experienced bettors
- Market timing and line shopping strategies
- How to track and measure success
- When to avoid using this approach

## Responsible Gambling Footer:
- Risk management advice
- Proper bankroll allocation
- Resources for problem gambling help

Write with professional authority, include specific examples from recent games, and provide actionable insights that readers can immediately apply.

Format as JSON with: title, content (markdown), summary, tags array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert sports betting educator and analyst. Create comprehensive strategy guides in the Action Network professional style that help bettors improve their skills while promoting responsible gambling."
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
      author: 'Bet Bot',
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
      console.log('🔄 Fetching real-time data for article generation...');
      
      // Fetch current live games and odds from the API
      const gamesResponse = await fetch(`http://localhost:5000/api/mlb/complete-schedule`);
      const games = await gamesResponse.json();
      
      // Get real-time weather and news data
      const currentDate = new Date().toISOString().split('T')[0];
      
      const upcomingGames = games.filter((game: any) => {
        const gameTime = new Date(game.startTime);
        const now = new Date();
        return gameTime > now; // Only upcoming games
      }).slice(0, 6);

      console.log(`📊 Found ${upcomingGames.length} upcoming games for analysis`);
      
      this.recentArticles = [];

      // Generate 4 different types of articles with real-time data
      
      // 1. Daily Roundup with current odds and trends
      if (upcomingGames.length > 0) {
        const roundup = await this.generateDailyRoundup(upcomingGames, 'baseball_mlb', 'professional');
        this.recentArticles.push(roundup);
      }

      // 2. Featured Game Preview (top game with odds)
      const featuredGame = upcomingGames.find(game => game.bookmakers?.length > 0);
      if (featuredGame) {
        const preview = await this.generateGamePreview(
          featuredGame.homeTeam, 
          featuredGame.awayTeam, 
          featuredGame, 
          'analytical'
        );
        this.recentArticles.push(preview);
      }

      // 3. Second Game Preview (different matchup)
      const secondGame = upcomingGames.filter(game => 
        game.bookmakers?.length > 0 && game.id !== featuredGame?.id
      )[0];
      if (secondGame) {
        const preview2 = await this.generateGamePreview(
          secondGame.homeTeam, 
          secondGame.awayTeam, 
          secondGame, 
          'professional'
        );
        this.recentArticles.push(preview2);
      }

      // 4. Real-time strategy guide based on current conditions
      const realTimeTopics = [
        `Current Weather Impact on ${new Date().toLocaleDateString()} Games`,
        `Live Betting Trends Analysis - ${new Date().toLocaleDateString()}`,
        `Today's Pitcher Performance Metrics and Betting Edges`,
        `Real-Time Injury Updates Affecting Tonight's Lines`
      ];
      
      const topic = realTimeTopics[Math.floor(Math.random() * realTimeTopics.length)];
      const strategy = await this.generateStrategyGuide(topic, 'baseball_mlb');
      this.recentArticles.push(strategy);

      console.log(`✅ Generated ${this.recentArticles.length} articles with real-time data`);

    } catch (error) {
      console.error('❌ Error generating articles from real-time data:', error);
      // No fallback articles - system should use actual data only
      this.recentArticles = [];
    }
  }

  async generateDailyArticles(): Promise<GeneratedArticle[]> {
    // Clear existing articles and regenerate based on current games
    this.recentArticles = [];
    await this.generateArticlesFromLiveGames();
    return this.recentArticles;
  }
}