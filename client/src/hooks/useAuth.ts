import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - shorter for better auth responsiveness
  });

  // If we get a 401 error, user is not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}