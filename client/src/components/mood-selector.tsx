import { MOOD_OPTIONS } from "@/lib/constants";

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: string) => void;
}

export default function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onMoodSelect(mood.value)}
          className={`p-4 rounded-xl transition-all duration-200 text-center group hover:scale-105 ${
            selectedMood === mood.value
              ? "bg-primary text-white"
              : "bg-slate-700 hover:bg-primary"
          }`}
        >
          <div className="text-2xl mb-2">{mood.emoji}</div>
          <div className={`text-xs ${
            selectedMood === mood.value
              ? "text-white"
              : "text-slate-400 group-hover:text-white"
          }`}>
            {mood.label}
          </div>
        </button>
      ))}
    </div>
  );
}
