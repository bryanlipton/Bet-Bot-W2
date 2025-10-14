import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Zap, User, LogOut, ChevronDown } from "lucide-react";  // Removed Moon, Sun
import { LoginButton } from "@/components/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import UserAvatar from "@/components/UserAvatar";
import GetProButton from "@/components/GetProButton";

import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

// Remove the darkMode props since we don't need them anymore
interface ActionStyleHeaderProps {
  // Remove these:
  // darkMode: boolean;
  // onToggleDarkMode: () => void;
}

function ActionStyleHeader() {  // Remove props
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();

  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
    { path: "/my-feed", name: "My Feed", active: location === "/my-feed" },
  ];

  return (
    <TooltipProvider>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                // For logged-in users: simple clickable logo that navigates to odds
                <img 
                  src={betbotLogo} 
                  alt="BetBot Logo" 
                  className="w-9 h-9 object-contain cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-150"
                  onClick={() => navigate("/")}
                />
              ) : (
                // For non-logged-in users: no tooltip or popover on logo
                <img 
                  src={betbotLogo} 
                  alt="BetBot Logo" 
                  className="w-9 h-9 object-contain"
                />
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden lg:block">
                AI-powered sports insights, personalized for you
              </p>
            </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationTabs.map((tab) => (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={`font-medium text-sm transition-colors ${
                    tab.active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {tab.name}
                </button>
              </Link>
            ))}
            
            {/* About Bet Bot Link */}
            <Link href="/about">
              <button className="font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                About Bet Bot
              </button>
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* REMOVED DARK MODE TOGGLE BUTTON */}
            
            {/* Get Pro Button - triggers Stripe checkout */}
            <GetProButton />
            
            <LoginButton />
          </div>
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
}

export default ActionStyleHeader;
