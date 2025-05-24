export const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🤯' },
  { value: 'content', label: 'Content', emoji: '🙂' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'lonely', label: 'Lonely', emoji: '😔' },
];

export const EMOTION_OPTIONS = [
  // Negative emotions
  { value: 'helpless', label: 'Helpless', emoji: '😔', category: 'negative' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', category: 'negative' },
  { value: 'ashamed', label: 'Ashamed', emoji: '😳', category: 'negative' },
  { value: 'hopeless', label: 'Hopeless', emoji: '😞', category: 'negative' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🤯', category: 'negative' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', category: 'negative' },
  { value: 'angry', label: 'Angry', emoji: '😡', category: 'negative' },
  { value: 'fearful', label: 'Fearful', emoji: '😨', category: 'negative' },
  { value: 'sad', label: 'Sad', emoji: '😢', category: 'negative' },
  { value: 'guilty', label: 'Guilty', emoji: '😣', category: 'negative' },
  { value: 'disappointed', label: 'Disappointed', emoji: '😞', category: 'negative' },
  { value: 'stressed', label: 'Stressed', emoji: '😫', category: 'negative' },
  { value: 'lonely', label: 'Lonely', emoji: '😔', category: 'negative' },
  { value: 'worried', label: 'Worried', emoji: '😟', category: 'negative' },
  { value: 'irritated', label: 'Irritated', emoji: '😠', category: 'negative' },
  { value: 'panic', label: 'Panic', emoji: '😱', category: 'negative' },
  { value: 'rejected', label: 'Rejected', emoji: '💔', category: 'negative' },
  { value: 'jealous', label: 'Jealous', emoji: '😒', category: 'negative' },
  
  // Positive emotions
  { value: 'relieved', label: 'Relieved', emoji: '😮‍💨', category: 'positive' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟', category: 'positive' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏', category: 'positive' },
  { value: 'proud', label: 'Proud', emoji: '😌', category: 'positive' },
  { value: 'excited', label: 'Excited', emoji: '🤩', category: 'positive' },
  { value: 'content', label: 'Content', emoji: '😊', category: 'positive' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️', category: 'positive' },
  { value: 'motivated', label: 'Motivated', emoji: '💪', category: 'positive' },
  
  // Neutral emotions
  { value: 'confused', label: 'Confused', emoji: '🤔', category: 'neutral' },
  { value: 'tired', label: 'Tired', emoji: '😴', category: 'neutral' },
  { value: 'numb', label: 'Numb', emoji: '😑', category: 'neutral' },
  { value: 'uncertain', label: 'Uncertain', emoji: '🤷', category: 'neutral' },
];

export const ACTION_OPTIONS = [
  'Shouted',
  'Cried',
  'Walked Away',
  'Deep Breathing',
  'Called Someone',
  'Wrote in Journal',
  'Listened to Music',
  'Went for a Walk',
  'Took Medication',
  'Practiced Meditation',
  'Other'
];

export const MOOD_TAG_OPTIONS = [
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'curious', label: 'Curious', emoji: '🤔' },
  { value: 'inspired', label: 'Inspired', emoji: '✨' },
  { value: 'worried', label: 'Worried', emoji: '😟' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'reflective', label: 'Reflective', emoji: '🪞' },
  { value: 'proud', label: 'Proud', emoji: '😊' },
  { value: 'confused', label: 'Confused', emoji: '🤷' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'melancholic', label: 'Melancholic', emoji: '🌧️' },
  { value: 'determined', label: 'Determined', emoji: '💪' },
];

export const formatTimeAgo = (date: Date | string | null | undefined): string => {
  if (!date) return 'Unknown time';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  return dateObj.toLocaleDateString();
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
