import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar } from "lucide-react";
import type { MoodEntry, TriggerEvent } from "@shared/schema";

export default function Insights() {
  const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months'>('1month');

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Insights</h1>
          <p className="text-gray-400">Track your progress and identify patterns</p>
        </div>

        <div className="flex justify-center space-x-2">
          {(['1month', '3months', '6months'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              className="capitalize"
            >
              {range === '1month' ? '1 Month' : range === '3months' ? '3 Months' : '6 Months'}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <h3 className="font-medium text-gray-300">Total Mood Entries</h3>
              </div>
              <div className="text-2xl font-bold text-green-400 mt-2">
                {moodEntries.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-gray-300">Trigger Events</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-2">
                {triggerEvents.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Average Mood</h3>
              <div className="text-2xl font-bold text-purple-400">
                {moodEntries.length > 0 
                  ? (moodEntries.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / moodEntries.length).toFixed(1)
                  : '0'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">This Period</h3>
              <div className="text-2xl font-bold text-yellow-400">
                {timeRange === '1month' ? 'This Month' : timeRange === '3months' ? 'Past 3 Months' : 'Past 6 Months'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
              <p className="text-gray-400">Advanced mood visualization coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}