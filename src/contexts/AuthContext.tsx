import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AUTH_CONFIG } from '@/config/auth';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize GoogleAuth for native plugins
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: AUTH_CONFIG.google.clientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Supabase Auth Event:", event, session ? "Session Exists" : "No Session");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Initial getSession:", session ? "Found session locally or in URL" : "No local session", error || "");
      if (error) {
        console.error("Supabase getSession Error:", error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Handle deep link callback from OAuth on native
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        console.log("Deep link received:", url);
        // The URL will be like: com.habittracker.app://login#access_token=...&refresh_token=...
        if (url.includes('access_token') || url.includes('refresh_token')) {
          // Extract the fragment (everything after #)
          const hashPart = url.split('#')[1];
          if (hashPart) {
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              console.log("Set session from deep link:", data ? "Success" : "Failed", error || "");
            }
          }
        }
        // Close the browser after redirect
        try { await Browser.close(); } catch (_) { /* ignore */ }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = Capacitor.isNativePlatform()
      ? 'com.habittracker.app://login'
      : `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Native Google Sign-In using capacitor-google-auth
        const googleUser: any = await GoogleAuth.signIn();
        
        if (!googleUser || (!googleUser.authentication?.idToken && !googleUser.idToken)) {
           throw new Error("No ID Token returned from Google Sign-In");
        }
        
        // The idToken is usually either at user.idToken or user.authentication.idToken depending on version/OS
        const idToken = googleUser.authentication?.idToken || googleUser.idToken;

        // Sign in to Supabase using the ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          console.error("Supabase signInWithIdToken Error", error);
          return { error };
        }

        return { error: null };
      } catch (error: any) {
        console.error("GoogleNative Error", error);
        return { error };
      }
    } else {
      // On web: normal OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AUTH_CONFIG.google.redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};