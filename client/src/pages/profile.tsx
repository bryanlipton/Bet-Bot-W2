import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, LogOut } from 'lucide-react';
import MobileBottomNavigation from '@/components/MobileBottomNavigation';

export default function ProfilePage() {
  const { user, profile, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          </CardContent>
        </Card>
        <MobileBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Profile</h1>
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">
                {profile?.username || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">{user?.email || 'No email'}</span>
            </div>
            <Button onClick={signOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      <MobileBottomNavigation />
    </div>
  );
}
