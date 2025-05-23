import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, ArrowDown, Download, FileText, BarChart3, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import type { MoodEntry, TriggerEvent } from "@shared/schema";

export default function Insights() {
  const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months'>('1month');

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
  });

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const months = timeRange === '1month' ? 1 : timeRange === '3months' ? 3 : 6;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    
    return {
      moodEntries: moodEntries.filter(entry => new Date(entry.createdAt || entry.date) >= cutoffDate),
      triggerEvents: triggerEvents.filter(event => new Date(event.createdAt) >= cutoffDate)
    };
  };

  const { moodEntries: filteredMoodEntries, triggerEvents: filteredTriggerEvents } = getFilteredData();

  // Prepare mood trend data
  const moodTrendData = filteredMoodEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, entry) => {
      const existingDay = acc.find(d => d.date === entry.date);
      if (existingDay) {
        if (entry.timeOfDay === 'morning') existingDay.morning = entry.intensity;
        if (entry.timeOfDay === 'evening') existingDay.evening = entry.intensity;
      } else {
        acc.push({
          date: entry.date,
          morning: entry.timeOfDay === 'morning' ? entry.intensity : null,
          evening: entry.timeOfDay === 'evening' ? entry.intensity : null,
          displayDate: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return acc;
    }, [] as any[]);

  // Prepare trigger pattern data
  const triggerPatternData = filteredTriggerEvents.reduce((acc, event) => {
    const existing = acc.find(item => item.emotion === event.emotion);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ emotion: event.emotion, count: 1 });
    }
    return acc;
  }, [] as any[]);

  // Calculate medication compliance
  const medicationCompliance = () => {
    const entriesWithMeds = filteredMoodEntries.filter(entry => 
      entry.morningMedication !== null || entry.eveningMedication !== null
    );
    if (entriesWithMeds.length === 0) return 0;
    
    const compliantEntries = entriesWithMeds.filter(entry => 
      entry.morningMedication === true || entry.eveningMedication === true
    );
    
    return Math.round((compliantEntries.length / entriesWithMeds.length) * 100);
  };

  // Calculate average sleep
  const averageSleep = () => {
    const sleepEntries = filteredMoodEntries.filter(entry => entry.hoursSlept !== null);
    if (sleepEntries.length === 0) return 0;
    
    const totalSleep = sleepEntries.reduce((sum, entry) => sum + (entry.hoursSlept || 0), 0);
    return (totalSleep / sleepEntries.length).toFixed(1);
  };

  // Sleep vs Mood correlation
  const sleepMoodData = filteredMoodEntries
    .filter(entry => entry.hoursSlept !== null && entry.hoursSlept > 0)
    .map(entry => ({
      sleep: entry.hoursSlept,
      mood: entry.intensity,
      date: entry.date
    }))
    .sort((a, b) => a.sleep! - b.sleep!);

  // Weight trend data
  const weightTrendData = filteredMoodEntries
    .filter(entry => entry.weight !== null && entry.weight > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      weight: entry.weight,
      date: entry.date,
      displayDate: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weightUnit: entry.weightUnit || 'kg'
    }));

  // Calculate weight change
  const getWeightChange = () => {
    if (weightTrendData.length < 2) return { change: 0, percentage: 0 };
    const latest = weightTrendData[weightTrendData.length - 1];
    const earliest = weightTrendData[0];
    const change = latest.weight! - earliest.weight!;
    const percentage = ((change / earliest.weight!) * 100);
    return { change: Math.round(change * 10) / 10, percentage: Math.round(percentage * 10) / 10 };
  };

  // Export functions
  const exportTriggersToCSV = () => {
    if (filteredTriggerEvents.length === 0) {
      alert('No trigger data to export');
      return;
    }

    const headers = ['Date', 'Time', 'Event/Situation', 'Emotion', 'Action Taken', 'Consequence', 'Remind Later'];
    const csvContent = [
      headers.join(','),
      ...filteredTriggerEvents.map(event => [
        new Date(event.createdAt).toLocaleDateString(),
        new Date(event.createdAt).toLocaleTimeString(),
        `"${event.eventSituation.replace(/"/g, '""')}"`,
        event.emotion,
        `"${event.actionTaken.replace(/"/g, '""')}"`,
        `"${event.consequence.replace(/"/g, '""')}"`,
        event.remindLater ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `triggers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportTriggersToJSON = () => {
    if (filteredTriggerEvents.length === 0) {
      alert('No trigger data to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange: timeRange,
      totalEvents: filteredTriggerEvents.length,
      data: filteredTriggerEvents.map(event => ({
        date: new Date(event.createdAt).toLocaleDateString(),
        time: new Date(event.createdAt).toLocaleTimeString(),
        eventSituation: event.eventSituation,
        emotion: event.emotion,
        actionTaken: event.actionTaken,
        consequence: event.consequence,
        remindLater: event.remindLater
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `triggers_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Advanced trigger pattern analysis
  const getTriggerInsights = () => {
    if (filteredTriggerEvents.length === 0) return null;

    // Most common emotions
    const emotionCounts = filteredTriggerEvents.reduce((acc, event) => {
      acc[event.emotion] = (acc[event.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

    // Most common actions
    const actionCounts = filteredTriggerEvents.reduce((acc, event) => {
      acc[event.actionTaken] = (acc[event.actionTaken] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];

    // Day of week analysis
    const dayAnalysis = filteredTriggerEvents.reduce((acc, event) => {
      const day = new Date(event.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostTriggeringDay = Object.entries(dayAnalysis).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEvents: filteredTriggerEvents.length,
      topEmotion,
      topAction,
      mostTriggeringDay,
      remindLaterCount: filteredTriggerEvents.filter(e => e.remindLater).length
    };
  };

  const triggerInsights = getTriggerInsights();

  // Colors for charts
  const CHART_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Insights & Export Center</h1>
          <p className="text-gray-400">Analyze patterns and export your mental health data</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center">
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <Button 
              variant={timeRange === '1month' ? 'default' : 'ghost'} 
              size="sm" 
              className={timeRange === '1month' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-300 hover:text-white'}
              onClick={() => setTimeRange('1month')}
            >
              This Month
            </Button>
            <Button 
              variant={timeRange === '3months' ? 'default' : 'ghost'} 
              size="sm" 
              className={timeRange === '3months' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-300 hover:text-white'}
              onClick={() => setTimeRange('3months')}
            >
              3 Months
            </Button>
            <Button 
              variant={timeRange === '6months' ? 'default' : 'ghost'} 
              size="sm" 
              className={timeRange === '6months' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-300 hover:text-white'}
              onClick={() => setTimeRange('6months')}
            >
              6 Months
            </Button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="triggers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ArrowDown className="h-4 w-4 mr-2" />
              Trigger Analysis
            </TabsTrigger>
            <TabsTrigger value="mood-charts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Mood Charts
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Triggers Tab */}
          <TabsContent value="triggers" className="space-y-6 mt-6">
            {/* Export Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-400" />
                  Export Trigger Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  Export your trigger events for external analysis or record keeping.
                </p>
                <div className="flex gap-3">
                  <Button onClick={exportTriggersToCSV} className="bg-green-600 hover:bg-green-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button onClick={exportTriggersToJSON} variant="outline" className="border-gray-600 hover:bg-gray-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                </div>
                {filteredTriggerEvents.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Ready to export {filteredTriggerEvents.length} trigger events from the selected time period.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trigger Insights */}
            {triggerInsights && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                    Trigger Pattern Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{triggerInsights.totalEvents}</p>
                      <p className="text-sm text-gray-400">Total Events</p>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-lg font-semibold text-orange-400">{triggerInsights.topEmotion[0]}</p>
                      <p className="text-sm text-gray-400">Most Common Emotion</p>
                      <p className="text-xs text-gray-500">{triggerInsights.topEmotion[1]} times</p>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-lg font-semibold text-green-400">{triggerInsights.topAction[0]}</p>
                      <p className="text-sm text-gray-400">Most Common Action</p>
                      <p className="text-xs text-gray-500">{triggerInsights.topAction[1]} times</p>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-lg font-semibold text-purple-400">{triggerInsights.mostTriggeringDay[0]}</p>
                      <p className="text-sm text-gray-400">Most Triggering Day</p>
                      <p className="text-xs text-gray-500">{triggerInsights.mostTriggeringDay[1]} events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trigger Patterns Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-orange-400" />
                  Emotion Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {triggerPatternData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={triggerPatternData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="emotion" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                          labelStyle={{ color: '#E5E7EB' }}
                        />
                        <Bar dataKey="count" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-400">No trigger events in this time period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Triggers List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  Recent Trigger Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTriggerEvents.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTriggerEvents.slice(0, 10).map((event, index) => (
                      <div key={event.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-400">
                            {new Date(event.createdAt).toLocaleDateString()} - {new Date(event.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                            {event.emotion}
                          </span>
                        </div>
                        <p className="text-white mb-1"><strong>Situation:</strong> {event.eventSituation}</p>
                        <p className="text-gray-300 mb-1"><strong>Action:</strong> {event.actionTaken}</p>
                        <p className="text-gray-300"><strong>Outcome:</strong> {event.consequence}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No trigger events recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        {/* Mood Trends Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Mood Trends
            </h2>
            <div className="h-64">
              {moodTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="displayDate" stroke="#9CA3AF" />
                    <YAxis domain={[1, 5]} stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#E5E7EB' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="morning" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Morning Mood"
                      connectNulls={false}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="evening" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Evening Mood"
                      connectNulls={false}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No mood data in this time period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trigger Patterns Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-orange-400" />
              Trigger Patterns
            </h2>
            <div className="h-64">
              {triggerPatternData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={triggerPatternData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="emotion" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#E5E7EB' }}
                    />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No trigger events in this time period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weight Trend Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Weight Trend
            </h2>
            <div className="h-64">
              {weightTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="displayDate" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#E5E7EB' }}
                      formatter={(value, name) => [`${value} ${weightTrendData[0]?.weightUnit}`, 'Weight']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#A855F7" 
                      strokeWidth={2}
                      name="Weight"
                      dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No weight data available</p>
                </div>
              )}
            </div>
            {weightTrendData.length > 1 && (
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-400">
                  Change: {getWeightChange().change > 0 ? '+' : ''}{getWeightChange().change} {weightTrendData[0]?.weightUnit} 
                  ({getWeightChange().percentage > 0 ? '+' : ''}{getWeightChange().percentage}%)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep vs Mood Correlation */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Sleep vs Mood Correlation
            </h2>
            <div className="h-64">
              {sleepMoodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sleepMoodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="sleep" 
                      stroke="#9CA3AF" 
                      label={{ value: 'Hours of Sleep', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      stroke="#9CA3AF"
                      label={{ value: 'Mood Intensity', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#E5E7EB' }}
                      formatter={(value, name) => [value, name === 'mood' ? 'Mood' : name]}
                      labelFormatter={(value) => `${value} hours of sleep`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No sleep data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Medication Compliance */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Medication Compliance</h3>
              <p className="text-2xl font-bold text-green-400">{medicationCompliance()}%</p>
              <p className="text-sm text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>

          {/* Average Sleep */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Average Sleep</h3>
              <p className="text-2xl font-bold text-blue-400">{averageSleep()}h</p>
              <p className="text-sm text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>

          {/* Mood Entries */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Mood Entries</h3>
              <p className="text-2xl font-bold text-yellow-400">{filteredMoodEntries.length}</p>
              <p className="text-sm text-gray-500">Total entries</p>
            </CardContent>
          </Card>

          {/* Trigger Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Trigger Events</h3>
              <p className="text-2xl font-bold text-purple-400">{filteredTriggerEvents.length}</p>
              <p className="text-sm text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Insights Summary */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
            <div className="space-y-3">
              {filteredMoodEntries.length > 0 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="font-medium">You've logged {filteredMoodEntries.length} mood entries</p>
                    <p className="text-sm text-gray-400">Consistent tracking helps identify patterns</p>
                  </div>
                </div>
              )}
              {medicationCompliance() >= 80 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="font-medium">Great medication compliance at {medicationCompliance()}%</p>
                    <p className="text-sm text-gray-400">Keep up the consistent routine</p>
                  </div>
                </div>
              )}
              {filteredTriggerEvents.length > 0 && (
                <div className="flex items-start gap-3">
                  <ArrowDown className="h-5 w-5 text-orange-400 mt-1" />
                  <div>
                    <p className="font-medium">{filteredTriggerEvents.length} trigger events logged</p>
                    <p className="text-sm text-gray-400">Tracking triggers helps develop coping strategies</p>
                  </div>
                </div>
              )}
              {parseFloat(averageSleep()) >= 7 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="font-medium">Good sleep average of {averageSleep()} hours</p>
                    <p className="text-sm text-gray-400">Quality sleep supports stable mood</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}