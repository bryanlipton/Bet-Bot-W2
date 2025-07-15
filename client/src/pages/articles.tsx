import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleModal } from "@/components/ArticleModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, RefreshCw, Newspaper, BookOpen, TrendingUp, Calendar } from "lucide-react";

interface Article {
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

export default function ArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: articles = [], isLoading, refetch } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: topics = [] } = useQuery<string[]>({
    queryKey: ['/api/articles/topics/baseball_mlb'],
  });

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleGenerateDaily = async () => {
    try {
      const response = await fetch('/api/articles/generate-daily', { method: 'POST' });
      const result = await response.json();
      console.log('Generated articles:', result);
      refetch(); // Refresh the articles list
    } catch (error) {
      console.error('Error generating articles:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (activeTab === "all") return true;
    return article.articleType === activeTab;
  });

  const featuredArticles = articles.filter(article => article.featured);

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'game-preview': return <TrendingUp className="w-4 h-4" />;
      case 'daily-roundup': return <Calendar className="w-4 h-4" />;
      case 'strategy-guide': return <BookOpen className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Betting Analysis Articles
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              AI-generated insights, predictions, and strategy guides
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={handleGenerateDaily}
              size="sm"
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Generate New
            </Button>
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-yellow-500 text-black">Featured</Badge>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today's Top Picks
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.slice(0, 2).map((article) => (
                <ArticleCard
                  key={article.id}
                  {...article}
                  onClick={() => handleArticleClick(article)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Article Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              All Articles
            </TabsTrigger>
            <TabsTrigger value="game-preview" className="flex items-center gap-2">
              {getTabIcon('game-preview')}
              Previews
            </TabsTrigger>
            <TabsTrigger value="daily-roundup" className="flex items-center gap-2">
              {getTabIcon('daily-roundup')}
              Daily Picks
            </TabsTrigger>
            <TabsTrigger value="strategy-guide" className="flex items-center gap-2">
              {getTabIcon('strategy-guide')}
              Strategy
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No articles yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Generate your first AI-powered betting analysis article
                </p>
                <Button onClick={handleGenerateDaily}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Generate Articles
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    {...article}
                    onClick={() => handleArticleClick(article)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Article Modal */}
        <ArticleModal
          article={selectedArticle}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedArticle(null);
          }}
        />
      </div>
    </div>
  );
}