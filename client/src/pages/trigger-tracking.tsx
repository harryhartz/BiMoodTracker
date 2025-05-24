import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Clock, Edit, Plus, X, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTriggerEventSchema } from "@shared/schema";
import { formatTimeAgo, ACTION_OPTIONS, EMOTION_OPTIONS, getCurrentDate } from "@/lib/constants";
import type { TriggerEvent, InsertTriggerEvent } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTriggerEventSchema.omit({ userId: true });

export default function TriggerTracking() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [consequences, setConsequences] = useState<string[]>(['']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventSituation: '',
      emotions: [],
      actionTaken: '',
      consequences: [],
      startDate: getCurrentDate(),
      endDate: null,
      remindLater: false,
    },
  });

  const { data: triggerEvents = [] } = useQuery<TriggerEvent[]>({
    queryKey: ['/api/trigger-events'],
    queryFn: () => fetch('/api/trigger-events').then(res => res.json()),
  });

  const createTriggerEvent = useMutation({
    mutationFn: (data: InsertTriggerEvent) => apiRequest('POST', '/api/trigger-events', data),
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Trigger event saved successfully!" 
      });
      form.reset({
        eventSituation: '',
        emotions: [],
        actionTaken: '',
        consequences: [],
        startDate: getCurrentDate(),
        endDate: null,
        remindLater: false,
      });
      setSelectedEmotions([]);
      setConsequences(['']);
      queryClient.invalidateQueries({ queryKey: ['/api/trigger-events'] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save trigger event. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleEmotionToggle = (emotion: string) => {
    const newEmotions = selectedEmotions.includes(emotion)
      ? selectedEmotions.filter(e => e !== emotion)
      : [...selectedEmotions, emotion];
    
    setSelectedEmotions(newEmotions);
    form.setValue('emotions', newEmotions);
  };

  const addConsequence = () => {
    setConsequences([...consequences, '']);
  };

  const updateConsequence = (index: number, value: string) => {
    const newConsequences = [...consequences];
    newConsequences[index] = value;
    setConsequences(newConsequences);
    form.setValue('consequences', newConsequences.filter(c => c.trim() !== ''));
  };

  const removeConsequence = (index: number) => {
    const newConsequences = consequences.filter((_, i) => i !== index);
    setConsequences(newConsequences);
    form.setValue('consequences', newConsequences.filter(c => c.trim() !== ''));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const payload = {
      ...data,
      userId: 1,
      emotions: selectedEmotions,
      consequences: consequences.filter(c => c.trim() !== ''),
    };
    createTriggerEvent.mutate(payload as InsertTriggerEvent);
  };

  const getEmotionsByCategory = (category: string) => {
    return EMOTION_OPTIONS.filter(emotion => emotion.category === category);
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Ongoing';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Simple Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold mb-2 text-white">
            Trigger Event Tracking
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Track situations that trigger emotional responses and how you handle them
          </p>
        </div>

        {/* Recording Form - Simple Design */}
        <div className="mb-12">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <AlertTriangle className="h-5 w-5 text-slate-400" />
                Record Trigger Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Event Situation */}
                  <FormField
                    control={form.control}
                    name="eventSituation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What happened?</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the situation that triggered your emotional response..."
                            rows={4}
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-700 border-slate-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">End Date (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ''}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Emotions */}
                  <div className="space-y-4">
                    <FormLabel className="text-white">Emotions Experienced</FormLabel>
                    
                    {/* All Emotions in Simple Grid */}
                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {EMOTION_OPTIONS.map((emotion) => (
                          <div key={emotion.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={emotion.value}
                              checked={selectedEmotions.includes(emotion.value)}
                              onCheckedChange={() => handleEmotionToggle(emotion.value)}
                              className="border-slate-400"
                            />
                            <label htmlFor={emotion.value} className="text-sm text-white cursor-pointer">
                              {emotion.emoji} {emotion.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedEmotions.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-700 rounded-lg">
                        {selectedEmotions.map((emotion) => {
                          const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
                          return (
                            <Badge key={emotion} variant="secondary" className="bg-slate-600 text-white">
                              {emotionData?.emoji} {emotionData?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Taken - Simple with Text Input */}
                  <FormField
                    control={form.control}
                    name="actionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">How did you respond?</FormLabel>
                        <div className="space-y-3">
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select a common response..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {ACTION_OPTIONS.map((action) => (
                                  <SelectItem key={action} value={action.toLowerCase().replace(' ', '_')} className="text-white">
                                    {action}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          
                          <div className="text-center text-sm text-slate-400">or</div>
                          
                          <FormControl>
                            <Textarea
                              placeholder="Describe your response in your own words..."
                              value={field.value && !ACTION_OPTIONS.some(action => action.toLowerCase().replace(' ', '_') === field.value) ? field.value : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                              rows={3}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consequences */}
                  <div className="space-y-4">
                    <FormLabel className="text-white">Consequences/Outcomes</FormLabel>
                    {consequences.map((consequence, index) => (
                      <div key={index} className="flex gap-3">
                        <Input
                          value={consequence}
                          onChange={(e) => updateConsequence(index, e.target.value)}
                          placeholder="What happened as a result?"
                          className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        />
                        {consequences.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeConsequence(index)}
                            className="border-slate-600 text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addConsequence}
                      className="w-full border-dashed border-slate-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Another Consequence
                    </Button>
                  </div>

                  {/* Remind Later */}
                  <FormField
                    control={form.control}
                    name="remindLater"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg border border-slate-600">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-white">Remind me to follow up on this</FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                    disabled={createTriggerEvent.isPending}
                  >
                    {createTriggerEvent.isPending ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Trigger Event
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events - Simple at Bottom */}
        <div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Clock className="h-5 w-5 text-slate-400" />
                Recent Trigger Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggerEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-400 mb-2">No trigger events recorded yet</p>
                    <p className="text-slate-500 text-sm">Start tracking your triggers to better understand your patterns</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {triggerEvents.slice(0, 6).map((event) => (
                      <Card key={event.id} className="bg-slate-700 border-slate-600 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                                {formatTimeAgo(event.createdAt!)}
                              </span>
                              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                Trigger
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-white leading-relaxed">
                              {event.eventSituation.length > 80 
                                ? `${event.eventSituation.substring(0, 80)}...` 
                                : event.eventSituation
                              }
                            </p>
                            
                            {event.emotions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {event.emotions.slice(0, 3).map((emotion, idx) => {
                                  const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
                                  return (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-slate-600 text-white">
                                      {emotionData?.emoji} {emotionData?.label || emotion}
                                    </Badge>
                                  );
                                })}
                                {event.emotions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs bg-slate-600 text-slate-400">
                                    +{event.emotions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-slate-400 border-t border-slate-600 pt-2">
                              <div className="flex justify-between items-center">
                                <span>Duration: {calculateDuration(event.startDate, event.endDate)}</span>
                                {event.consequences.length > 0 && (
                                  <span>
                                    • {event.consequences.length} outcome{event.consequences.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}