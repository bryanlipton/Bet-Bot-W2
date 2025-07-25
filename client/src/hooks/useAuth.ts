import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If we get a 401 error, user is not authenticated
  const isAuthenticated = !!user && !error;

  // Check if user has active Pro subscription
  const isProUser = !!(user && 
                       (user as any)?.subscriptionStatus === 'active' && 
                       (user as any)?.subscriptionPlan && 
                       (user as any)?.subscriptionPlan !== 'free' &&
                       (user as any)?.subscriptionEndsAt &&
                       new Date((user as any).subscriptionEndsAt) > new Date());

  return {
    user,
    isLoading,
    isAuthenticated,
    isProUser,
    error,
  };
}