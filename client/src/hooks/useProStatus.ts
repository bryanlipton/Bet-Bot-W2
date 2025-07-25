import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useProStatus() {
  const { isAuthenticated } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isProUser = subscription?.status === 'active' && subscription?.plan !== 'free';

  return {
    isProUser,
    subscription,
    isLoading,
  };
}