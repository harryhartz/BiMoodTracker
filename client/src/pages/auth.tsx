import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import FormError from "@/components/form-error";

export default function Auth() {
  const [location, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Mood Tracker</h1>
          <p className="text-slate-400">Your personal mental health companion</p>
        </div>

        <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex space-x-1 mb-6">
              <Button
                type="button"
                variant={!isSignUp ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={isSignUp ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </Button>
            </div>

            {isSignUp ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={signupForm.watch("name") || ""}
                    onChange={(e) => signupForm.setValue("name", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={signupForm.watch("email") || ""}
                    onChange={(e) => signupForm.setValue("email", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={signupForm.watch("password") || ""}
                    onChange={(e) => signupForm.setValue("password", e.target.value)}
                  />
                </div>
                
                <Button 
                  type="button"
                  onClick={() => {
                    const formData = {
                      name: signupForm.getValues("name"),
                      email: signupForm.getValues("email"),
                      password: signupForm.getValues("password")
                    };
                    onSignup(formData);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}