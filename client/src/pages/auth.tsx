import { useState } from "react";
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

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const signupForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertUserSchema>) => 
      apiRequest('POST', '/api/auth/signup', data),
    onSuccess: () => {
      toast({ 
        title: "Account created!", 
        description: "Welcome! You can now sign in to your account." 
      });
      setIsSignUp(false);
      signupForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Signup failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: z.infer<typeof loginSchema>) => 
      apiRequest('POST', '/api/auth/login', data),
    onSuccess: () => {
      toast({ 
        title: "Welcome back!", 
        description: "Successfully signed in to your account." 
      });
      // Redirect to dashboard - for now we'll just reload
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid email or password",
        variant: "destructive" 
      });
    },
  });

  const onSignup = (data: z.infer<typeof insertUserSchema>) => {
    signupMutation.mutate(data);
  };

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Mood Tracker</h1>
          <p className="text-gray-400">Your personal mental health companion</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
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
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
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
                        <FormLabel className="text-gray-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-400">
          <p>Track your mood patterns and mental health progress</p>
        </div>
      </div>
    </div>
  );
}