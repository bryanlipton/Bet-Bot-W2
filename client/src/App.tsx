import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
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



function Router() {
  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/odds" component={Dashboard} />
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
      {/* Add bottom padding for mobile to account for bottom nav */}
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
