"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signOut, signInWithOAuth, getCurrentUser } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signup: (userData: { name: string; email: string; company?: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in from Supabase
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      // Only use mock auth when Supabase is NOT configured (for local dev without auth setup)
      const useDevAuth = process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey);
      if (useDevAuth) {
        console.log('🔧 Development mode: Using mock authentication (localhost bypass)');
        const mockUser: User = {
          id: 'dev-user-123',
          name: 'Development User',
          email: 'dev@localhost',
          company: 'Local Development'
        };
        setUser(mockUser);
        setIsLoading(false);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('user', JSON.stringify(mockUser));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
        return;
      }

      // Only try to get user if Supabase is configured
      if (!supabaseUrl || !supabaseAnonKey) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const { user: supabaseUser, error } = await getCurrentUser();
      
      // If error is about missing session, that's OK - user is just not logged in
      if (error && !error.message?.includes('session')) {
        console.error('Error checking user:', error);
      }
      
      if (supabaseUser) {
        // Map Supabase user to our User interface
        const userData: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          company: supabaseUser.user_metadata?.company
        };
        setUser(userData);
        
        // Also save to localStorage for quick access
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
      } else {
        setUser(null);
        // Clear localStorage if no user
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('user');
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const { data, error } = await signInWithOAuth(provider);
      if (error) throw new Error(error.message);
      // OAuth redirects away - no need to update state here
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Invalid email or password');
      }

      if (!data?.user) {
        throw new Error('Login failed: No user data returned');
      }

      // Map Supabase user to our User interface
      const userData: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || email,
        company: data.user.user_metadata?.company
      };
      
      setUser(userData);
      
      if (mounted && typeof window !== 'undefined') {
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: { name: string; email: string; company?: string; password: string }) => {
    setIsLoading(true);
    try {
      const { data, error } = await signUp(userData.email, userData.password);
      
      if (error) {
        console.error('Signup error:', error);
        throw new Error(error.message || 'Signup failed');
      }

      if (!data?.user) {
        throw new Error('Signup failed: No user data returned');
      }

      // Update user metadata with name and company
      // Note: This might require additional Supabase admin API call
      // For now, we'll store it in our user object
      const newUser: User = {
        id: data.user.id,
        name: userData.name,
        email: userData.email,
        company: userData.company
      };
      
      setUser(newUser);
      
      if (mounted && typeof window !== 'undefined') {
        try {
          localStorage.setItem('user', JSON.stringify(newUser));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      if (mounted && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('user');
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
      setIsLoading(false);
      router.push('/');
    }
  };

  const value = {
    user,
    isLoading,
    login,
    loginWithOAuth,
    signup,
    logout,
    isAuthenticated: !!user
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ 
        user: null, 
        isLoading: true, 
        login: async () => {}, 
        loginWithOAuth: async () => {}, 
        signup: async () => {}, 
        logout: () => {}, 
        isAuthenticated: false 
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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
