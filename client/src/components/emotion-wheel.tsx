import { EMOTION_OPTIONS } from "@/lib/constants";

interface EmotionWheelProps {
  selectedEmotion?: string;
  onEmotionSelect: (emotion: string) => void;
}

export default function EmotionWheel({ selectedEmotion, onEmotionSelect }: EmotionWheelProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {EMOTION_OPTIONS.map((emotion) => (
        <button
          key={emotion.value}
          onClick={() => onEmotionSelect(emotion.value)}
          className={`p-4 rounded-xl transition-all duration-200 text-center group hover:scale-105 ${
            selectedEmotion === emotion.value
              ? "bg-red-600 text-white"
              : "bg-slate-700 hover:bg-red-600"
          }`}
        >
          <div className="text-2xl mb-2">{emotion.emoji}</div>
          <div className={`text-xs ${
            selectedEmotion === emotion.value
              ? "text-white"
              : "text-slate-400 group-hover:text-white"
          }`}>
            {emotion.label}
          </div>
        </button>
      ))}
    </div>
  );
}
