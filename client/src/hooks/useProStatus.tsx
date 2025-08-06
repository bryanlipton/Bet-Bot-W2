import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  plan: 'free' | 'pro' | 'premium';
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export function useProStatus() {
  const { isAuthenticated, user } = useAuth();
  const [isProUser, setIsProUser] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Query subscription data
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['/api/auth/subscription'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      
      const response = await fetch('/api/auth/subscription');
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error('Failed to fetch subscription data');
      }
      return response.json();
    },
    enabled: isAuthenticated, // Only fetch if user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (subscriptionData) {
      setSubscription(subscriptionData);
      // User is pro if they have an active subscription with pro or premium plan
      const isPro = subscriptionData.status === 'active' && 
                   (subscriptionData.plan === 'pro' || subscriptionData.plan === 'premium');
      setIsProUser(isPro);
    } else {
      // Default to free user
      setSubscription({
        id: 'free',
        status: 'active',
        plan: 'free'
      });
      setIsProUser(false);
    }
  }, [subscriptionData]);

  // If user is not authenticated, they're definitely not pro
  useEffect(() => {
    if (!isAuthenticated) {
      setIsProUser(false);
      setSubscription({
        id: 'free',
        status: 'active', 
        plan: 'free'
      });
    }
  }, [isAuthenticated]);

  return {
    isProUser,
    subscription,
    isLoading: isLoading,
    isPremium: subscription?.plan === 'premium',
    isFree: subscription?.plan === 'free' || !isAuthenticated,
    subscriptionStatus: subscription?.status || 'inactive'
  };
}
