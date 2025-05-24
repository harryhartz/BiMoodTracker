import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Brain, Weight, Download, FileText, Camera, Pill, Sun, Moon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from "recharts";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EMOTION_OPTIONS } from "@/lib/constants";
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

  // Get mood colors based on emotional category
  const getMoodColor = (mood: string): string => {
    const positiveColors = ['#10B981', '#34D399', '#6EE7B7']; // greens
    const negativeColors = ['#EF4444', '#F87171', '#FCA5A5']; // reds
    const neutralColors = ['#F59E0B', '#FBBF24', '#FCD34D']; // yellows
    const calmColors = ['#3B82F6', '#60A5FA', '#93C5FD']; // blues
    
    const positiveMoods = ['happy', 'excited', 'content', 'grateful', 'hopeful', 'peaceful'];
    const negativeMoods = ['sad', 'anxious', 'angry', 'frustrated', 'stressed', 'overwhelmed', 'lonely'];
    const neutralMoods = ['tired', 'calm'];
    
    if (positiveMoods.includes(mood.toLowerCase())) {
      return positiveColors[Math.floor(Math.random() * positiveColors.length)];
    } else if (negativeMoods.includes(mood.toLowerCase())) {
      return negativeColors[Math.floor(Math.random() * negativeColors.length)];
    } else if (neutralMoods.includes(mood.toLowerCase())) {
      return neutralColors[Math.floor(Math.random() * neutralColors.length)];
    } else {
      return calmColors[Math.floor(Math.random() * calmColors.length)];
    }
  };

  // Process mood frequency data separately for morning and evening
  const morningMoodData = useMemo(() => {
    const morningEntries = filteredMoodEntries.filter(entry => entry.timeOfDay === 'morning');
    const moodCounts: Record<string, number> = {};
    
    morningEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        emoji: getMoodEmoji(mood),
        percentage: Math.round((count / morningEntries.length) * 100),
        color: getMoodColor(mood)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMoodEntries, getMoodColor]);

  const eveningMoodData = useMemo(() => {
    const eveningEntries = filteredMoodEntries.filter(entry => entry.timeOfDay === 'evening');
    const moodCounts: Record<string, number> = {};
    
    eveningEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        emoji: getMoodEmoji(mood),
        percentage: Math.round((count / eveningEntries.length) * 100),
        color: getMoodColor(mood)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMoodEntries, getMoodColor]);

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
          currentEntry.sleepQuality !== undefined && 
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
    
    // Professional header with better spacing
    doc.setFontSize(22);
    doc.setFont("helvetica", 'bold');
    doc.text('Trigger Events Report', 105, 25, { align: 'center' });
    
    // Header line
    doc.setLineWidth(0.5);
    doc.line(30, 35, 180, 35);
    
    // Report info
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 30, 45);
    doc.text(`Total Events: ${filteredTriggerEvents.length}`, 30, 52);
    
    let yPosition = 70;
    const pageHeight = 260;
    const leftMargin = 30;
    const rightMargin = 180;
    const textWidth = rightMargin - leftMargin;
    
    filteredTriggerEvents.forEach((trigger, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Event header with background
      doc.setFillColor(245, 245, 245);
      doc.rect(leftMargin - 5, yPosition - 3, textWidth + 10, 12, 'F');
      
      doc.setFontSize(12);
      doc.setFont("helvetica", 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Event ${index + 1}`, leftMargin, yPosition + 4);
      doc.text(`${new Date(trigger.createdAt || '').toLocaleDateString()}`, rightMargin - 30, yPosition + 4);
      yPosition += 18;
      
      // Situation
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      doc.text('Situation:', leftMargin, yPosition);
      yPosition += 6;
      
      doc.setFont("helvetica", 'normal');
      doc.setFontSize(9);
      const situationLines = doc.splitTextToSize(trigger.eventSituation, textWidth - 5);
      doc.text(situationLines, leftMargin + 3, yPosition);
      yPosition += situationLines.length * 4 + 8;
      
      // Emotions in a more compact format
      if (trigger.emotions.length > 0) {
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(10);
        doc.text('Emotions:', leftMargin, yPosition);
        
        doc.setFont("helvetica", 'normal');
        doc.setFontSize(9);
        const emotions = trigger.emotions.map(emotion => {
          const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
          return emotionData ? emotionData.label : emotion;
        }).join(', ');
        
        const emotionLines = doc.splitTextToSize(emotions, textWidth - 50);
        doc.text(emotionLines, leftMargin + 50, yPosition);
        yPosition += Math.max(emotionLines.length * 4, 6) + 6;
      }
      
      // Action taken
      if (trigger.actionTaken) {
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(10);
        doc.text('Action:', leftMargin, yPosition);
        yPosition += 6;
        
        doc.setFont("helvetica", 'normal');
        doc.setFontSize(9);
        const actionLines = doc.splitTextToSize(trigger.actionTaken, textWidth - 5);
        doc.text(actionLines, leftMargin + 3, yPosition);
        yPosition += actionLines.length * 4 + 8;
      }
      
      // Consequences
      if (trigger.consequences.length > 0 && trigger.consequences.some(c => c.trim())) {
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(10);
        doc.text('Consequences:', leftMargin, yPosition);
        yPosition += 6;
        
        doc.setFont("helvetica", 'normal');
        doc.setFontSize(9);
        trigger.consequences.forEach(consequence => {
          if (consequence.trim()) {
            const consequenceLines = doc.splitTextToSize(`• ${consequence}`, textWidth - 5);
            doc.text(consequenceLines, leftMargin + 3, yPosition);
            yPosition += consequenceLines.length * 4 + 3;
          }
        });
        yPosition += 5;
      }
      
      // Duration and spacing
      const duration = trigger.endDate 
        ? `${Math.ceil((new Date(trigger.endDate).getTime() - new Date(trigger.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
        : 'Ongoing';
      
      doc.setFont("helvetica", 'bold');
      doc.setFontSize(9);
      doc.text(`Duration: ${duration}`, leftMargin, yPosition);
      yPosition += 20;
    });

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save('trigger-events-report.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Average Mood</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{averageMood}</h3>
                  <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
                </div>
                <div className="rounded-full p-3 bg-blue-500/20 text-blue-500">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <Badge variant="outline" className={
                  moodTrend === 'improving' 
                    ? 'bg-green-500/20 text-green-500 border-green-500' 
                    : moodTrend === 'declining' 
                      ? 'bg-red-500/20 text-red-500 border-red-500'
                      : 'bg-yellow-500/20 text-yellow-500 border-yellow-500'
                }>
                  {moodTrend === 'improving' ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
                  {moodTrend === 'improving' ? 'Improving' : moodTrend === 'declining' ? 'Declining' : 'Stable'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Trigger Events</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{filteredTriggerEvents.length}</h3>
                  <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
                </div>
                <div className="rounded-full p-3 bg-purple-500/20 text-purple-500">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="text-xs h-7 border-gray-600" onClick={exportTriggersPDF}>
                  <Download className="h-3 w-3 mr-1" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Journal Entries</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{filteredThoughts.length}</h3>
                  <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
                </div>
                <div className="rounded-full p-3 bg-green-500/20 text-green-500">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Medication Compliance</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{medicationStats.compliance}%</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {medicationStats.takenOnTime}/{medicationStats.totalMeds} doses taken
                  </p>
                </div>
                <div className="rounded-full p-3 bg-orange-500/20 text-orange-500">
                  <Pill className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Weight Chart with Export - Moved to top */}
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
                      label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      dataKey="weight"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                      domain={[25, 'dataMax']}
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
                      label={{ value: 'Sleep Quality (0-4)', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                      domain={[0, 4]}
                      type="number"
                      allowDecimals={false}
                    />
                    <YAxis 
                      dataKey="nextDayMood"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Next Day Mood (-2 to +2)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                      domain={[-2, 2]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value, name) => [
                        name === 'nextDayMood' ? `Mood: ${value}` : `Sleep: ${value}/4`,
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
                      name="Sleep-Mood"
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

        {/* Morning & Evening Mood Bubble Pack Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Morning Moods Bubble Pack */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-400" />
                Morning Mood Patterns
              </CardTitle>
              <p className="text-gray-400 text-sm">Bubble size represents frequency</p>
            </CardHeader>
            <CardContent>
              {morningMoodData.length > 0 ? (
                <div className="relative w-full h-80 bg-gray-700 rounded-lg overflow-hidden">
                  {morningMoodData.map((moodData, index) => {
                    const maxSize = 120;
                    const minSize = 40;
                    const maxCount = Math.max(...morningMoodData.map(m => m.count));
                    const size = minSize + (moodData.count / maxCount) * (maxSize - minSize);
                    
                    // Position bubbles with slight randomness but keep in view
                    const top = Math.max(20, Math.min(280, 40 + Math.random() * 200));
                    const left = Math.max(20, Math.min(280, 40 + Math.random() * 200));
                    
                    return (
                      <div 
                        key={`morning-${moodData.mood}`}
                        className="absolute group cursor-pointer transform transition-all duration-300 hover:scale-110"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          top: `${top - size/2}px`,
                          left: `${left - size/2}px`,
                          backgroundColor: moodData.color,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${Math.max(16, Math.min(36, 16 + (size - minSize) / 2))}px`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          zIndex: 10 - index
                        }}
                      >
                        <div className="text-center">
                          <div>{moodData.emoji}</div>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                            <div className="text-xs font-medium capitalize">{moodData.mood}</div>
                            <div className="text-xs">{moodData.count}x ({moodData.percentage}%)</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                  <div className="text-center text-gray-400">
                    <Sun className="h-8 w-8 mx-auto mb-2" />
                    <p>No morning mood data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evening Moods Bubble Pack */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-400" />
                Evening Mood Patterns
              </CardTitle>
              <p className="text-gray-400 text-sm">Bubble size represents frequency</p>
            </CardHeader>
            <CardContent>
              {eveningMoodData.length > 0 ? (
                <div className="relative w-full h-80 bg-gray-700 rounded-lg overflow-hidden">
                  {eveningMoodData.map((moodData, index) => {
                    const maxSize = 120;
                    const minSize = 40;
                    const maxCount = Math.max(...eveningMoodData.map(m => m.count));
                    const size = minSize + (moodData.count / maxCount) * (maxSize - minSize);
                    
                    // Position bubbles with slight randomness but keep in view
                    const top = Math.max(20, Math.min(280, 40 + Math.random() * 200));
                    const left = Math.max(20, Math.min(280, 40 + Math.random() * 200));
                    
                    return (
                      <div 
                        key={`evening-${moodData.mood}`}
                        className="absolute group cursor-pointer transform transition-all duration-300 hover:scale-110"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          top: `${top - size/2}px`,
                          left: `${left - size/2}px`,
                          backgroundColor: moodData.color,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${Math.max(16, Math.min(36, 16 + (size - minSize) / 2))}px`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          zIndex: 10 - index
                        }}
                      >
                        <div className="text-center">
                          <div>{moodData.emoji}</div>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                            <div className="text-xs font-medium capitalize">{moodData.mood}</div>
                            <div className="text-xs">{moodData.count}x ({moodData.percentage}%)</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                  <div className="text-center text-gray-400">
                    <Moon className="h-8 w-8 mx-auto mb-2" />
                    <p>No evening mood data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mood Intensity Heat Map Calendar */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mood Intensity Calendar - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <p className="text-gray-400 text-sm">Daily average of morning + evening mood intensities (-2 to +2 scale)</p>
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
                  currentDate.setDate(currentDate.getDate() + dayIndex);
                  
                  // Only show days in the current month
                  const isCurrentMonth = currentDate.getMonth() === today.getMonth();
                  
                  if (!isCurrentMonth) {
                    return <div key={`day-${index}`} className="p-2 rounded-lg bg-gray-800 opacity-40" />;
                  }
                  
                  const dateStr = currentDate.toISOString().split('T')[0];
                  const dayData = moodHeatMapData.find(d => d.date === dateStr);
                  const hasData = dayData && (dayData.morningCount > 0 || dayData.eveningCount > 0);
                  
                  // Color gradient for mood intensity
                  let bgColor = 'bg-gray-700'; 
                  let textColor = 'text-gray-400';
                  
                  if (hasData) {
                    const intensity = dayData.intensity;
                    if (intensity > 1) {
                      bgColor = 'bg-green-800';
                      textColor = 'text-white';
                    } else if (intensity > 0.5) {
                      bgColor = 'bg-green-700';
                      textColor = 'text-white';
                    } else if (intensity > 0) {
                      bgColor = 'bg-green-600';
                      textColor = 'text-white';
                    } else if (intensity === 0) {
                      bgColor = 'bg-gray-600';
                      textColor = 'text-white';
                    } else if (intensity > -0.5) {
                      bgColor = 'bg-orange-600';
                      textColor = 'text-white';
                    } else if (intensity > -1) {
                      bgColor = 'bg-red-600';
                      textColor = 'text-white';
                    } else {
                      bgColor = 'bg-red-700';
                      textColor = 'text-white';
                    }
                  }
                  
                  return (
                    <div 
                      key={`day-${index}`}
                      className={`p-2 rounded-lg ${bgColor} hover:opacity-80 transition-opacity relative cursor-pointer`}
                    >
                      <div className={`text-xs font-medium ${textColor}`}>
                        {currentDate.getDate()}
                      </div>
                      {hasData && (
                        <div className="flex justify-center mt-1 space-x-1">
                          {dayData.morningCount > 0 && (
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                          )}
                          {dayData.eveningCount > 0 && (
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-700 rounded-sm mr-1" />
                  <span>Very Negative</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-600 rounded-sm mr-1" />
                  <span>Negative</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-sm mr-1" />
                  <span>Neutral</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-sm mr-1" />
                  <span>Positive</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-800 rounded-sm mr-1" />
                  <span>Very Positive</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Mood Intensity Line Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Overall Mood Intensity (1-10)
            </CardTitle>
            <Button onClick={exportMoodChart} variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
          </CardHeader>
          <CardContent>
            <div ref={moodChartRef} className="h-80">
              {moodIntensityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodIntensityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      domain={[-2, 2]}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Mood Intensity (-2 to +2)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
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
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                  <p className="text-gray-400">No mood intensity data available</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-4">
              <div className="flex items-center text-sm text-gray-400 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Morning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Evening</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}