import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-6">
            <span>© 2025 BET BOT. All rights reserved.</span>
            <div className="flex items-center gap-1">
              <span>Team data from official sports APIs</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Sports data for entertainment purposes only
          </div>
        </div>
      </div>
    </footer>
  );
}