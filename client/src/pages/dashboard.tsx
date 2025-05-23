import { useQuery } from "@tanstack/react-query";
import { Sun, Moon, Zap, Lightbulb, Check, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { formatTimeAgo, getCurrentDate, MOOD_OPTIONS } from "@/lib/constants";
import type { MoodEntry, TriggerEvent, Thought } from "@shared/schema";

export default function Dashboard() {
  const { navigate } = useAppNavigation();
  
  const { data: todaysMoodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries', { date: getCurrentDate() }],
    queryFn: () => fetch(`/api/mood-entries?date=${getCurrentDate()}`).then(res => res.json()),
  });

  const { data: recentTriggers = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
    queryFn: () => fetch('/api/trigger-events').then(res => res.json()),
  });

  const { data: recentThoughts = [] } = useQuery<Thought[]>({
    queryKey: ['/api/thoughts'],
    queryFn: () => fetch('/api/thoughts').then(res => res.json()),
  });

  const morningEntry = Array.isArray(todaysMoodEntries) ? todaysMoodEntries.find(entry => entry.timeOfDay === 'morning') : undefined;
  const eveningEntry = Array.isArray(todaysMoodEntries) ? todaysMoodEntries.find(entry => entry.timeOfDay === 'evening') : undefined;

  const getMoodEmoji = (mood: string) => {
    return MOOD_OPTIONS.find(option => option.value === mood)?.emoji || '😐';
  };

  const getStreakCount = () => {
    // Calculate actual streak based on mood entries
    return todaysMoodEntries.length > 0 ? 1 : 0;
  };

  return (
    <div className="py-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Harry</h2>
        <p className="text-slate-400">Let's check in with how you're feeling today</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card 
          className="bg-slate-800 border-slate-700 hover:border-yellow-500 transition-colors cursor-pointer"
          onClick={() => navigate('/mood')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Sun className="text-yellow-400 text-xl" />
              </div>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">Morning</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Quick Morning Check-in</h3>
            <p className="text-sm text-slate-400">Log your morning mood and medication</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-slate-700 hover:border-red-500 transition-colors cursor-pointer"
          onClick={() => navigate('/triggers')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Zap className="text-red-400 text-xl" />
              </div>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">Trigger</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Log Trigger Event</h3>
            <p className="text-sm text-slate-400">Record what happened and how you responded</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors cursor-pointer"
          onClick={() => navigate('/thoughts')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Lightbulb className="text-purple-400 text-xl" />
              </div>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">Thought</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Capture Thought</h3>
            <p className="text-sm text-slate-400">Write down what's on your mind</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => navigate('/mood')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Moon className="text-blue-400 text-xl" />
              </div>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">Evening</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Evening Reflection</h3>
            <p className="text-sm text-slate-400">Review your day and set intentions</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Today's Progress</h3>
            
            {/* Mood Timeline */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Mood Timeline</span>
                <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-4">
                {/* Morning Mood */}
                <div className={`flex-1 bg-slate-700 rounded-lg p-4 ${!morningEntry ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-yellow-400 font-medium">Morning</span>
                    <span className="text-2xl">
                      {morningEntry ? getMoodEmoji(morningEntry.mood) : '⏰'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 capitalize">
                    {morningEntry ? morningEntry.mood : 'Pending'}
                  </p>
                  <div className="flex mt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full mr-1 ${
                          morningEntry && i < morningEntry.intensity
                            ? 'bg-green-600'
                            : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Evening Mood */}
                <div className={`flex-1 bg-slate-700 rounded-lg p-4 ${!eveningEntry ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-400 font-medium">Evening</span>
                    <span className="text-2xl">
                      {eveningEntry ? getMoodEmoji(eveningEntry.mood) : '⏰'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 capitalize">
                    {eveningEntry ? eveningEntry.mood : 'Pending'}
                  </p>
                  <div className="flex mt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full mr-1 ${
                          eveningEntry && i < eveningEntry.intensity
                            ? 'bg-green-600'
                            : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {morningEntry?.weight ? `${morningEntry.weight}` : '--'}
                </div>
                <div className="text-xs text-slate-400">
                  Weight ({morningEntry?.weightUnit || 'kg'})
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {morningEntry?.medicationTaken ? '✅' : eveningEntry?.medicationTaken ? '✅' : '❌'}
                </div>
                <div className="text-xs text-slate-400">Medication</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {morningEntry?.sleepQuality ? `${morningEntry.sleepQuality}/5` : '--'}
                </div>
                <div className="text-xs text-slate-400">Sleep Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Weekly Streak</h3>
            
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-600">{getStreakCount()}</div>
              <div className="text-sm text-slate-400">Days in a row</div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center ${
                    i < getStreakCount()
                      ? i === getStreakCount() - 1
                        ? 'bg-primary'
                        : 'bg-green-600'
                      : 'bg-slate-600'
                  }`}
                >
                  {i < getStreakCount() ? (
                    i === getStreakCount() - 1 ? (
                      <Star className="text-white text-xs" size={12} />
                    ) : (
                      <Check className="text-white text-xs" size={12} />
                    )
                  ) : null}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 text-center">Keep up the great work! 🎉</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            <button 
              onClick={() => navigate('/insights')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Recent mood entries */}
            {todaysMoodEntries.slice(0, 2).map((entry) => (
              <div key={entry.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">
                    {entry.timeOfDay} mood: {entry.mood} ({entry.intensity}/5)
                  </p>
                  <p className="text-xs text-slate-400">{formatTimeAgo(new Date(entry.createdAt!))}</p>
                </div>
                <div className="text-xs text-slate-400">Mood</div>
              </div>
            ))}

            {/* Recent thoughts */}
            {recentThoughts.slice(0, 1).map((thought) => (
              <div key={thought.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Lightbulb className="text-purple-400" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Captured a thought{thought.moodTags && thought.moodTags.length > 0 ? ` (${thought.moodTags[0]})` : ''}
                  </p>
                  <p className="text-xs text-slate-400">{formatTimeAgo(new Date(thought.createdAt!))}</p>
                </div>
                <div className="text-xs text-slate-400">Thought</div>
              </div>
            ))}

            {/* Recent triggers */}
            {recentTriggers.slice(0, 1).map((trigger) => (
              <div key={trigger.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="text-red-400" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Logged trigger event: {trigger.emotion}
                  </p>
                  <p className="text-xs text-slate-400">{formatTimeAgo(new Date(trigger.createdAt!))}</p>
                </div>
                <div className="text-xs text-slate-400">Trigger</div>
              </div>
            ))}

            {todaysMoodEntries.length === 0 && recentThoughts.length === 0 && recentTriggers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No recent activity</p>
                <p className="text-sm text-slate-500">Start by logging your mood or capturing a thought</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
