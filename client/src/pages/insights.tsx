import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Brain, Weight, Download, FileText, Camera, Pill } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from "recharts";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { MoodEntry, TriggerEvent, Thought, Medication } from "@shared/schema";

// Helper function to get emoji for mood
const getMoodEmoji = (mood: string): string => {
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    angry: '😠',
    tired: '😴',
    stressed: '😤',
    content: '😊',
    frustrated: '😤',
    peaceful: '☮️',
    overwhelmed: '🤯',
    hopeful: '🌟',
    lonely: '😔',
  };
  return moodEmojis[mood.toLowerCase()] || '😐';
};

export default function Insights() {
  const weightChartRef = useRef<HTMLDivElement>(null);
  const moodChartRef = useRef<HTMLDivElement>(null);

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
  });

  const { data: thoughts = [] } = useQuery<Thought[]>({
    queryKey: ['/api/thoughts'],
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
  });

  // Filter data for last month only
  const getFilteredData = () => {
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
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
      }),
      medications: medications.filter(med => {
        const medDate = med.createdAt ? new Date(med.createdAt) : new Date();
        return medDate >= cutoffDate;
      })
    };
  };

  const { moodEntries: filteredMoodEntries, triggerEvents: filteredTriggerEvents, thoughts: filteredThoughts, medications: filteredMedications } = getFilteredData();

  // Weight data from actual mood entries (if weight field exists)
  const weightData = useMemo(() => {
    return filteredMoodEntries
      .filter(entry => entry.weight) // Only entries with weight data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        date: entry.date,
        displayDate: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: entry.weight
      }));
  }, [filteredMoodEntries]);

  // Process overall mood intensity data for morning and evening comparison
  const moodIntensityData = useMemo(() => {
    return filteredMoodEntries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, entry) => {
        const date = entry.date;
        const existingDay = acc.find(d => d.date === date);
        if (existingDay) {
          if (entry.timeOfDay === 'morning') existingDay.morning = entry.overallMoodIntensity;
          if (entry.timeOfDay === 'evening') existingDay.evening = entry.overallMoodIntensity;
        } else {
          const newDay: any = {
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
          if (entry.timeOfDay === 'morning') newDay.morning = entry.overallMoodIntensity;
          if (entry.timeOfDay === 'evening') newDay.evening = entry.overallMoodIntensity;
          acc.push(newDay);
        }
        return acc;
      }, [] as any[]);
  }, [filteredMoodEntries]);

  // Process emoji mood data for the mood chart
  const emojiMoodData = useMemo(() => {
    return filteredMoodEntries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, entry) => {
        const date = entry.date;
        const existingDay = acc.find(d => d.date === date);
        if (existingDay) {
          if (entry.timeOfDay === 'morning') existingDay.morningMood = entry.mood;
          if (entry.timeOfDay === 'evening') existingDay.eveningMood = entry.mood;
        } else {
          const newDay: any = {
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
          if (entry.timeOfDay === 'morning') newDay.morningMood = entry.mood;
          if (entry.timeOfDay === 'evening') newDay.eveningMood = entry.mood;
          acc.push(newDay);
        }
        return acc;
      }, [] as any[]);
  }, [filteredMoodEntries]);

  // Calculate medication statistics from mood entries
  const medicationStats = useMemo(() => {
    // Get medication compliance data from morning and evening entries
    const morningMeds = filteredMoodEntries.filter(entry => 
      entry.timeOfDay === 'morning' && entry.morningMedication !== null
    );
    const eveningMeds = filteredMoodEntries.filter(entry => 
      entry.timeOfDay === 'evening' && entry.eveningMedication !== null
    );
    
    const totalMedChecks = morningMeds.length + eveningMeds.length;
    const takenOnTime = morningMeds.filter(entry => entry.morningMedication === true).length + 
                       eveningMeds.filter(entry => entry.eveningMedication === true).length;
    const compliance = totalMedChecks > 0 ? Math.round((takenOnTime / totalMedChecks) * 100) : 0;
    
    return {
      totalMeds: totalMedChecks,
      takenOnTime,
      compliance,
      missedDoses: totalMedChecks - takenOnTime
    };
  }, [filteredMoodEntries]);

  // Sleep-Mood Correlation Data
  const sleepMoodData = useMemo(() => {
    const correlationData: { sleepQuality: number; nextDayMood: number; date: string }[] = [];
    
    // Sort entries by date
    const sortedEntries = [...filteredMoodEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentEntry = sortedEntries[i];
      const nextEntry = sortedEntries[i + 1];
      
      // Look for evening entry with sleep quality and next morning entry
      if (currentEntry.timeOfDay === 'evening' && 
          currentEntry.sleepQuality && 
          nextEntry.timeOfDay === 'morning') {
        correlationData.push({
          sleepQuality: currentEntry.sleepQuality,
          nextDayMood: nextEntry.overallMoodIntensity,
          date: nextEntry.date
        });
      }
    }
    
    return correlationData;
  }, [filteredMoodEntries]);

  // Mood Intensity Heat Map Data - Calendar format for CURRENT month
  const moodHeatMapData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Current month, not last month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const heatMapData: { date: string; intensity: number; dayOfWeek: number; weekOfMonth: number; morningCount: number; eveningCount: number }[] = [];
    
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = filteredMoodEntries.filter(entry => entry.date === dateStr);
      
      // Count morning and evening entries separately
      const morningEntries = dayEntries.filter(entry => entry.timeOfDay === 'morning');
      const eveningEntries = dayEntries.filter(entry => entry.timeOfDay === 'evening');
      
      // Calculate average intensity for the day (combining morning and evening)
      const avgIntensity = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.overallMoodIntensity, 0) / dayEntries.length
        : 0;
      
      heatMapData.push({
        date: dateStr,
        intensity: avgIntensity,
        dayOfWeek: d.getDay(),
        weekOfMonth: Math.ceil(d.getDate() / 7),
        morningCount: morningEntries.length,
        eveningCount: eveningEntries.length
      });
    }
    
    return heatMapData;
  }, [filteredMoodEntries]);



  // Calculate insights
  const averageMood = filteredMoodEntries.length > 0 
    ? (filteredMoodEntries.reduce((sum, entry) => sum + (entry.overallMoodIntensity || 5), 0) / filteredMoodEntries.length).toFixed(1)
    : '0';

  const moodTrend = moodIntensityData.length >= 2 
    ? moodIntensityData[moodIntensityData.length - 1].morning > moodIntensityData[0].morning ? 'improving' : 'declining'
    : 'stable';

  // Export functions
  const exportWeightChart = async () => {
    if (weightChartRef.current) {
      const canvas = await html2canvas(weightChartRef.current);
      const link = document.createElement('a');
      link.download = 'weight-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const exportMoodChart = async () => {
    if (moodChartRef.current) {
      const canvas = await html2canvas(moodChartRef.current);
      const link = document.createElement('a');
      link.download = 'mood-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const exportTriggersPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Trigger Events Report', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Total Triggers: ${filteredTriggerEvents.length}`, 20, 55);

    const tableData = filteredTriggerEvents.map(trigger => [
      new Date(trigger.createdAt || '').toLocaleDateString(),
      trigger.eventSituation || 'N/A',
      trigger.emotion || 'N/A',
      trigger.actionTaken || 'N/A',
      trigger.consequence || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Situation', 'Emotion', 'Action Taken', 'Consequence']],
      body: tableData,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51] },
      styles: { fontSize: 8 }
    });

    doc.save('trigger-events-report.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Insights Dashboard</h1>
          <p className="text-gray-400">Your mental health analytics for the past month</p>
        </div>

        {/* Key Statistics */}
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
                <Activity className="h-5 w-5 text-green-400" />
                <h3 className="font-medium text-gray-300">Mood Entries</h3>
              </div>
              <div className="text-2xl font-bold text-green-400 mt-2">{filteredMoodEntries.length}</div>
              <div className="text-sm text-gray-400 mt-1">this month</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-gray-300">Journal Entries</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-2">{filteredThoughts.length}</div>
              <div className="text-sm text-gray-400 mt-1">thoughts recorded</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-green-400" />
                <h3 className="font-medium text-gray-300">Med Compliance</h3>
              </div>
              <div className="text-2xl font-bold text-green-400 mt-2">{medicationStats.compliance}%</div>
              <div className="text-sm text-gray-400 mt-1">{medicationStats.takenOnTime}/{medicationStats.totalMeds} taken</div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Chart with Export */}
        {weightData.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Weight Tracking
              </CardTitle>
              <Button onClick={exportWeightChart} variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
            </CardHeader>
            <CardContent>
              <div ref={weightChartRef} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
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
                      dataKey="weight" 
                      stroke="#F59E0B" 
                      fill="#F59E0B"
                      fillOpacity={0.2}
                      strokeWidth={3}
                      name="Weight (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emoji Mood Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Daily Mood Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emojiMoodData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {emojiMoodData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-300">{day.displayDate}</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-400">Morning:</span>
                          <span className="text-lg">{getMoodEmoji(day.morningMood || '')}</span>
                          <span className="text-xs text-gray-400 capitalize">{day.morningMood || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-400">Evening:</span>
                          <span className="text-lg">{getMoodEmoji(day.eveningMood || '')}</span>
                          <span className="text-xs text-gray-400 capitalize">{day.eveningMood || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">No mood data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep-Mood Correlation Scatter Plot */}
        {sleepMoodData.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sleep Quality vs Next Day Mood
              </CardTitle>
              <p className="text-gray-400 text-sm">How your sleep quality affects your mood the next day</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={sleepMoodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="sleepQuality" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Sleep Quality (1-5)', position: 'insideBottom', offset: -10, style: { fill: '#9CA3AF' } }}
                      domain={[1, 5]}
                    />
                    <YAxis 
                      dataKey="nextDayMood"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Next Day Mood Intensity', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                      domain={[-3, 3]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value, name) => [
                        name === 'nextDayMood' ? `Mood: ${value}` : `Sleep: ${value}/5`,
                        name === 'nextDayMood' ? 'Next Day Mood' : 'Sleep Quality'
                      ]}
                    />
                    <Scatter 
                      dataKey="nextDayMood" 
                      fill="#8B5CF6"
                      fillOpacity={0.8}
                      stroke="#A855F7"
                      strokeWidth={2}
                      r={6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p>💡 Tip: Look for patterns - better sleep quality often correlates with improved mood!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood Intensity Heat Map Calendar */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mood Intensity Calendar - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <p className="text-gray-400 text-sm">Daily average of morning + evening mood intensities (-3 to +3 scale)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-xs text-gray-400 font-medium p-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {Array.from({ length: 42 }, (_, index) => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  const firstDayOfWeek = startOfMonth.getDay();
                  const dayIndex = index - firstDayOfWeek;
                  const currentDate = new Date(startOfMonth);
                  currentDate.setDate(startOfMonth.getDate() + dayIndex);
                  
                  const dateStr = currentDate.toISOString().split('T')[0];
                  const dayData = moodHeatMapData.find(d => d.date === dateStr);
                  
                  const isCurrentMonth = currentDate.getMonth() === today.getMonth();
                  const intensity = dayData?.intensity || 0;
                  const morningCount = dayData?.morningCount || 0;
                  const eveningCount = dayData?.eveningCount || 0;
                  
                  const getIntensityColor = (intensity: number) => {
                    if (intensity === 0) return 'bg-gray-700';
                    if (intensity >= 2) return 'bg-green-600';
                    if (intensity >= 1) return 'bg-green-500';
                    if (intensity >= 0) return 'bg-yellow-500';
                    if (intensity >= -1) return 'bg-orange-500';
                    return 'bg-red-500';
                  };
                  
                  const tooltipText = isCurrentMonth 
                    ? `${currentDate.toLocaleDateString()}\nAvg Mood: ${intensity.toFixed(1)}\nMorning entries: ${morningCount}\nEvening entries: ${eveningCount}`
                    : '';
                  
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative
                        ${isCurrentMonth ? getIntensityColor(intensity) : 'bg-gray-800'}
                        ${isCurrentMonth && intensity !== 0 ? 'text-white' : 'text-gray-400'}
                      `}
                      title={tooltipText}
                    >
                      {isCurrentMonth ? currentDate.getDate() : ''}
                      {isCurrentMonth && (morningCount > 0 || eveningCount > 0) && (morningCount + eveningCount < 2) && (
                        <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full opacity-60"></div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 text-xs">
                <span className="text-gray-400">Less positive</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                </div>
                <span className="text-gray-400">More positive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Mood Intensity Line Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Overall Mood Intensity (1-10)
            </CardTitle>
            <Button onClick={exportMoodChart} variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
          </CardHeader>
          <CardContent>
            {moodIntensityData.length > 0 ? (
              <div ref={moodChartRef} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodIntensityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      domain={[-3, 3]}
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
                    <Line 
                      type="monotone" 
                      dataKey="morning" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                      name="Morning Intensity"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="evening" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                      name="Evening Intensity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">No mood intensity data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trigger Events Export */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Trigger Events
            </CardTitle>
            <Button onClick={exportTriggersPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-orange-400">{filteredTriggerEvents.length}</div>
              <p className="text-gray-400">Total trigger events this month</p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredTriggerEvents.slice(0, 5).map((trigger, index) => (
                  <div key={index} className="p-2 bg-gray-700 rounded text-sm">
                    <div className="font-medium text-orange-300">{trigger.eventSituation}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(trigger.createdAt || '').toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {filteredTriggerEvents.length > 5 && (
                  <div className="text-gray-400 text-sm text-center">
                    +{filteredTriggerEvents.length - 5} more events
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}