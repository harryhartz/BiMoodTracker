import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/navigation-header";
import { queryClient } from "@/lib/queryClient";

// Import all pages
import Dashboard from "@/pages/dashboard";
import MoodTracking from "@/pages/mood-tracking";
import TriggerTracking from "@/pages/trigger-tracking";
import Thoughts from "@/pages/thoughts";
import Insights from "@/pages/insights";
import Auth from "@/pages/auth";
import Homepage from "@/pages/homepage";
import NotFound from "@/pages/not-found";

import "./index.css";

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mood-tracking" element={<MoodTracking />} />
          <Route path="/trigger-tracking" element={<TriggerTracking />} />
          <Route path="/thoughts" element={<Thoughts />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-slate-900">
            <Router>
              <AppRouter />
            </Router>
            <Toaster />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}