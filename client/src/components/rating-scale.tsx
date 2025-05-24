interface RatingScaleProps {
  value?: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  label?: string;
  color?: "primary" | "accent" | "secondary";
}

export default function RatingScale({ 
  value, 
  onChange, 
  max = 4, 
  min = 0,
  label,
  color = "primary"
}: RatingScaleProps) {
  const colorClasses = {
    primary: "bg-primary",
    accent: "bg-green-600", 
    secondary: "bg-purple-600"
  };

  const getRatingValues = () => {
    if (min < 0) {
      // For negative ranges like -3 to +3
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    } else {
      // For positive ranges like 1 to 5
      return Array.from({ length: max }, (_, i) => i + min);
    }
  };

  const ratingValues = getRatingValues();

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      )}
      <div className="flex space-x-2">
        {ratingValues.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-xl transition-colors flex items-center justify-center text-white font-semibold ${
              value === rating
                ? colorClasses[color]
                : "bg-slate-700 hover:" + colorClasses[color]
            }`}
          >
            {rating > 0 ? `+${rating}` : rating}
          </button>
        ))}
      </div>
    </div>
  );
}
