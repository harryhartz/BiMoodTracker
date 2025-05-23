import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    const isAuthPage = location === '/auth';
    const isHomePage = location === '/';
    
    if (!isLoading) {
      if (!user && !isAuthPage && !isHomePage) {
        // Redirect to auth page if not logged in and trying to access protected route
        toast({
          title: "Authentication required",
          description: "Please log in to access this page",
          variant: "default"
        });
        setLocation('/auth');
      } else if (user && isAuthPage) {
        // Redirect to dashboard if already logged in and on auth page
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, location, setLocation, toast]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await api.post<User>('/api/auth/login', { email, password });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setLocation('/dashboard');
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.name}`,
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast({
        title: "Login failed", 
        description: err.message || "Please check your email and password",
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await api.post<User>('/api/auth/signup', { name, email, password });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setLocation('/dashboard');
      toast({
        title: "Account created!",
        description: "Welcome to BiMoodTracker"
      });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      toast({
        title: "Signup failed", 
        description: err.message || "Please try again with different information",
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setLocation('/');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}