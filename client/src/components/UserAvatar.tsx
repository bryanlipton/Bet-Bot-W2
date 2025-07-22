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

  console.log('UserAvatar rendering:', { 
    avatar: user?.avatar, 
    profileImageUrl: user?.profileImageUrl,
    username: user?.username 
  });

  // Priority 1: If user has an emoji avatar, use that with colored background
  if (user?.avatar && user?.avatar.length <= 2) { // Emoji check
    const avatarData = getAnimalAvatarByEmoji(user.avatar);
    console.log('Using emoji avatar:', user.avatar, avatarData);
    return (
      <div 
        className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center text-white font-bold ${textSizes[size]}`}
        style={{ backgroundColor: avatarData?.background || '#6B7280' }}
      >
        <span className="text-lg">{user.avatar}</span>
      </div>
    );
  }

  // Priority 2: If user has a profile image URL and no emoji avatar, use that
  if (user?.profileImageUrl && !user?.avatar) {
    console.log('Using profile image URL:', user.profileImageUrl);
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={user.profileImageUrl} alt={user.username || user.firstName || "User"} />
        <AvatarFallback className={textSizes[size]}>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // Fallback to username initial or User icon
  const initial = user?.username?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase();
  console.log('Using fallback initial:', initial);
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className={textSizes[size]}>
        {initial || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}