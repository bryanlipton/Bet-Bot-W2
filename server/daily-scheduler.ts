import { ExtendedArticleGenerator } from "./article-generator";

class DailyScheduler {
  private generator: ExtendedArticleGenerator;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.generator = new ExtendedArticleGenerator();
  }

  start() {
    // Run immediately on startup
    this.generateDailyContent();
    
    // Schedule to run every 24 hours at 6 AM
    const now = new Date();
    const tomorrow6AM = new Date();
    tomorrow6AM.setDate(now.getDate() + 1);
    tomorrow6AM.setHours(6, 0, 0, 0);
    
    const timeUntilNext = tomorrow6AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateDailyContent();
      
      // Then run every 24 hours
      this.intervalId = setInterval(() => {
        this.generateDailyContent();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, timeUntilNext);
    
    console.log(`Daily article generation scheduled. Next run: ${tomorrow6AM.toLocaleString()}`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async generateDailyContent() {
    try {
      console.log('🤖 Generating daily articles...');
      
      const articles = await this.generator.generateDailyArticles();
      
      console.log(`✅ Generated ${articles.length} daily articles:`);
      articles.forEach(article => {
        console.log(`   - ${article.title} (${article.articleType})`);
      });
      
      // In production, save articles to database here
      // await this.saveArticlesToDatabase(articles);
      
    } catch (error) {
      console.error('❌ Error generating daily articles:', error);
    }
  }

  // Trigger manual generation
  async generateNow(): Promise<any[]> {
    console.log('🔄 Manual article generation triggered...');
    return await this.generator.generateDailyArticles();
  }
}

export const dailyScheduler = new DailyScheduler();