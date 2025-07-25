interface UserAvatarProps {
  user?: {
    username?: string;
    firstName?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base", 
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl"
  };

  const getInitial = () => {
    return user?.username?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || '?';
  };

  // Generate a consistent color based on username
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const backgroundColor = getColorFromName(user?.username || user?.firstName || 'default');

  return (
    <div className={`${sizeClasses[size]} ${backgroundColor} ${className} rounded-full flex items-center justify-center font-semibold text-white`}>
      {getInitial()}
    </div>
  );
}