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
  { value: 'anger', label: 'Anger', emoji: '😡' },
  { value: 'fear', label: 'Fear', emoji: '😨' },
  { value: 'shame', label: 'Shame', emoji: '😳' },
  { value: 'sadness', label: 'Sadness', emoji: '😢' },
  { value: 'frustration', label: 'Frustration', emoji: '😤' },
  { value: 'overwhelm', label: 'Overwhelm', emoji: '🤯' },
  { value: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { value: 'disappointment', label: 'Disappointed', emoji: '😞' },
  { value: 'guilt', label: 'Guilt', emoji: '😣' },
  { value: 'jealousy', label: 'Jealousy', emoji: '😒' },
  { value: 'panic', label: 'Panic', emoji: '😱' },
  { value: 'irritation', label: 'Irritation', emoji: '😠' },
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

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
