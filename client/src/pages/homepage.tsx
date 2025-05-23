import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, Brain, TrendingUp, Shield } from "lucide-react";

export default function Homepage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Heart className="h-8 w-8 text-blue-400" />,
      title: "Daily Mood Tracking",
      description: "Monitor your emotional well-being with morning and evening check-ins"
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-400" />,
      title: "Trigger Awareness",
      description: "Identify patterns and situations that affect your mental health"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-400" />,
      title: "Progress Insights",
      description: "Visualize your mental health journey with detailed analytics"
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-400" />,
      title: "Private & Secure",
      description: "Your mental health data is encrypted and completely private"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Mental Health
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {" "}Journey
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Track your moods, understand your triggers, and gain insights into your emotional well-being 
              with our comprehensive mental health companion.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setLocation("/auth?mode=signup")}
              >
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-400 text-slate-200 hover:bg-slate-800 px-8 py-3 text-lg font-semibold transition-all duration-300"
                onClick={() => setLocation("/auth?mode=signin")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need for Mental Wellness
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Our comprehensive platform provides tools and insights to support your mental health journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Take Control of Your Mental Health?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Join thousands of users who have transformed their mental wellness journey with our platform.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setLocation("/auth?mode=signup")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}