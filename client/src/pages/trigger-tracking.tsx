import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Clock, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import EmotionWheel from "@/components/emotion-wheel";
import { apiRequest } from "@/lib/queryClient";
import { insertTriggerEventSchema } from "@shared/schema";
import { formatTimeAgo, ACTION_OPTIONS, EMOTION_OPTIONS } from "@/lib/constants";
import type { TriggerEvent, InsertTriggerEvent } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTriggerEventSchema.omit({ userId: true });

export default function TriggerTracking() {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventSituation: '',
      emotion: '',
      actionTaken: '',
      consequence: '',
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
      queryClient.invalidateQueries({ queryKey: ['/api/trigger-events'] });
      form.reset();
      setSelectedActions([]);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save trigger event", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTriggerEvent.mutate(data);
  };

  const handleActionSelect = (action: string) => {
    const currentAction = form.getValues('actionTaken');
    if (currentAction === action) {
      form.setValue('actionTaken', '');
      setSelectedActions([]);
    } else {
      form.setValue('actionTaken', action);
      setSelectedActions([action]);
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    return EMOTION_OPTIONS.find(option => option.value === emotion)?.emoji || '😐';
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Trigger Event Tracking</h2>
        <p className="text-slate-400">Log events that trigger emotional responses and track patterns</p>
      </div>

      {/* New Trigger Form */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Log New Trigger Event</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Event/Situation */}
              <FormField
                control={form.control}
                name="eventSituation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">What happened? (Event/Situation)</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        rows={3}
                        placeholder="Describe the situation or event that occurred..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Emotion Wheel */}
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Primary Emotion</FormLabel>
                    <FormControl>
                      <EmotionWheel
                        selectedEmotion={field.value}
                        onEmotionSelect={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Action Taken */}
              <FormField
                control={form.control}
                name="actionTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">What did you do? (Action)</FormLabel>
                    <FormControl>
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                          {ACTION_OPTIONS.map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => handleActionSelect(action)}
                              className={`p-3 rounded-lg transition-colors text-sm ${
                                selectedActions.includes(action)
                                  ? 'bg-primary text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-primary hover:text-white'
                              }`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                          rows={2}
                          placeholder="Describe your action in detail..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Consequence */}
              <FormField
                control={form.control}
                name="consequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">What was the outcome? (Consequence)</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        rows={3}
                        placeholder="How did things turn out? How did you feel afterward?"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Reminder Toggle */}
              <FormField
                control={form.control}
                name="remindLater"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 mb-3 block">
                      Do you want to reflect on this later?
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-slate-300">
                          {field.value ? 'Remind me tonight' : 'No reminder'}
                        </span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createTriggerEvent.isPending}
                >
                  <Save className="mr-2" size={16} />
                  {createTriggerEvent.isPending ? 'Saving...' : 'Save Trigger Event'}
                </Button>
                {form.watch('remindLater') && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      toast({ 
                        title: "Reminder Set", 
                        description: "You'll be reminded to reflect on this event tonight" 
                      });
                    }}
                  >
                    <Clock className="mr-2" size={16} />
                    Set Reminder
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Trigger History */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Trigger History</h3>
            <div className="flex space-x-2">
              <Select defaultValue="">
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Emotions</SelectItem>
                  {EMOTION_OPTIONS.map((emotion) => (
                    <SelectItem key={emotion.value} value={emotion.value}>
                      {emotion.emoji} {emotion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            {triggerEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No trigger events logged yet</p>
                <p className="text-sm text-slate-500">Start by logging your first trigger event above</p>
              </div>
            ) : (
              triggerEvents.map((trigger) => (
                <div key={trigger.id} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getEmotionEmoji(trigger.emotion)}</div>
                      <div>
                        <p className="font-medium text-white capitalize">{trigger.emotion}</p>
                        <p className="text-sm text-slate-400">{formatTimeAgo(new Date(trigger.createdAt!))}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <Edit size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Event:</span>
                      <span className="text-white ml-2">{trigger.eventSituation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Action:</span>
                      <span className="text-white ml-2">{trigger.actionTaken}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Outcome:</span>
                      <span className="text-white ml-2">{trigger.consequence}</span>
                    </div>
                    {trigger.remindLater && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock size={14} className="text-yellow-400" />
                        <span className="text-yellow-400 text-xs">Reminder set for reflection</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
