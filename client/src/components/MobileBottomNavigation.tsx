import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, BarChart3, Trophy, Rss, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "odds",
    label: "Odds",
    icon: Home,
    path: "/",
  },
  {
    id: "scores",
    label: "Scores", 
    icon: BarChart3,
    path: "/scores",
  },
  {
    id: "picks",
    label: "My Picks",
    icon: Trophy,
    path: "/my-picks",
  },
  {
    id: "feed",
    label: "My Feed",
    icon: Rss,
    path: "/feed",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
];

export default function MobileBottomNavigation() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter(item => {
    // Hide "My Picks" tab for non-authenticated users (only if auth is loaded and explicitly false)
    if (item.id === "picks" && !isLoading && !isAuthenticated) {
      return false;
    }
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {filteredNavItems.map((item) => {
          const isActive = location === item.path || 
            (item.path === "/" && location === "/") ||
            (item.path !== "/" && location.startsWith(item.path));
          
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.id} 
              href={item.path}
              onClick={() => {
                // Scroll to top when switching tabs
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}