import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sun, Moon, Save, Edit, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MoodSelector from "@/components/mood-selector";
import RatingScale from "@/components/rating-scale";
import FormError from "@/components/form-error";
import ErrorBoundary from "@/components/error-boundary";
import { api } from "@/lib/api";
import { insertMoodEntrySchema } from "@shared/schema";
import { getCurrentDate, formatTimeAgo, MOOD_OPTIONS } from "@/lib/constants";
import type { MoodEntry, InsertMoodEntry } from "@shared/schema";
import { z } from "zod";

const formSchema = insertMoodEntrySchema.omit({ userId: true });

export default function MoodTracking() {
  const [entryType, setEntryType] = useState<'morning' | 'evening'>('morning');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: getCurrentDate(),
      timeOfDay: 'morning',
      mood: '',
      intensity: 3,
      hoursSlept: undefined,
      sleepQuality: 3,
      weight: undefined,
      weightUnit: 'kg',
      morningMedication: false,
      eveningMedication: false,
      energyLevel: 3,
      reflectiveComment: '',
      overallDaySummary: '',
      cravingsImpulses: false,
      cravingsTags: [],
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch mood entries with proper typing
  const { 
    data: moodEntries = [], 
    isLoading: isLoadingEntries, 
    error: entriesError 
  } = useQuery({
    queryKey: ['/api/mood-entries'],
    queryFn: async (): Promise<MoodEntry[]> => {
      try {
        return await api.get('/api/mood-entries');
      } catch (error) {
        console.error('Failed to fetch mood entries:', error);
        toast({ 
          title: "Error loading entries", 
          description: error instanceof Error ? error.message : "Failed to load your mood entries", 
          variant: "destructive" 
        });
        return [];
      }
    }
  });

  const createMoodEntry = useMutation({
    mutationFn: (data: InsertMoodEntry) => api.post('/api/mood-entries', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Mood entry saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      form.reset();
      setFormError(null);
    },
    onError: (error: any) => {
      console.error('Failed to save mood entry:', error);
      setFormError(error.message || "Failed to save mood entry");
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save mood entry", 
        variant: "destructive" 
      });
    },
  });

  const updateMoodEntry = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMoodEntry> }) =>
      api.put(`/api/mood-entries/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Mood entry updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      setFormError(null);
    },
    onError: (error: any) => {
      console.error('Failed to update mood entry:', error);
      setFormError(error.message || "Failed to update mood entry");
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update mood entry", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      setFormError(null);
      createMoodEntry.mutate({ ...data, userId: 1, timeOfDay: entryType });
    } catch (error: any) {
      setFormError(error.message || "Failed to submit form");
    }
  };

  const getMoodEmoji = (mood: string) => {
    return MOOD_OPTIONS.find(option => option.value === mood)?.emoji || '😐';
  };

  const handleEntryTypeChange = (type: 'morning' | 'evening') => {
    setEntryType(type);
    form.setValue('timeOfDay', type);
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Mood Tracking</h2>
        <p className="text-slate-400">Track your daily emotional state and related factors</p>
      </div>

      {/* Entry Type Selector */}
      <div className="flex space-x-4 mb-6">
        <Button
          onClick={() => handleEntryTypeChange('morning')}
          variant={entryType === 'morning' ? 'default' : 'secondary'}
          className="flex-1"
        >
          <Sun className="mr-2" size={16} />
          Morning Entry
        </Button>
        <Button
          onClick={() => handleEntryTypeChange('evening')}
          variant={entryType === 'evening' ? 'default' : 'secondary'}
          className="flex-1"
        >
          <Moon className="mr-2" size={16} />
          Evening Entry
        </Button>
      </div>

      {/* Mood Entry Form */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">
            {entryType === 'morning' ? 'Morning Check-in' : 'Evening Reflection'}
          </h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Mood Selection */}
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">How are you feeling?</FormLabel>
                    <FormControl>
                      <MoodSelector
                        selectedMood={field.value}
                        onMoodSelect={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Mood Intensity */}
              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RatingScale
                        label="Intensity (1-5)"
                        value={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hours Slept (Morning only) */}
                {entryType === 'morning' && (
                  <FormField
                    control={form.control}
                    name="hoursSlept"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Hours Slept</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="8"
                            className="bg-slate-700 border-slate-600 text-white"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Sleep Quality (Morning only) */}
                {entryType === 'morning' && (
                  <FormField
                    control={form.control}
                    name="sleepQuality"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RatingScale
                            label="Sleep Quality (from last night)"
                            value={field.value}
                            onChange={field.onChange}
                            color="accent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* Weight Entry (Morning only) */}
                {entryType === 'morning' && (
                  <div>
                    <FormLabel className="text-slate-300 mb-3 block">Weight</FormLabel>
                    <div className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="72.5"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-20">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="lbs">lbs</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Energy Level (Morning only) */}
                {entryType === 'morning' && (
                  <FormField
                    control={form.control}
                    name="energyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RatingScale
                            label="Energy Level"
                            value={field.value}
                            onChange={field.onChange}
                            color="secondary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Medication Toggles - only show relevant one */}
              <div>
                {entryType === 'morning' && (
                  <FormField
                    control={form.control}
                    name="morningMedication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 mb-3 block">Morning Medication Taken?</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-slate-300">Yes, I took my morning medication</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                
                {entryType === 'evening' && (
                  <FormField
                    control={form.control}
                    name="eveningMedication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 mb-3 block">Evening Medication Taken?</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-slate-300">Yes, I took my evening medication</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Evening-specific fields */}
              {entryType === 'evening' && (
                <>
                  <FormField
                    control={form.control}
                    name="reflectiveComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Reflective Comment (optional)</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                            rows={3}
                            placeholder="What went well today? What would you change?"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overallDaySummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Overall Day Summary (1 word)</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="e.g., Productive, Challenging, Peaceful"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cravingsImpulses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 mb-3 block">
                          Did you experience any cravings or impulses?
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-slate-300">
                              {field.value ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={createMoodEntry.isPending}
              >
                <Save className="mr-2" size={16} />
                {createMoodEntry.isPending ? 'Saving...' : `Save ${entryType} Entry`}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Mood History */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Recent Entries</h3>
          </div>
          
          <div className="space-y-4">
            {moodEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No mood entries yet</p>
                <p className="text-sm text-slate-500">Start by logging your first mood entry above</p>
              </div>
            ) : (
              moodEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                    <div>
                      <p className="font-medium text-white capitalize">
                        {entry.mood} ({entry.timeOfDay})
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(entry.date).toLocaleDateString()} - {formatTimeAgo(new Date(entry.createdAt!))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white">{entry.intensity}/5</div>
                      <div className="text-xs text-slate-400">Intensity</div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <Edit size={16} />
                    </Button>
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
