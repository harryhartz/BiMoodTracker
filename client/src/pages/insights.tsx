import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Activity, Brain, Weight, Moon, AlertTriangle, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import type { MoodEntry, TriggerEvent, Thought } from "@shared/schema";

export default function Insights() {
  const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months'>('1month');

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
  });

  const { data: thoughts = [] } = useQuery<Thought[]>({
    queryKey: ['/api/thoughts'],
  });

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const months = timeRange === '1month' ? 1 : timeRange === '3months' ? 3 : 6;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    
    return {
      moodEntries: moodEntries.filter(entry => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt) : new Date(entry.date);
        return entryDate >= cutoffDate;
      }),
      triggerEvents: triggerEvents.filter(event => {
        const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
        return eventDate >= cutoffDate;
      }),
      thoughts: thoughts.filter(thought => {
        const thoughtDate = thought.createdAt ? new Date(thought.createdAt) : new Date();
        return thoughtDate >= cutoffDate;
      })
    };
  };

  const { moodEntries: filteredMoodEntries, triggerEvents: filteredTriggerEvents, thoughts: filteredThoughts } = getFilteredData();

  // Process mood trend data for charts
  const moodTrendData = useMemo(() => {
    return filteredMoodEntries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, entry) => {
        const date = entry.date;
        const existingDay = acc.find(d => d.date === date);
        if (existingDay) {
          if (entry.timeOfDay === 'morning') existingDay.morning = entry.intensity;
          if (entry.timeOfDay === 'afternoon') existingDay.afternoon = entry.intensity;
          if (entry.timeOfDay === 'evening') existingDay.evening = entry.intensity;
          existingDay.average = ((existingDay.morning || 0) + (existingDay.afternoon || 0) + (existingDay.evening || 0)) / 
            [existingDay.morning, existingDay.afternoon, existingDay.evening].filter(v => v !== undefined).length;
        } else {
          const newDay: any = {
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
          if (entry.timeOfDay === 'morning') newDay.morning = entry.intensity;
          if (entry.timeOfDay === 'afternoon') newDay.afternoon = entry.intensity;
          if (entry.timeOfDay === 'evening') newDay.evening = entry.intensity;
          newDay.average = entry.intensity;
          acc.push(newDay);
        }
        return acc;
      }, [] as any[]);
  }, [filteredMoodEntries]);

  // Process trigger frequency data
  const triggerFrequencyData = useMemo(() => {
    const frequency: { [key: string]: number } = {};
    filteredTriggerEvents.forEach(event => {
      const situation = event.eventSituation || 'Unknown';
      frequency[situation] = (frequency[situation] || 0) + 1;
    });
    return Object.entries(frequency)
      .map(([situation, count]) => ({ situation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredTriggerEvents]);

  // Process mood vs trigger correlation
  const moodTriggerCorrelation = useMemo(() => {
    return filteredMoodEntries.map(mood => {
      const moodDate = new Date(mood.date);
      const dayTriggers = filteredTriggerEvents.filter(trigger => {
        const triggerDate = trigger.createdAt ? new Date(trigger.createdAt) : new Date();
        return triggerDate.toDateString() === moodDate.toDateString();
      });
      return {
        date: mood.date,
        mood: mood.intensity || 5,
        triggers: dayTriggers.length,
        displayDate: moodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMoodEntries, filteredTriggerEvents]);

  // Mood distribution data
  const moodDistribution = useMemo(() => {
    const distribution = [
      { range: '1-2 (Very Low)', count: 0, color: '#EF4444' },
      { range: '3-4 (Low)', count: 0, color: '#F97316' },
      { range: '5-6 (Neutral)', count: 0, color: '#EAB308' },
      { range: '7-8 (Good)', count: 0, color: '#22C55E' },
      { range: '9-10 (Excellent)', count: 0, color: '#10B981' }
    ];
    
    filteredMoodEntries.forEach(entry => {
      const intensity = entry.intensity || 5;
      if (intensity <= 2) distribution[0].count++;
      else if (intensity <= 4) distribution[1].count++;
      else if (intensity <= 6) distribution[2].count++;
      else if (intensity <= 8) distribution[3].count++;
      else distribution[4].count++;
    });
    
    return distribution.filter(d => d.count > 0);
  }, [filteredMoodEntries]);

  // Calculate insights
  const averageMood = filteredMoodEntries.length > 0 
    ? (filteredMoodEntries.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / filteredMoodEntries.length).toFixed(1)
    : '0';

  const mostCommonTrigger = triggerFrequencyData.length > 0 ? triggerFrequencyData[0].situation : 'None';
  
  const moodTrend = moodTrendData.length >= 2 
    ? moodTrendData[moodTrendData.length - 1].average > moodTrendData[0].average ? 'improving' : 'declining'
    : 'stable';

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

        {/* Key Insights Summary */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <h3 className="font-medium text-gray-300">Average Mood</h3>
              </div>
              <div className="text-2xl font-bold text-purple-400 mt-2">{averageMood}</div>
              <Badge variant={moodTrend === 'improving' ? 'default' : moodTrend === 'declining' ? 'destructive' : 'secondary'} className="mt-2">
                {moodTrend === 'improving' ? '↗ Improving' : moodTrend === 'declining' ? '↘ Declining' : '→ Stable'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h3 className="font-medium text-gray-300">Top Trigger</h3>
              </div>
              <div className="text-lg font-bold text-orange-400 mt-2 truncate">{mostCommonTrigger}</div>
              <div className="text-sm text-gray-400 mt-1">{filteredTriggerEvents.length} total events</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-400" />
                <h3 className="font-medium text-gray-300">Mood Entries</h3>
              </div>
              <div className="text-2xl font-bold text-green-400 mt-2">{filteredMoodEntries.length}</div>
              <div className="text-sm text-gray-400 mt-1">in {timeRange.replace(/(\d+)/, '$1 ')}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-gray-300">Journal Entries</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-2">{filteredThoughts.length}</div>
              <div className="text-sm text-gray-400 mt-1">thoughts recorded</div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Mood Trend Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mood Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodTrendData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      domain={[1, 10]}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                      strokeWidth={3}
                      name="Average Mood"
                    />
                    {moodTrendData.some(d => d.morning) && (
                      <Line 
                        type="monotone" 
                        dataKey="morning" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        name="Morning"
                      />
                    )}
                    {moodTrendData.some(d => d.afternoon) && (
                      <Line 
                        type="monotone" 
                        dataKey="afternoon" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                        name="Afternoon"
                      />
                    )}
                    {moodTrendData.some(d => d.evening) && (
                      <Line 
                        type="monotone" 
                        dataKey="evening" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        name="Evening"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">No mood data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood vs Triggers Correlation */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Mood & Trigger Correlation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodTriggerCorrelation.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={moodTriggerCorrelation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number"
                      dataKey="triggers"
                      domain={[0, 'dataMax + 1']}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      name="Triggers"
                    />
                    <YAxis 
                      type="number"
                      dataKey="mood"
                      domain={[1, 10]}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      name="Mood"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value, name) => [value, name === 'mood' ? 'Mood Level' : 'Trigger Count']}
                      labelFormatter={(label) => `Triggers: ${label}`}
                    />
                    <Scatter 
                      dataKey="mood" 
                      fill="#8B5CF6"
                      name="Mood vs Triggers"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">No correlation data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trigger Frequency Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Top Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {triggerFrequencyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={triggerFrequencyData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        type="number"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis 
                        type="category"
                        dataKey="situation"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#F59E0B"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
                  <p className="text-gray-400">No trigger data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mood Distribution Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moodDistribution.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ range, count }) => `${range}: ${count}`}
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
                  <p className="text-gray-400">No mood distribution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}