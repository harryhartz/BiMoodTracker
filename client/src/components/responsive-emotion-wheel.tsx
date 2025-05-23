import { useState, useEffect } from "react";
import { EMOTION_OPTIONS } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveEmotionWheelProps {
  selectedEmotion?: string;
  onEmotionSelect: (emotion: string) => void;
}

export default function ResponsiveEmotionWheel({ 
  selectedEmotion, 
  onEmotionSelect 
}: ResponsiveEmotionWheelProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Auto-collapse on mobile when selection is made
  useEffect(() => {
    if (isMobile && selectedEmotion) {
      setIsExpanded(false);
    }
  }, [selectedEmotion, isMobile]);
  
  const handleEmotionSelect = (emotion: string) => {
    onEmotionSelect(emotion);
  };
  
  // Selected emotion details
  const selectedEmotionDetails = selectedEmotion ? 
    EMOTION_OPTIONS.find(emotion => emotion.value === selectedEmotion) : 
    undefined;
  
  return (
    <div>
      {/* Mobile View */}
      {isMobile && (
        <div className="space-y-4">
          {/* Selected Emotion Display / Trigger */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 rounded-xl bg-slate-700 flex items-center justify-between"
          >
            <div className="flex items-center">
              {selectedEmotionDetails ? (
                <>
                  <span className="text-2xl mr-3">{selectedEmotionDetails.emoji}</span>
                  <span className="text-white">{selectedEmotionDetails.label}</span>
                </>
              ) : (
                <span className="text-slate-400">Select an emotion...</span>
              )}
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {/* Expandable Emotion Grid */}
          {isExpanded && (
            <div className="grid grid-cols-3 gap-3 transition-all">
              {EMOTION_OPTIONS.map((emotion) => (
                <button
                  key={emotion.value}
                  onClick={() => handleEmotionSelect(emotion.value)}
                  className={`p-4 rounded-xl transition-all duration-200 text-center ${
                    selectedEmotion === emotion.value
                      ? "bg-red-600 text-white"
                      : "bg-slate-700 hover:bg-red-600"
                  }`}
                >
                  <div className="text-2xl mb-2">{emotion.emoji}</div>
                  <div className={`text-xs ${
                    selectedEmotion === emotion.value
                      ? "text-white"
                      : "text-slate-400"
                  }`}>
                    {emotion.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Desktop View - Standard Grid */}
      {!isMobile && (
        <div className="grid grid-cols-4 gap-3">
          {EMOTION_OPTIONS.map((emotion) => (
            <button
              key={emotion.value}
              onClick={() => handleEmotionSelect(emotion.value)}
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
      )}
    </div>
  );
}