import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavigationHeader from "@/components/navigation-header";
import MobileNavigation from "@/components/mobile-navigation";
import ErrorBoundary from "@/components/error-boundary";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Homepage from "@/pages/homepage";
import Dashboard from "@/pages/dashboard";
import MoodTracking from "@/pages/mood-tracking";
import TriggerTracking from "@/pages/trigger-tracking";
import Thoughts from "@/pages/thoughts";
import Insights from "@/pages/insights";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

// Protected route component that ensures user is authenticated
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check authentication status and redirect if needed
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component /> : null;
}

function Router() {
  const [location] = useLocation();
  const isHomepage = location === "/";
  const isAuthPage = location === "/auth";
  const { isAuthenticated } = useAuth();
  
  // Redirect authenticated users away from login/home to dashboard
  useEffect(() => {
    if (isAuthenticated && (isHomepage || isAuthPage)) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isHomepage, isAuthPage]);

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Homepage} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/mood" component={() => <ProtectedRoute component={MoodTracking} />} />
        <Route path="/triggers" component={() => <ProtectedRoute component={TriggerTracking} />} />
        <Route path="/thoughts" component={() => <ProtectedRoute component={Thoughts} />} />
        <Route path="/insights" component={() => <ProtectedRoute component={Insights} />} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  const [location] = useLocation();
  const isHomepage = location === "/";
  const isAuthPage = location === "/auth";
  const showNavigation = !isHomepage && !isAuthPage;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
