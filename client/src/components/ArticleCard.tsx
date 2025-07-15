import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Star } from "lucide-react";

interface ArticleCardProps {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  articleType: string;
  sport: string;
  thumbnail: string;
  author: string;
  readTime: number;
  featured: boolean;
  onClick: () => void;
}

export function ArticleCard({
  title,
  summary,
  tags,
  publishedAt,
  articleType,
  thumbnail,
  author,
  readTime,
  featured,
  onClick
}: ArticleCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'game-preview': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'daily-roundup': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'strategy-guide': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'picks-analysis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 relative"
      onClick={onClick}
    >
      {featured && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-yellow-500 text-black">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
      
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a gradient background if image fails
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Badge 
          className={`absolute bottom-2 left-2 ${getTypeColor(articleType)}`}
        >
          {articleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg leading-tight line-clamp-2 text-gray-900 dark:text-white">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {summary}
        </p>

        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{readTime} min read</span>
            </div>
          </div>
          <span>{formatDate(publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}