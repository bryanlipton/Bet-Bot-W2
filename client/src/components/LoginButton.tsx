import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";

export function LoginButton() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button 
        variant="outline"
        size="sm"
        onClick={() => {
          // Clear auth cache before redirect to ensure fresh data after login
          queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
          window.location.href = '/api/auth/login';
        }}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
      >
        <LogIn className="w-4 h-4" />
        Log in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          <Avatar className="w-6 h-6">
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
            <AvatarFallback>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">
            {user?.firstName || user?.email || 'User'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <User className="w-4 h-4 mr-2" />
          {user?.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          // Invalidate auth cache first, then redirect to logout
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          queryClient.clear(); // Clear all cached data on logout
          window.location.href = '/api/logout';
        }}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}