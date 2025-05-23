interface RatingScaleProps {
  value?: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  color?: "primary" | "accent" | "secondary";
}

export default function RatingScale({ 
  value, 
  onChange, 
  max = 5, 
  label,
  color = "primary"
}: RatingScaleProps) {
  const colorClasses = {
    primary: "bg-primary",
    accent: "bg-green-600", 
    secondary: "bg-purple-600"
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      )}
      <div className="flex space-x-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
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
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}
