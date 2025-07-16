import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LoginButton() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button 
        variant="outline" 
        onClick={() => {
          // For now, show a message that authentication is being set up
          alert('Authentication system is being set up. Please check back soon!');
        }}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
      >
        <LogIn className="w-4 h-4" />
        Login
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300">
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
        <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}