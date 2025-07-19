import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, Settings } from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

export default function MobileHeader() {
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="w-5 h-5" />
          </Button>
          
          <Link href="/about">
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={betbotLogo} alt="Bet Bot" className="w-8 h-8" />
              <span className="font-bold text-lg">Bet Bot</span>
            </button>
          </Link>
          
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Add top padding for mobile to account for fixed header */}
      <div className="md:hidden h-16"></div>
    </>
  );
}