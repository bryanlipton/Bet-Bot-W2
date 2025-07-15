import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, Tag } from "lucide-react";
import ReactMarkdown from 'react-markdown';

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

interface ArticleModalProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}

export function ArticleModal({ article, open, onClose }: ArticleModalProps) {
  if (!article) return null;

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4">
          <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
            <img 
              src={article.thumbnail} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge 
              className={`absolute bottom-4 left-6 ${getTypeColor(article.articleType)}`}
            >
              {article.articleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          
          <DialogTitle className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">
            {article.title}
          </DialogTitle>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{article.readTime} min read</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}