import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Clock, Users, MessageSquare, Heart, Share } from "lucide-react";

// Mock feed data - in a real app this would come from an API
const feedItems = [
  {
    id: 1,
    type: "pick_update",
    title: "Yankees vs Braves - Pick Update",
    content: "Our AI model has increased confidence in Yankees ML from 72% to 78% due to improved weather conditions and lineup changes.",
    timestamp: "2 hours ago",
    likes: 24,
    comments: 8,
    badge: "Hot Pick",
    badgeColor: "bg-red-500"
  },
  {
    id: 2,
    type: "result",
    title: "Daily Pick Result: WIN ✅",
    content: "Dodgers -1.5 hit! Our analysis of their bullpen strength and Mookie Betts' return paid off. +1.2 units for followers.",
    timestamp: "4 hours ago", 
    likes: 156,
    comments: 32,
    badge: "Winner",
    badgeColor: "bg-green-500"
  },
  {
    id: 3,
    type: "insight",
    title: "Weather Alert: Coors Field",
    content: "High winds at Coors Field today (15+ mph). Our model suggests OVER bets have 68% hit rate in these conditions. Rockies vs Cardinals total moved from 11.5 to 12.",
    timestamp: "6 hours ago",
    likes: 43,
    comments: 12,
    badge: "Alert",
    badgeColor: "bg-yellow-500"
  },
  {
    id: 4,
    type: "analysis",
    title: "Player Spotlight: Ronald Acuña Jr.",
    content: "Acuña Jr. is 8-for-15 against left-handed pitching in his last 4 games. Tonight he faces LHP Blake Snell. Consider player props.",
    timestamp: "8 hours ago",
    likes: 67,
    comments: 18,
    badge: "Analysis",
    badgeColor: "bg-blue-500"
  },
  {
    id: 5,
    type: "streak",
    title: "🔥 Hot Streak Alert",
    content: "We're now 7-2 in our last 9 MLB picks! Lock pick subscribers are up +8.4 units this week. Join the winning streak.",
    timestamp: "12 hours ago",
    likes: 198,
    comments: 45,
    badge: "Streak",
    badgeColor: "bg-orange-500"
  }
];

export default function Feed() {
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  const handleLike = (itemId: number) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">My Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest picks, results, and insights from Bet Bot
          </p>
        </div>

        {/* Feed Items */}
        <div className="space-y-4">
          {feedItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${item.badgeColor} text-white text-xs`}>
                        {item.badge}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {item.content}
                </p>
                
                <Separator className="mb-3" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 dark:text-gray-400 hover:text-red-500 p-1"
                      onClick={() => handleLike(item.id)}
                    >
                      <Heart 
                        className={`w-4 h-4 mr-1 ${
                          likedItems.has(item.id) 
                            ? "fill-red-500 text-red-500" 
                            : ""
                        }`} 
                      />
                      <span className="text-xs">
                        {item.likes + (likedItems.has(item.id) ? 1 : 0)}
                      </span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 p-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-xs">{item.comments}</span>
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-green-500 p-1"
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" className="w-full md:w-auto">
            Load More Updates
          </Button>
        </div>
      </div>
    </div>
  );
}