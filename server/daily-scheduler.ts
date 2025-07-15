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
    
    // Schedule to run every 6 hours (4 times per day)
    this.intervalId = setInterval(() => {
      this.generateDailyContent();
    }, 6 * 60 * 60 * 1000); // 6 hours
    
    console.log(`Article generation scheduled every 6 hours for 4 daily articles with real-time data`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async generateDailyContent() {
    try {
      console.log('🤖 Auto-generating articles with real-time internet data...');
      
      const articles = await this.generator.generateDailyArticles();
      
      console.log(`✅ Auto-generated ${articles.length} articles with live data:`);
      articles.forEach(article => {
        console.log(`   - ${article.title} (${article.articleType})`);
      });
      
      // In production, save articles to database here
      // await this.saveArticlesToDatabase(articles);
      
    } catch (error) {
      console.error('❌ Error auto-generating articles with real-time data:', error);
    }
  }

  // Trigger manual generation
  async generateNow(): Promise<any[]> {
    console.log('🔄 Manual article generation triggered...');
    return await this.generator.generateDailyArticles();
  }
}

export const dailyScheduler = new DailyScheduler();