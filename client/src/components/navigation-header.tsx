import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAuth } from "@/hooks/use-auth";
import { Brain, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mood", label: "Mood" },
  { href: "/triggers", label: "Triggers" },
  { href: "/thoughts", label: "Thoughts" },
  { href: "/insights", label: "Insights" },
];

export default function NavigationHeader() {
  const { navigate, isActive } = useAppNavigation();
  const { logout } = useAuth();

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-semibold text-white">BiMoodTracker</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-slate-400 hover:text-primary hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
            <Button
              onClick={() => {
                // Call logout function then redirect to auth page
                logout();
                window.location.href = "/auth";
              }}
              variant="outline"
              size="sm"
              className="ml-4 border-primary text-primary hover:bg-primary hover:text-white"
            >
              Logout
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white">
                <Menu className="text-xl" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-800 border-slate-700">
              <nav className="flex flex-col space-y-4 mt-6">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={`px-3 py-2 rounded-lg transition-colors duration-200 text-left ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-slate-400 hover:text-primary hover:bg-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <Button
                  onClick={() => {
                    // Call logout function then redirect to auth page
                    logout();
                    window.location.href = "/auth";
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
