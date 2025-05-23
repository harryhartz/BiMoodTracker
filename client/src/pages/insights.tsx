import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, ArrowDown, Download, FileText, BarChart3, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
      moodEntries: moodEntries.filter(entry => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt) : new Date(entry.date);
        return entryDate >= cutoffDate;
      }),
      triggerEvents: triggerEvents.filter(event => {
        const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
        return eventDate >= cutoffDate;
      })
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
  const exportTriggersToPDF = () => {
    if (filteredTriggerEvents.length === 0) {
      alert('No trigger data to export');
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Trigger Events Timeline Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    pdf.text(`Time Period: ${timeRange === '1month' ? 'Last Month' : timeRange === '3months' ? 'Last 3 Months' : 'Last 6 Months'}`, pageWidth / 2, yPosition + 6, { align: 'center' });
    pdf.text(`Total Events: ${filteredTriggerEvents.length}`, pageWidth / 2, yPosition + 12, { align: 'center' });

    yPosition += 25;

    // Sort events by date (most recent first)
    const sortedEvents = [...filteredTriggerEvents].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
      return dateB.getTime() - dateA.getTime();
    });

    // Create timeline entries
    sortedEvents.forEach((event, index) => {
      const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      // Timeline marker and date
      pdf.setFontSize(10);
      pdf.setTextColor(60, 120, 180);
      pdf.circle(15, yPosition, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}`, 20, yPosition + 1);
      
      yPosition += 8;
      
      // Emotion badge
      pdf.setFillColor(255, 159, 11);
      pdf.roundedRect(20, yPosition - 3, pdf.getTextWidth(event.emotion) + 6, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text(event.emotion, 23, yPosition + 1);
      
      yPosition += 12;
      
      // Event details
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(10);
      
      // Situation
      pdf.setFont('helvetica', 'bold');
      pdf.text('Situation:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      const situationLines = pdf.splitTextToSize(event.eventSituation, pageWidth - 40);
      pdf.text(situationLines, 20, yPosition + 6);
      yPosition += situationLines.length * 5 + 8;
      
      // Action taken
      pdf.setFont('helvetica', 'bold');
      pdf.text('Action Taken:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      const actionLines = pdf.splitTextToSize(event.actionTaken, pageWidth - 40);
      pdf.text(actionLines, 20, yPosition + 6);
      yPosition += actionLines.length * 5 + 8;
      
      // Consequence
      pdf.setFont('helvetica', 'bold');
      pdf.text('Outcome:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      const consequenceLines = pdf.splitTextToSize(event.consequence, pageWidth - 40);
      pdf.text(consequenceLines, 20, yPosition + 6);
      yPosition += consequenceLines.length * 5 + 8;
      
      // Remind later indicator
      if (event.remindLater) {
        pdf.setTextColor(180, 60, 60);
        pdf.setFontSize(9);
        pdf.text('⚠ Marked for later reflection', 20, yPosition);
        yPosition += 6;
      }
      
      // Separator line
      if (index < sortedEvents.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition + 5, pageWidth - 15, yPosition + 5);
        yPosition += 15;
      }
    });

    // Save the PDF
    pdf.save(`trigger_timeline_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportMoodTrendToPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Mood Trends Report', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    pdf.text(`Period: ${timeRange}`, 20, 45);
    
    let yPos = 60;
    moodTrendData.forEach((entry, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`${entry.displayDate}: Morning ${entry.morning || 'N/A'}, Evening ${entry.evening || 'N/A'}`, 20, yPos);
      yPos += 10;
    });
    
    pdf.save(`mood_trends_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportWeightTrendToPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Weight Tracking Report', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    
    let yPos = 50;
    weightTrendData.forEach((entry, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`${entry.displayDate}: ${entry.weight} ${entry.weightUnit}`, 20, yPos);
      yPos += 10;
    });
    
    pdf.save(`weight_trends_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export chart as PNG
  const exportChartAsPNG = async (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#1F2937', // Gray-800 background
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Failed to export chart. Please try again.');
    }
  };

  // Export dropdown component
  const ExportDropdown = ({ onPDF, onCSV, onPNG }: { onPDF?: () => void, onCSV?: () => void, onPNG?: () => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onPDF && <DropdownMenuItem onClick={onPDF}>Export as PDF</DropdownMenuItem>}
        {onCSV && <DropdownMenuItem onClick={onCSV}>Export as CSV</DropdownMenuItem>}
        {onPNG && <DropdownMenuItem onClick={onPNG}>Export as PNG</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Insights</h1>
          <p className="text-gray-400">Track your progress and identify patterns</p>
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

        {/* Mood Trends Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Mood Trends
            </CardTitle>
            <ExportDropdown 
              onPNG={() => exportChartAsPNG('mood-trends-chart', 'mood_trends')}
            />
          </CardHeader>
          <CardContent>
            <div id="mood-trends-chart" className="h-64">
              {moodTrendData.length > 0 ? (
                <div className="h-full">
                  <h3 className="text-center text-white font-semibold mb-2">Mood Trends</h3>
                  <ResponsiveContainer width="100%" height="calc(100% - 32px)">
                    <LineChart data={moodTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="displayDate" 
                        stroke="#9CA3AF" 
                        label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        domain={[1, 5]} 
                        stroke="#9CA3AF"
                        label={{ value: 'Mood Intensity (1-5)', angle: -90, position: 'insideLeft' }}
                      />
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
                </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-orange-400" />
              Trigger Patterns
            </CardTitle>
            <ExportDropdown 
              onPNG={() => exportChartAsPNG('trigger-patterns-chart', 'trigger_patterns')}
            />
          </CardHeader>
          <CardContent>
            <div id="trigger-patterns-chart" className="h-64">
              {triggerPatternData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={triggerPatternData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="emotion" 
                      stroke="#9CA3AF"
                      label={{ value: 'Emotion Type', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      label={{ value: 'Frequency Count', angle: -90, position: 'insideLeft' }}
                    />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Weight Trend
            </CardTitle>
            <ExportDropdown 
              onPNG={() => exportChartAsPNG('weight-trend-chart', 'weight_trends')}
            />
          </CardHeader>
          <CardContent>
            <div id="weight-trend-chart" className="h-64">
              {weightTrendData.length > 0 ? (
                <div className="h-full">
                  <h3 className="text-center text-white font-semibold mb-2">Weight Trend</h3>
                  <ResponsiveContainer width="100%" height="calc(100% - 32px)">
                    <LineChart data={weightTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="displayDate" 
                        stroke="#9CA3AF"
                        label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                      />
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
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No weight data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sleep vs Mood Correlation */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Sleep vs Mood Correlation
            </CardTitle>
            <ExportDropdown 
              onPNG={() => exportChartAsPNG('sleep-mood-chart', 'sleep_mood_correlation')}
            />
          </CardHeader>
          <CardContent>
            <div id="sleep-mood-chart" className="h-64">
              {sleepMoodData.length > 0 ? (
                <div className="h-full">
                  <h3 className="text-center text-white font-semibold mb-2">Sleep vs Mood Correlation</h3>
                  <ResponsiveContainer width="100%" height="calc(100% - 32px)">
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
              <div className="text-2xl font-bold text-green-400">{medicationCompliance()}%</div>
              <p className="text-xs text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>

          {/* Average Sleep */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Average Sleep</h3>
              <div className="text-2xl font-bold text-blue-400">{averageSleep()}h</div>
              <p className="text-xs text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>

          {/* Mood Entries */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Mood Entries</h3>
              <div className="text-2xl font-bold text-yellow-400">{filteredMoodEntries.length}</div>
              <p className="text-xs text-gray-500">Total entries</p>
            </CardContent>
          </Card>

          {/* Trigger Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-300 mb-2">Trigger Events</h3>
              <div className="text-2xl font-bold text-purple-400">{filteredTriggerEvents.length}</div>
              <p className="text-xs text-gray-500">
                {timeRange === '1month' ? 'This month' : timeRange === '3months' ? 'Past 3 months' : 'Past 6 months'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}