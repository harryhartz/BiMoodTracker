import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ArrowDown, Download, FileText, BarChart3, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

  // Export functions
  const exportTriggersToCSV = () => {
    if (filteredTriggerEvents.length === 0) {
      alert('No trigger data to export');
      return;
    }

    const headers = ['Date', 'Time', 'Event/Situation', 'Emotion', 'Action Taken', 'Consequence', 'Remind Later'];
    const csvContent = [
      headers.join(','),
      ...filteredTriggerEvents.map(event => {
        const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
        return [
          eventDate.toLocaleDateString(),
          eventDate.toLocaleTimeString(),
          `"${event.eventSituation.replace(/"/g, '""')}"`,
          event.emotion,
          `"${event.actionTaken.replace(/"/g, '""')}"`,
          `"${event.consequence.replace(/"/g, '""')}"`,
          event.remindLater ? 'Yes' : 'No'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `triggers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

    // Summary statistics page
    if (triggerInsights) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Pattern Analysis Summary', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 25;
      
      // Statistics
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Insights:', 20, yPosition);
      yPosition += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      pdf.text(`• Most common emotion: ${triggerInsights.topEmotion[0]} (${triggerInsights.topEmotion[1]} times)`, 25, yPosition);
      yPosition += 8;
      
      pdf.text(`• Most frequent action: ${triggerInsights.topAction[0]} (${triggerInsights.topAction[1]} times)`, 25, yPosition);
      yPosition += 8;
      
      pdf.text(`• Most triggering day: ${triggerInsights.mostTriggeringDay[0]} (${triggerInsights.mostTriggeringDay[1]} events)`, 25, yPosition);
      yPosition += 8;
      
      pdf.text(`• Events marked for reflection: ${triggerInsights.remindLaterCount}`, 25, yPosition);
    }

    // Save the PDF
    pdf.save(`trigger_timeline_${new Date().toISOString().split('T')[0]}.pdf`);
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
      const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
      const day = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="triggers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ArrowDown className="h-4 w-4 mr-2" />
              Trigger Analysis & Export
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
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={exportTriggersToPDF} className="bg-red-600 hover:bg-red-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF Timeline
                  </Button>
                  <Button onClick={exportTriggersToCSV} variant="outline" className="border-gray-600 hover:bg-gray-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
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
                    {filteredTriggerEvents.slice(0, 10).map((event) => {
                      const eventDate = event.createdAt ? new Date(event.createdAt) : new Date();
                      return (
                        <div key={event.id} className="p-3 bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-400">
                              {eventDate.toLocaleDateString()} - {eventDate.toLocaleTimeString()}
                            </span>
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                              {event.emotion}
                            </span>
                          </div>
                          <p className="text-white mb-1"><strong>Situation:</strong> {event.eventSituation}</p>
                          <p className="text-gray-300 mb-1"><strong>Action:</strong> {event.actionTaken}</p>
                          <p className="text-gray-300"><strong>Outcome:</strong> {event.consequence}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No trigger events recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-300 mb-2">Mood Entries</h3>
                  <p className="text-2xl font-bold text-yellow-400">{filteredMoodEntries.length}</p>
                  <p className="text-sm text-gray-500">Total entries</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-300 mb-2">Trigger Events</h3>
                  <p className="text-2xl font-bold text-purple-400">{filteredTriggerEvents.length}</p>
                  <p className="text-sm text-gray-500">Logged events</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}