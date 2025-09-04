import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Login() {
  const [, setLocation] = useLocation();
  
  const handleMockLogin = () => {
    localStorage.setItem('mockAuth', 'true');
    window.dispatchEvent(new Event('storage'));
    setLocation('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Login to Bet Bot</h2>
          <Button 
            onClick={handleMockLogin}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            Mock Login (Temporary)
          </Button>
          <p className="text-sm text-gray-500 text-center mt-4">
            Real authentication coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
