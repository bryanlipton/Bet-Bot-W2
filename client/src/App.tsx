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
import GetPro from "@/pages/GetPro";
import Subscribe from "@/pages/Subscribe";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";



function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/my-picks" component={MyPicksPage} />
      <Route path="/scores" component={ScoresPage} />
      <Route path="/get-pro" component={GetPro} />
      <Route path="/subscribe" component={Subscribe} />
      <Route component={NotFound} />
    </Switch>
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
