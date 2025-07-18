import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, TrendingUp, Clock } from "lucide-react";

export default function Feed() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Rss className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Feed
        </h1>
      </div>

      <div className="space-y-4">
        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Personalized Betting Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Rss className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your personalized betting feed will include:
              </p>
              <ul className="text-left max-w-sm mx-auto space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Live game updates and alerts
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Betting trends and insights
                </li>
                <li className="flex items-center gap-2">
                  <Rss className="w-4 h-4" />
                  Personalized recommendations
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}