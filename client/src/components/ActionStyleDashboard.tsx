import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";

function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  
  // Test if hooks work
  const { isAuthenticated } = useAuth();
  const { isProUser } = useProStatus();
  
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white">Dashboard Loading...</h1>
      <p className="text-white">Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p className="text-white">Pro: {isProUser ? 'Yes' : 'No'}</p>
      <p className="text-white">Sport: {selectedSport}</p>
    </div>
  );
}

export default ActionStyleDashboard;
