import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import ActionStyleDashboard from "@/components/ActionStyleDashboard";
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
import PaymentSuccess from "@/pages/PaymentSuccess";

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
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  // Debug OAuth redirect
  useEffect(() => {
    // Check if we have auth params in URL (after OAuth redirect)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    if (hashParams.get('access_token') || hashParams.get('error') || 
        searchParams.get('code') || searchParams.get('error')) {
      console.log('=== OAuth Redirect Detected ===');
      console.log('Current URL:', window.location.href);
      console.log('Hash params:', Object.fromEntries(hashParams));
      console.log('Search params:', Object.fromEntries(searchParams));
      
      // Check for errors
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
      
      if (error) {
        console.error('OAuth Error:', error);
        console.error('Error Description:', errorDescription);
      } else {
        console.log('OAuth tokens present - auth should process');
      }
    }
    
    // Log current auth state after a short delay
    setTimeout(() => {
      console.log('=== Auth State Check (2s after load) ===');
      const authElement = document.querySelector('[data-auth-state]');
      if (authElement) {
        console.log('Auth UI state:', authElement.getAttribute('data-auth-state'));
      }
    }, 2000);
  }, []);
  
  return (
    <div className="min-h-screen">
      <ActionStyleHeader />
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
        <Route path="/success" component={PaymentSuccess} />
        <Route component={NotFound} />
      </Switch>
      <MobileBottomNavigation />
      <div className="md:hidden h-16"></div>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    
    // Expose supabase globally for debugging
    import('./lib/supabase').then(({ supabase }) => {
      if (typeof window !== 'undefined') {
        (window as any).supabase = supabase;
        console.log('Supabase exposed as window.supabase for debugging');
      }
    });
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
