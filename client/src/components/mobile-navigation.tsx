import { useAppNavigation } from "@/hooks/use-app-navigation";
import { Home, Smile, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/mood", label: "Mood", icon: Smile },
  { href: "/triggers", label: "Triggers", icon: AlertTriangle },
  { href: "/thoughts", label: "Thoughts", icon: Lightbulb },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export default function MobileNavigation() {
  const { navigate, isActive } = useAppNavigation();

  return (
    <nav className="md:hidden bg-slate-800 border-t border-slate-700 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-slate-400 hover:text-primary"
              }`}
            >
              <Icon className="text-lg mb-1" size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
