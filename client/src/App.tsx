import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/dashboard";
import ArticlesPage from "@/pages/articles";
import MyPicksPage from "@/pages/my-picks";
import ScoresPage from "@/pages/scores";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function TopNavigation() {
  const [location] = useLocation();

  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Brand */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer">
                Bet Bot
              </div>
            </Link>
            
            {/* Navigation Tabs */}
            <div className="flex items-center">
              {navigationTabs.map((tab) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                      tab.active
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Get Pro button */}
          <div>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
              Get Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/my-picks" component={MyPicksPage} />
      <Route path="/scores" component={ScoresPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <TopNavigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
