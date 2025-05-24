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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trigger Event Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track situations that trigger emotional responses and how you handle them
        </p>
      </div>

      {/* Recording Form - Full Width */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
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
                      <FormLabel>What happened?</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the situation that triggered your emotional response..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>End Date (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ''}
                            placeholder="Leave empty if ongoing"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Emotions */}
                <div className="space-y-4">
                  <FormLabel>Emotions Experienced</FormLabel>
                  
                  {/* Negative Emotions */}
                  <div>
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Challenging Emotions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getEmotionsByCategory('negative').map((emotion) => (
                        <div key={emotion.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={emotion.value}
                            checked={selectedEmotions.includes(emotion.value)}
                            onCheckedChange={() => handleEmotionToggle(emotion.value)}
                          />
                          <label htmlFor={emotion.value} className="text-sm">
                            {emotion.emoji} {emotion.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Positive Emotions */}
                  <div>
                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Positive Emotions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getEmotionsByCategory('positive').map((emotion) => (
                        <div key={emotion.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={emotion.value}
                            checked={selectedEmotions.includes(emotion.value)}
                            onCheckedChange={() => handleEmotionToggle(emotion.value)}
                          />
                          <label htmlFor={emotion.value} className="text-sm">
                            {emotion.emoji} {emotion.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Neutral Emotions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Neutral Emotions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getEmotionsByCategory('neutral').map((emotion) => (
                        <div key={emotion.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={emotion.value}
                            checked={selectedEmotions.includes(emotion.value)}
                            onCheckedChange={() => handleEmotionToggle(emotion.value)}
                          />
                          <label htmlFor={emotion.value} className="text-sm">
                            {emotion.emoji} {emotion.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedEmotions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedEmotions.map((emotion) => {
                        const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
                        return (
                          <Badge key={emotion} variant="secondary">
                            {emotionData?.emoji} {emotionData?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Taken */}
                <FormField
                  control={form.control}
                  name="actionTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How did you respond?</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your response" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_OPTIONS.map((action) => (
                              <SelectItem key={action} value={action.toLowerCase().replace(' ', '_')}>
                                {action}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Consequences */}
                <div className="space-y-4">
                  <FormLabel>Consequences/Outcomes</FormLabel>
                  {consequences.map((consequence, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={consequence}
                        onChange={(e) => updateConsequence(index, e.target.value)}
                        placeholder="What happened as a result?"
                        className="flex-1"
                      />
                      {consequences.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeConsequence(index)}
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
                    className="w-full"
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
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Remind me to follow up on this</FormLabel>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
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

      {/* Recent Events - Moved to Bottom */}
      <div className="mt-12">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <Clock className="h-5 w-5 text-blue-400" />
              Recent Trigger Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {triggerEvents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                  <p className="text-slate-400 text-lg mb-2">No trigger events recorded yet</p>
                  <p className="text-slate-500 text-sm">Start tracking your triggers to better understand your patterns</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {triggerEvents.slice(0, 6).map((event) => (
                    <Card key={event.id} className="bg-slate-700/50 border-slate-600 hover:border-slate-500 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                              {formatTimeAgo(event.createdAt!)}
                            </span>
                            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-300">
                              Trigger
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-200 leading-relaxed">
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

                          <div className="text-xs text-slate-400 border-t border-slate-600 pt-2">
                            <div className="flex justify-between items-center">
                              <span>Duration: {calculateDuration(event.startDate, event.endDate)}</span>
                              {event.consequences.length > 0 && (
                                <span className="text-orange-400">
                                  • {event.consequences.length} consequence{event.consequences.length > 1 ? 's' : ''}
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
  );
}