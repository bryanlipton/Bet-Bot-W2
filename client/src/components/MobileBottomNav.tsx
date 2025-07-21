import { Home, TrendingUp, Trophy, Rss, User, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "home",
    icon: Home,
    label: "Home",
    path: "/",
  },
  {
    id: "scores",
    icon: Trophy,
    label: "Scores",
    path: "/scores",
  },
  {
    id: "picks",
    icon: TrendingUp,
    label: "My Picks",
    path: "/my-picks",
  },
  {
    id: "feed",
    icon: Rss,
    label: "My Feed",
    path: "/my-feed",
  },
  {
    id: "profile",
    icon: User,
    label: "Profile",
    path: "/profile",
  },
];

export default function MobileBottomNav() {
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
      <nav className="flex items-center justify-around py-2 px-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => {
                // Scroll to top when switching tabs
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1",
                "text-xs font-medium transition-colors duration-200",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
                )} 
              />
              <span className="truncate text-[10px] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}