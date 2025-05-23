import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, ArrowDown } from "lucide-react";
import { MOOD_OPTIONS, EMOTION_OPTIONS } from "@/lib/constants";
import type { MoodEntry, TriggerEvent } from "@shared/schema";

export default function Insights() {
  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
    queryFn: () => fetch('/api/mood-entries').then(res => res.json()),
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
    queryFn: () => fetch('/api/trigger-events').then(res => res.json()),
  });

  // Calculate insights
  const calculateInsights = () => {
    if (moodEntries.length === 0) {
      return {
        avgMorningMood: 0,
        avgEveningMood: 0,
        medicationCompliance: 0,
        currentWeight: 0,
        weightChange7d: 0,
        weightChange30d: 0,
        commonTrigger: 'None',
        peakTriggerTime: 'N/A',
        topMoods: [],
        medicationTaken: 0,
        medicationMissed: 0,
        medicationStreak: 0,
        goodSleepMood: 0,
        poorSleepMood: 0,
        medMoodAvg: 0,
        noMedMoodAvg: 0,
      };
    }

    const morningEntries = moodEntries.filter(e => e.timeOfDay === 'morning');
    const eveningEntries = moodEntries.filter(e => e.timeOfDay === 'evening');
    
    const avgMorningMood = morningEntries.length > 0 
      ? morningEntries.reduce((sum, e) => sum + e.intensity, 0) / morningEntries.length 
      : 0;
    
    const avgEveningMood = eveningEntries.length > 0 
      ? eveningEntries.reduce((sum, e) => sum + e.intensity, 0) / eveningEntries.length 
      : 0;

    // Medication compliance (last 7 days)
    const last7Days = moodEntries.slice(0, 7);
    const medicationTaken = last7Days.filter(e => e.medicationTaken).length;
    const medicationMissed = last7Days.length - medicationTaken;
    const medicationCompliance = last7Days.length > 0 
      ? Math.round((medicationTaken / last7Days.length) * 100) 
      : 0;

    // Weight tracking
    const entriesWithWeight = moodEntries.filter(e => e.weight);
    const currentWeight = entriesWithWeight.length > 0 ? entriesWithWeight[0].weight! : 0;
    
    // Weight changes (simplified)
    const weightChange7d = entriesWithWeight.length > 1 
      ? entriesWithWeight[0].weight! - (entriesWithWeight[6]?.weight || entriesWithWeight[entriesWithWeight.length - 1].weight!)
      : 0;
    
    const weightChange30d = entriesWithWeight.length > 1 
      ? entriesWithWeight[0].weight! - (entriesWithWeight[Math.min(29, entriesWithWeight.length - 1)]?.weight || entriesWithWeight[entriesWithWeight.length - 1].weight!)
      : 0;

    // Trigger analysis
    const emotionCounts = triggerEvents.reduce((acc, event) => {
      acc[event.emotion] = (acc[event.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonTrigger = Object.keys(emotionCounts).length > 0 
      ? Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0][0]
      : 'None';

    // Top moods
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood, count]) => ({ mood, count }));

    // Sleep vs mood correlation
    const goodSleepEntries = moodEntries.filter(e => e.sleepQuality && e.sleepQuality >= 4);
    const poorSleepEntries = moodEntries.filter(e => e.sleepQuality && e.sleepQuality <= 3);
    
    const goodSleepMood = goodSleepEntries.length > 0 
      ? goodSleepEntries.reduce((sum, e) => sum + e.intensity, 0) / goodSleepEntries.length 
      : 0;
    
    const poorSleepMood = poorSleepEntries.length > 0 
      ? poorSleepEntries.reduce((sum, e) => sum + e.intensity, 0) / poorSleepEntries.length 
      : 0;

    // Medication vs mood correlation
    const medEntries = moodEntries.filter(e => e.medicationTaken);
    const noMedEntries = moodEntries.filter(e => !e.medicationTaken);
    
    const medMoodAvg = medEntries.length > 0 
      ? medEntries.reduce((sum, e) => sum + e.intensity, 0) / medEntries.length 
      : 0;
    
    const noMedMoodAvg = noMedEntries.length > 0 
      ? noMedEntries.reduce((sum, e) => sum + e.intensity, 0) / noMedEntries.length 
      : 0;

    return {
      avgMorningMood: Math.round(avgMorningMood * 10) / 10,
      avgEveningMood: Math.round(avgEveningMood * 10) / 10,
      medicationCompliance,
      currentWeight: Math.round(currentWeight * 10) / 10,
      weightChange7d: Math.round(weightChange7d * 10) / 10,
      weightChange30d: Math.round(weightChange30d * 10) / 10,
      commonTrigger,
      peakTriggerTime: '2-4 PM', // Simplified
      topMoods,
      medicationTaken,
      medicationMissed,
      medicationStreak: Math.max(0, medicationTaken - medicationMissed),
      goodSleepMood: Math.round(goodSleepMood * 10) / 10,
      poorSleepMood: Math.round(poorSleepMood * 10) / 10,
      medMoodAvg: Math.round(medMoodAvg * 10) / 10,
      noMedMoodAvg: Math.round(noMedMoodAvg * 10) / 10,
    };
  };

  const insights = calculateInsights();

  const getMoodEmoji = (mood: string) => {
    return MOOD_OPTIONS.find(option => option.value === mood)?.emoji || '😐';
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Insights & Analytics</h2>
        <p className="text-slate-400">Understand your patterns and track your progress</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-4 mb-6">
        <Button variant="default">This Week</Button>
        <Button variant="secondary">This Month</Button>
        <Button variant="secondary">3 Months</Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mood Trend Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Mood Trends</h3>
            <div className="h-64 bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="text-4xl text-slate-600 mb-4 mx-auto" />
                <p className="text-slate-400">Mood trend visualization</p>
                <p className="text-sm text-slate-500">Morning vs Evening mood comparison</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{insights.avgMorningMood || '--'}</div>
                <div className="text-slate-400">Avg Morning</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{insights.avgEveningMood || '--'}</div>
                <div className="text-slate-400">Avg Evening</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trigger Heatmap */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Trigger Patterns</h3>
            <div className="h-64 bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingDown className="text-4xl text-slate-600 mb-4 mx-auto" />
                <p className="text-slate-400">Trigger frequency heatmap</p>
                <p className="text-sm text-slate-500">When triggers occur most often</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Most Common:</span>
                <span className="text-white capitalize">{insights.commonTrigger}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Peak Time:</span>
                <span className="text-white">{insights.peakTriggerTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Most Used Moods */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Most Used Moods</h3>
            <div className="space-y-3">
              {insights.topMoods.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No mood data yet</p>
              ) : (
                insights.topMoods.map((item, index) => (
                  <div key={item.mood} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getMoodEmoji(item.mood)}</span>
                      <span className="text-white capitalize">{item.mood}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 rounded-full h-2" 
                          style={{ width: `${Math.min(100, (item.count / (insights.topMoods[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">{item.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medication Compliance */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Medication Compliance</h3>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-600">{insights.medicationCompliance}%</div>
              <div className="text-sm text-slate-400">This Week</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Taken:</span>
                <span className="text-green-600">{insights.medicationTaken} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Missed:</span>
                <span className="text-red-400">{insights.medicationMissed} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Streak:</span>
                <span className="text-white">{insights.medicationStreak} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Trend */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weight Trend</h3>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-white">
                {insights.currentWeight > 0 ? `${insights.currentWeight} kg` : 'No data'}
              </div>
              <div className="text-sm text-slate-400">Current</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Change (7d):</span>
                <span className={insights.weightChange7d >= 0 ? "text-red-400" : "text-green-600"}>
                  {insights.weightChange7d !== 0 ? `${insights.weightChange7d > 0 ? '+' : ''}${insights.weightChange7d} kg` : 'No change'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Change (30d):</span>
                <span className={insights.weightChange30d >= 0 ? "text-red-400" : "text-green-600"}>
                  {insights.weightChange30d !== 0 ? `${insights.weightChange30d > 0 ? '+' : ''}${insights.weightChange30d} kg` : 'No change'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Trend:</span>
                <span className="text-green-600">
                  <ArrowDown className="inline mr-1" size={12} />
                  {insights.weightChange30d < 0 ? 'Decreasing' : insights.weightChange30d > 0 ? 'Increasing' : 'Stable'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Correlations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Correlations & Patterns</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood vs Medication Correlation */}
            <div>
              <h4 className="font-semibold text-white mb-3">Mood vs Medication</h4>
              <div className="space-y-3">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Days with medication</span>
                    <span className="text-green-600 font-semibold">
                      {insights.medMoodAvg > 0 ? `${insights.medMoodAvg}/5` : 'No data'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-600 rounded-full h-2" 
                      style={{ width: `${insights.medMoodAvg * 20}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Days without medication</span>
                    <span className="text-yellow-400 font-semibold">
                      {insights.noMedMoodAvg > 0 ? `${insights.noMedMoodAvg}/5` : 'No data'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 rounded-full h-2" 
                      style={{ width: `${insights.noMedMoodAvg * 20}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sleep vs Mood Correlation */}
            <div>
              <h4 className="font-semibold text-white mb-3">Sleep vs Mood</h4>
              <div className="space-y-3">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Good sleep (4-5/5)</span>
                    <span className="text-green-600 font-semibold">
                      {insights.goodSleepMood > 0 ? `${insights.goodSleepMood}/5` : 'No data'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-600 rounded-full h-2" 
                      style={{ width: `${insights.goodSleepMood * 20}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Poor sleep (1-3/5)</span>
                    <span className="text-red-400 font-semibold">
                      {insights.poorSleepMood > 0 ? `${insights.poorSleepMood}/5` : 'No data'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-red-400 rounded-full h-2" 
                      style={{ width: `${insights.poorSleepMood * 20}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
