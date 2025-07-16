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
          {/* Left side - Brand and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer bg-blue-600 text-white px-3 py-1 rounded">
                BET BOT
              </div>
            </Link>
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-8">
              {navigationTabs.map((tab) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    className={`font-medium text-sm transition-colors ${
                      tab.active
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Theme toggle, Get Pro, Login */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
              Get Pro
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
              Login
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
