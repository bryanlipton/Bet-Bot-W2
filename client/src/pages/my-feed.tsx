import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionStyleHeader } from '@/components/ActionStyleHeader';
import { 
  Rss,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Heart,
  Share2,
  BookOpen,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'pick' | 'article' | 'achievement' | 'social' | 'insight';
  title: string;
  content: string;
  timestamp: string;
  metadata?: {
    sport?: string;
    odds?: string;
    status?: 'won' | 'lost' | 'pending';
    author?: string;
    likes?: number;
    comments?: number;
  };
}

export default function MyFeedPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage (default to dark mode)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    if (savedDarkMode === null) {
      localStorage.setItem('darkMode', 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Mock feed data - in a real app this would come from an API
  const mockFeedItems: FeedItem[] = [
    {
      id: '1',
      type: 'pick',
      title: 'New Pick Added',
      content: 'You added Toronto Blue Jays ML (-154) to your picks',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      metadata: {
        sport: 'MLB',
        odds: '-154',
        status: 'pending'
      }
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Winning Streak!',
      content: 'Congratulations! You hit your last 3 picks in a row.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      id: '3',
      type: 'insight',
      title: 'AI Insight',
      content: 'The Yankees have a 78% win rate when Aaron Judge is in the lineup and the weather is above 70°F.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      metadata: {
        sport: 'MLB'
      }
    },
    {
      id: '4',
      type: 'article',
      title: 'Weekly MLB Roundup',
      content: 'Check out our latest analysis on this week\'s key matchups and betting opportunities.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      metadata: {
        author: 'Bet Bot AI',
        likes: 24,
        comments: 8
      }
    },
    {
      id: '5',
      type: 'pick',
      title: 'Pick Result',
      content: 'Your Red Sox vs Cubs Over 8.5 pick won! Payout: $95.00',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      metadata: {
        sport: 'MLB',
        odds: '+105',
        status: 'won'
      }
    }
  ];

  const getIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'pick':
        return <Target className="w-5 h-5" />;
      case 'article':
        return <BookOpen className="w-5 h-5" />;
      case 'achievement':
        return <Trophy className="w-5 h-5" />;
      case 'insight':
        return <Zap className="w-5 h-5" />;
      case 'social':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Rss className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: FeedItem['type']) => {
    switch (type) {
      case 'pick':
        return 'text-blue-600 dark:text-blue-400';
      case 'article':
        return 'text-green-600 dark:text-green-400';
      case 'achievement':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'insight':
        return 'text-purple-600 dark:text-purple-400';
      case 'social':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'won':
        return <Badge className="bg-green-600 text-white">Won</Badge>;
      case 'lost':
        return <Badge className="bg-red-600 text-white">Lost</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rss className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Feed</h1>
          </div>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Customize Feed
          </Button>
        </div>

        {/* Feed Items */}
        <div className="space-y-4">
          {mockFeedItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getIconColor(item.type)}`}>
                    {getIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.metadata?.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.content}
                    </p>
                    
                    {/* Metadata */}
                    {item.metadata && (
                      <div className="flex items-center gap-4 mt-2">
                        {item.metadata.sport && (
                          <Badge variant="outline" className="text-xs">
                            {item.metadata.sport}
                          </Badge>
                        )}
                        {item.metadata.odds && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.metadata.odds}
                          </span>
                        )}
                        {item.metadata.likes && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {item.metadata.likes}
                          </span>
                        )}
                        {item.metadata.comments && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {item.metadata.comments}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-6">
          <Button variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Load More
          </Button>
        </div>
      </div>
    </div>
  );
}