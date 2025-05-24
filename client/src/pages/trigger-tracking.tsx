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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header with calm colors */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3 text-slate-700 dark:text-slate-200">
            Trigger Event Tracking
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Understand your emotional patterns by tracking situations that trigger responses and how you handle them
          </p>
        </div>

        {/* Recording Form - Enhanced Design */}
        <div className="mb-16">
          <Card className="bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-600/50 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl text-slate-700 dark:text-slate-100">
                Record Trigger Event
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Event Situation */}
                  <FormField
                    control={form.control}
                    name="eventSituation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-lg">What happened?</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the situation that triggered your emotional response..."
                            rows={4}
                            className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 min-h-[100px] focus:border-orange-500 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-700/50 border-slate-600 text-slate-200" />
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
                          <FormLabel className="text-slate-200">End Date (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ''}
                              placeholder="Leave empty if ongoing"
                              className="bg-slate-700/50 border-slate-600 text-slate-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Emotions */}
                  <div className="space-y-6">
                    <FormLabel className="text-slate-200 text-lg">Emotions Experienced</FormLabel>
                    
                    {/* Negative Emotions */}
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <h4 className="text-sm font-medium text-red-400 mb-3">Challenging Emotions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getEmotionsByCategory('negative').map((emotion) => (
                          <div key={emotion.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={emotion.value}
                              checked={selectedEmotions.includes(emotion.value)}
                              onCheckedChange={() => handleEmotionToggle(emotion.value)}
                              className="border-red-400 data-[state=checked]:bg-red-500"
                            />
                            <label htmlFor={emotion.value} className="text-sm text-slate-300 cursor-pointer">
                              {emotion.emoji} {emotion.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Positive Emotions */}
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <h4 className="text-sm font-medium text-green-400 mb-3">Positive Emotions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getEmotionsByCategory('positive').map((emotion) => (
                          <div key={emotion.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={emotion.value}
                              checked={selectedEmotions.includes(emotion.value)}
                              onCheckedChange={() => handleEmotionToggle(emotion.value)}
                              className="border-green-400 data-[state=checked]:bg-green-500"
                            />
                            <label htmlFor={emotion.value} className="text-sm text-slate-300 cursor-pointer">
                              {emotion.emoji} {emotion.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Neutral Emotions */}
                    <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Neutral Emotions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getEmotionsByCategory('neutral').map((emotion) => (
                          <div key={emotion.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={emotion.value}
                              checked={selectedEmotions.includes(emotion.value)}
                              onCheckedChange={() => handleEmotionToggle(emotion.value)}
                              className="border-slate-400 data-[state=checked]:bg-slate-500"
                            />
                            <label htmlFor={emotion.value} className="text-sm text-slate-300 cursor-pointer">
                              {emotion.emoji} {emotion.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedEmotions.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-700/30 rounded-lg">
                        {selectedEmotions.map((emotion) => {
                          const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
                          return (
                            <Badge key={emotion} variant="secondary" className="bg-orange-500/20 text-orange-300">
                              {emotionData?.emoji} {emotionData?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Taken - Enhanced with Text Input */}
                  <FormField
                    control={form.control}
                    name="actionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-lg">How did you respond?</FormLabel>
                        <div className="space-y-4">
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-orange-500">
                                <SelectValue placeholder="Select a common response..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {ACTION_OPTIONS.map((action) => (
                                  <SelectItem key={action} value={action.toLowerCase().replace(' ', '_')} className="text-slate-200 focus:bg-slate-700">
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
                              className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 min-h-[80px] focus:border-orange-500 transition-colors"
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
                    <FormLabel className="text-slate-200 text-lg">Consequences/Outcomes</FormLabel>
                    {consequences.map((consequence, index) => (
                      <div key={index} className="flex gap-3">
                        <Input
                          value={consequence}
                          onChange={(e) => updateConsequence(index, e.target.value)}
                          placeholder="What happened as a result?"
                          className="flex-1 bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                        />
                        {consequences.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeConsequence(index)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
                      className="w-full border-dashed border-slate-600 text-slate-300 hover:bg-slate-700/50"
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
                      <FormItem className="flex items-center space-x-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="text-slate-200">Remind me to follow up on this</FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg py-6 shadow-lg"
                    disabled={createTriggerEvent.isPending}
                  >
                    {createTriggerEvent.isPending ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Trigger Event
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events - Enhanced at Bottom */}
        <div>
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-slate-100">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                Recent Trigger Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {triggerEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertTriangle className="mx-auto h-16 w-16 text-slate-500 mb-6" />
                    <p className="text-slate-400 text-xl mb-3">No trigger events recorded yet</p>
                    <p className="text-slate-500 text-lg">Start tracking your triggers to better understand your patterns</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {triggerEvents.slice(0, 6).map((event) => (
                      <Card key={event.id} className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border-slate-600/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full font-medium">
                                {formatTimeAgo(event.createdAt!)}
                              </span>
                              <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-300 bg-orange-500/10">
                                Trigger
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                              {event.eventSituation.length > 100 
                                ? `${event.eventSituation.substring(0, 100)}...` 
                                : event.eventSituation
                              }
                            </p>
                            
                            {event.emotions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {event.emotions.slice(0, 3).map((emotion, idx) => {
                                  const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
                                  return (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-slate-600/50 text-slate-300">
                                      {emotionData?.emoji} {emotionData?.label || emotion}
                                    </Badge>
                                  );
                                })}
                                {event.emotions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs bg-slate-600/50 text-slate-400">
                                    +{event.emotions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-slate-400 border-t border-slate-600/50 pt-3">
                              <div className="flex justify-between items-center">
                                <span>Duration: {calculateDuration(event.startDate, event.endDate)}</span>
                                {event.consequences.length > 0 && (
                                  <span className="text-orange-400">
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