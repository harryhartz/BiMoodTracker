import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertThoughtSchema } from "@shared/schema";
import { formatTimeAgo, MOOD_TAG_OPTIONS } from "@/lib/constants";
import type { Thought, InsertThought } from "@shared/schema";
import { z } from "zod";

const formSchema = insertThoughtSchema.omit({ userId: true });

export default function Thoughts() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMood, setFilterMood] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      moodTags: [],
    },
  });

  const { data: thoughts = [] } = useQuery<Thought[]>({
    queryKey: ['/api/thoughts'],
    queryFn: async () => {
      const res = await fetch('/api/thoughts');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const createThought = useMutation({
    mutationFn: (data: InsertThought) => apiRequest('POST', '/api/thoughts', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Thought saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/thoughts'] });
      form.reset();
      setSelectedTags([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save thought", variant: "destructive" });
    },
  });

  const deleteThought = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/thoughts/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Thought deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/thoughts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete thought", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createThought.mutate({ ...data, moodTags: selectedTags });
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const getMoodTagEmoji = (tag: string) => {
    return MOOD_TAG_OPTIONS.find(option => option.value === tag)?.emoji || '🏷️';
  };

  const filteredThoughts = thoughts.filter(thought => {
    const matchesSearch = searchQuery === '' || 
      thought.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = filterMood === '' || filterMood === 'all' || 
      (thought.moodTags && thought.moodTags.includes(filterMood));
    return matchesSearch && matchesMood;
  });

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Random Thoughts</h2>
        <p className="text-slate-400">Capture your thoughts and tag them with relevant moods</p>
      </div>

      {/* New Thought Form */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Capture a Thought</h3>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Thought Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">What's on your mind?</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-4 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        rows={5}
                        placeholder="Write down your thoughts, feelings, or observations..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Mood Tags */}
              <div>
                <FormLabel className="text-slate-300 mb-3 block">Tag with mood (optional)</FormLabel>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {MOOD_TAG_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => handleTagSelect(mood.value)}
                      className={`p-3 rounded-lg transition-all duration-200 text-center group hover:scale-105 ${
                        selectedTags.includes(mood.value)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 hover:bg-purple-600"
                      }`}
                    >
                      <div className="text-lg mb-1">{mood.emoji}</div>
                      <div className={`text-xs ${
                        selectedTags.includes(mood.value)
                          ? "text-white"
                          : "text-slate-400 group-hover:text-white"
                      }`}>
                        {mood.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={createThought.isPending}
              >
                <Save className="mr-2" size={16} />
                {createThought.isPending ? 'Saving...' : 'Save Thought'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Thoughts History */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Your Thoughts</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  className="bg-slate-700 border-slate-600 text-white pl-10"
                  placeholder="Search thoughts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterMood} onValueChange={setFilterMood}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-40">
                  <SelectValue placeholder="Filter by mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {MOOD_TAG_OPTIONS.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredThoughts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">
                  {thoughts.length === 0 ? 'No thoughts captured yet' : 'No thoughts match your search'}
                </p>
                <p className="text-sm text-slate-500">
                  {thoughts.length === 0 
                    ? 'Start by capturing your first thought above' 
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            ) : (
              filteredThoughts.map((thought) => (
                <div key={thought.id} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {thought.moodTags && thought.moodTags.length > 0 
                          ? getMoodTagEmoji(thought.moodTags[0])
                          : '💭'
                        }
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">
                          {formatTimeAgo(new Date(thought.createdAt!))}
                        </p>
                        {thought.moodTags && Array.isArray(thought.moodTags) && thought.moodTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {thought.moodTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => deleteThought.mutate(thought.id)}
                        disabled={deleteThought.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-white leading-relaxed">{thought.content}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}