import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Brain, Weight, Download, FileText, Camera, Pill } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { MoodEntry, TriggerEvent, Thought, Medication } from "@shared/schema";

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

  // Process mood data for morning and evening comparison
  const moodComparisonData = useMemo(() => {
    return filteredMoodEntries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, entry) => {
        const date = entry.date;
        const existingDay = acc.find(d => d.date === date);
        if (existingDay) {
          if (entry.timeOfDay === 'morning') existingDay.morning = entry.intensity;
          if (entry.timeOfDay === 'evening') existingDay.evening = entry.intensity;
        } else {
          const newDay: any = {
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
          if (entry.timeOfDay === 'morning') newDay.morning = entry.intensity;
          if (entry.timeOfDay === 'evening') newDay.evening = entry.intensity;
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



  // Calculate insights
  const averageMood = filteredMoodEntries.length > 0 
    ? (filteredMoodEntries.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / filteredMoodEntries.length).toFixed(1)
    : '0';

  const moodTrend = moodComparisonData.length >= 2 
    ? moodComparisonData[moodComparisonData.length - 1].morning > moodComparisonData[0].morning ? 'improving' : 'declining'
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
                  <LineChart data={weightData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Morning vs Evening Mood Chart with Export */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Morning vs Evening Mood
            </CardTitle>
            <Button onClick={exportMoodChart} variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
          </CardHeader>
          <CardContent>
            {moodComparisonData.length > 0 ? (
              <div ref={moodChartRef} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodComparisonData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="morning" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                      name="Morning Mood"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="evening" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                      name="Evening Mood"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">No mood comparison data available</p>
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