import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profileImage?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (name: string, profileImage?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin users - you can add more emails here
const ADMIN_EMAILS = [
  'admin@demo.com',
  'admin@healthcare.com',
  'administrator@health.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session);
      if (session?.user) {
        const authUser = mapSupabaseUserToAuthUser(session.user);
        console.log('Setting initial user:', authUser);
        setUser(authUser);
      }
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      if (session?.user) {
        const authUser = mapSupabaseUserToAuthUser(session.user);
        console.log('Setting user from auth change:', authUser);
        setUser(authUser);
      } else {
        console.log('Clearing user');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUserToAuthUser = (supabaseUser: User): AuthUser => {
    const isAdmin = ADMIN_EMAILS.includes(supabaseUser.email || '');
    console.log('Mapping user:', supabaseUser.email, 'isAdmin:', isAdmin);
    
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: isAdmin ? 'admin' : 'user',
      profileImage: supabaseUser.user_metadata?.avatar_url
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      
      console.log('Login successful:', data);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting signup with:', email, name);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error.message);
        // Throw the error so the form can catch it and show appropriate message
        throw new Error(error.message);
      }
      
      console.log('Signup successful:', data);
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw the error so the form can catch it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Reset password error:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const updateProfile = async (name: string, profileImage?: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name,
          ...(profileImage && { avatar_url: profileImage })
        }
      });
      
      if (error) {
        console.error('Update profile error:', error.message);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      resetPassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
