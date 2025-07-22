import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAnimalAvatarByEmoji } from '@/data/avatars';
import { User } from "lucide-react";

interface UserAvatarProps {
  user?: {
    profileImageUrl?: string | null;
    avatar?: string | null;
    username?: string;
    firstName?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  };

  // If user has a profile image URL, use that
  if (user?.profileImageUrl) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={user.profileImageUrl} alt={user.username || user.firstName || "User"} />
        <AvatarFallback className={textSizes[size]}>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // If user has an emoji avatar, use that with colored background
  if (user?.avatar) {
    const avatarData = getAnimalAvatarByEmoji(user.avatar);
    return (
      <div 
        className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center text-white font-bold ${textSizes[size]}`}
        style={{ backgroundColor: avatarData?.background || '#6B7280' }}
      >
        <span className="text-lg">{user.avatar}</span>
      </div>
    );
  }

  // Fallback to username initial or User icon
  const initial = user?.username?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase();
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className={textSizes[size]}>
        {initial || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}