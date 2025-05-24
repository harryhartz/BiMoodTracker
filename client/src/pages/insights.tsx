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
    // Create clean, minimal PDF document
    const doc = new jsPDF();
    
    // Simple header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Mental Health Tracker', 105, 20, { align: 'center' });
    
    // Main title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Trigger Events Report', 105, 30, { align: 'center' });
    
    // Simple line under title
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(50, 35, 160, 35);
    
    // Report info section
    const infoY = 45;
    
    // Simple info box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(20, infoY, 170, 20, 'S');
    
    // Report metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Generated date
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 25, infoY + 8);
    
    // Event count
    const eventCount = filteredTriggerEvents.length;
    doc.text(`Total Events: ${eventCount}`, 25, infoY + 15);
    
    let yPosition = 75;
    const pageHeight = 270;
    const leftMargin = 25;
    const rightMargin = 185;
    const textWidth = rightMargin - leftMargin;
    
    // Simple footer
    const applyFooter = (pageNum: number) => {
      doc.setPage(pageNum);
      
      // Simple footer line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Mental Health Tracker - Confidential Report', 25, 285);
      
      // Page number
      doc.text(`Page ${pageNum}`, 170, 285);
    };
    
    // Process each trigger event with vertical block layout
    filteredTriggerEvents.forEach((trigger, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        applyFooter(doc.getNumberOfPages());
        yPosition = 20;
      }
      
      // Header: Date + Trigger Severity (colored tag)
      const eventDate = trigger.createdAt ? new Date(trigger.createdAt).toLocaleDateString() : 'No date';
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(eventDate, leftMargin, yPosition);
      
      // Severity tag (light gray background with black text)
      const severity = trigger.emotions.length > 3 ? 'High' : trigger.emotions.length > 1 ? 'Medium' : 'Low';
      doc.setFillColor(240, 240, 240); // Light gray
      doc.setDrawColor(0, 0, 0);
      doc.roundedRect(leftMargin + 50, yPosition - 4, 25, 8, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(severity, leftMargin + 62.5, yPosition, { align: 'center' });
      yPosition += 15;
      
      // What happened? → In a light grey speech bubble box
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('What happened?', leftMargin, yPosition);
      yPosition += 8;
      
      // Speech bubble background (light gray)
      const situationLines = doc.splitTextToSize(trigger.eventSituation, textWidth - 15);
      const situationHeight = situationLines.length * 4 + 8;
      doc.setFillColor(245, 245, 245); // Light gray
      doc.setDrawColor(200, 200, 200); // Gray border
      doc.roundedRect(leftMargin, yPosition - 4, textWidth, situationHeight, 3, 3, 'FD');
      
      // Situation text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(situationLines, leftMargin + 5, yPosition + 2);
      yPosition += situationHeight + 8;
      
      // Emotions → Display as pill-shaped color tags
      if (trigger.emotions.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Emotions', leftMargin, yPosition);
        yPosition += 10;
        
        let emotionX = leftMargin;
        let currentRowY = yPosition;
        
        trigger.emotions.forEach((emotion, i) => {
          const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
          const emotionLabel = emotionData ? emotionData.label : emotion;
          
          // Calculate pill width
          const pillWidth = Math.max(emotionLabel.length * 1.5 + 8, 20);
          
          // Check if we need a new row
          if (emotionX + pillWidth > rightMargin) {
            emotionX = leftMargin;
            currentRowY += 12;
          }
          
          // Draw pill-shaped emotion tag with subtle color
          const colors = [
            [200, 220, 255], // Light blue
            [220, 255, 200], // Light green  
            [255, 220, 200], // Light orange
            [255, 200, 220], // Light pink
            [220, 200, 255]  // Light purple
          ];
          const colorIndex = i % colors.length;
          doc.setFillColor(...colors[colorIndex]);
          doc.setDrawColor(150, 150, 150);
          doc.roundedRect(emotionX, currentRowY - 4, pillWidth, 8, 4, 4, 'FD');
          
          // Emotion text
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(emotionLabel, emotionX + pillWidth/2, currentRowY, { align: 'center' });
          
          emotionX += pillWidth + 5;
        });
        
        yPosition = currentRowY + 15;
      }
      
      // Actions → Bulleted list inside light yellow box
      if (trigger.actionTaken) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Actions', leftMargin, yPosition);
        yPosition += 8;
        
        // Light yellow box background
        const actionLines = doc.splitTextToSize(trigger.actionTaken, textWidth - 15);
        const actionHeight = actionLines.length * 4 + 8;
        doc.setFillColor(255, 255, 220); // Light yellow
        doc.setDrawColor(200, 200, 150); // Yellow-ish border
        doc.roundedRect(leftMargin, yPosition - 4, textWidth, actionHeight, 3, 3, 'FD');
        
        // Action text with bullet
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${actionLines.join(' ')}`, leftMargin + 5, yPosition + 2);
        yPosition += actionHeight + 8;
      }
      
      // Consequences → Red border or faded red box
      if (trigger.consequences.length > 0 && trigger.consequences.some(c => c.trim())) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Consequences', leftMargin, yPosition);
        yPosition += 8;
        
        const consequenceItems = trigger.consequences.filter(c => c.trim());
        let totalHeight = 0;
        
        // Calculate total height needed
        consequenceItems.forEach(consequence => {
          const lines = doc.splitTextToSize(`• ${consequence}`, textWidth - 15);
          totalHeight += lines.length * 4 + 2;
        });
        totalHeight += 6;
        
        // Faded red box
        doc.setFillColor(255, 240, 240); // Light red/pink
        doc.setDrawColor(255, 100, 100); // Red border
        doc.setLineWidth(1);
        doc.roundedRect(leftMargin, yPosition - 4, textWidth, totalHeight, 3, 3, 'FD');
        
        // Consequence items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        consequenceItems.forEach((consequence) => {
          const consequenceLines = doc.splitTextToSize(`• ${consequence}`, textWidth - 15);
          doc.text(consequenceLines, leftMargin + 5, yPosition + 2);
          yPosition += consequenceLines.length * 4 + 2;
        });
        
        yPosition += 10;
      }
      
      // Add spacing before next event
      yPosition += 10;
      
      // Event divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPosition, rightMargin, yPosition);
      yPosition += 15;
    });

    // Apply footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      applyFooter(i);
    }

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
                      label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
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
                    
                    // Calculate position to create organic bubble layout
                    const positions = [
                      { x: 20, y: 20 }, { x: 60, y: 40 }, { x: 30, y: 60 },
                      { x: 70, y: 25 }, { x: 45, y: 75 }, { x: 15, y: 80 },
                      { x: 80, y: 60 }, { x: 25, y: 35 }
                    ];
                    const position = positions[index % positions.length];
                    
                    return (
                      <div
                        key={index}
                        className="absolute group cursor-pointer transform transition-all duration-300 hover:scale-110"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          transform: `translate(-50%, -50%)`,
                        }}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{
                            backgroundColor: moodData.color,
                            fontSize: `${size * 0.3}px`,
                          }}
                        >
                          {moodData.emoji}
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
                    
                    // Different positions for evening to create variety
                    const positions = [
                      { x: 30, y: 25 }, { x: 70, y: 35 }, { x: 20, y: 65 },
                      { x: 80, y: 20 }, { x: 50, y: 70 }, { x: 25, y: 85 },
                      { x: 75, y: 75 }, { x: 40, y: 40 }
                    ];
                    const position = positions[index % positions.length];
                    
                    return (
                      <div
                        key={index}
                        className="absolute group cursor-pointer transform transition-all duration-300 hover:scale-110"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          transform: `translate(-50%, -50%)`,
                        }}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{
                            backgroundColor: moodData.color,
                            fontSize: `${size * 0.3}px`,
                          }}
                        >
                          {moodData.emoji}
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
                  <AreaChart data={sleepMoodData.sort((a, b) => a.sleepQuality - b.sleepQuality)}>
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
                    <Area 
                      type="monotone"
                      dataKey="nextDayMood" 
                      fill="#8B5CF6"
                      stroke="#A855F7"
                      strokeWidth={2}
                      fillOpacity={0.4}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nextDayMood" 
                      stroke="#A855F7" 
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
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