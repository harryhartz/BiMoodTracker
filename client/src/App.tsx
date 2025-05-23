import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavigationHeader from "@/components/navigation-header";
import MobileNavigation from "@/components/mobile-navigation";
import Homepage from "@/pages/homepage";
import Dashboard from "@/pages/dashboard";
import MoodTracking from "@/pages/mood-tracking";
import TriggerTracking from "@/pages/trigger-tracking";
import Thoughts from "@/pages/thoughts";
import Insights from "@/pages/insights";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const isHomepage = location === "/";
  const isAuthPage = location === "/auth";

  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/mood" component={MoodTracking} />
      <Route path="/triggers" component={TriggerTracking} />
      <Route path="/thoughts" component={Thoughts} />
      <Route path="/insights" component={Insights} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isHomepage = location === "/";
  const isAuthPage = location === "/auth";
  const showNavigation = !isHomepage && !isAuthPage;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          {showNavigation && <NavigationHeader />}
          <main className={showNavigation ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8" : ""}>
            <Router />
          </main>
          {showNavigation && <MobileNavigation />}
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
