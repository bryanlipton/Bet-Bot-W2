import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import { ActionStyleDashboard } from "@/components/ActionStyleDashboard";
import ArticlesPage from "@/pages/articles";
import MyPicksPage from "@/pages/my-picks-fixed";
import SimpleMyPicks from "@/components/SimpleMyPicks";
import MyFeedPage from "@/pages/my-feed";
import ProfilePage from "@/pages/profile";
import UserProfilePage from "@/pages/user-profile";
import AboutPage from "@/pages/about";
import ScoresPage from "@/pages/scores";
import GetPro from "@/pages/GetPro";
import Subscribe from "@/pages/Subscribe";
import BetConfirmation from "@/pages/bet-confirmation";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/Feed";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";

const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Bet Bot Sports Genie AI Picks</h1>
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🎉 SUCCESS! Your site is working!</h2>
        <p>All APIs are connected and React is running properly.</p>
        <p className="mt-2">Next step: Add navigation header.</p>
      </div>
    </div>
  );
};

function Router() {
  const [darkMode, setDarkMode] = useState(true);
  
  return (
    <div className="min-h-screen">
      <ActionStyleHeader 
        darkMode={darkMode} 
        onToggleDarkMode={() => setDarkMode(!darkMode)} 
      />
      <Switch>
        <Route path="/" component={ActionStyleDashboard} />
        <Route path="/odds" component={ActionStyleDashboard} />
        <Route path="/articles" component={ArticlesPage} />
        <Route path="/my-picks" component={MyPicksPage} />
        <Route path="/my-picks-simple" component={SimpleMyPicks} />
        <Route path="/my-feed" component={MyFeedPage} />
        <Route path="/feed" component={Feed} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/user/:userId" component={UserProfilePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/scores" component={ScoresPage} />
        <Route path="/get-pro" component={GetPro} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/bet-confirmation/:dataId" component={BetConfirmation} />
        <Route component={NotFound} />
      </Switch>
      <MobileBottomNavigation />
      <div className="md:hidden h-16"></div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
