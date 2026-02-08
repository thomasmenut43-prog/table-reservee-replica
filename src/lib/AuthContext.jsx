import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, supabaseAuth } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: session.user.user_metadata?.role || 'restaurateur',
            restaurantId: session.user.user_metadata?.restaurantId,
            subscriptionStatus: session.user.user_metadata?.subscriptionStatus,
            subscriptionEndDate: session.user.user_metadata?.subscriptionEndDate
          };
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoadingAuth(false);
      }
    );

    // Initial check
    checkAppState();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      // Load platform settings from local storage
      const settings = await base44.entities.PlatformSettings.filter({ settingKey: 'design' });
      setAppPublicSettings(settings[0] || null);

      // Check if user is logged in (from Supabase)
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          role: session.user.user_metadata?.role || 'restaurateur',
          restaurantId: session.user.user_metadata?.restaurantId,
          subscriptionStatus: session.user.user_metadata?.subscriptionStatus,
          subscriptionEndDate: session.user.user_metadata?.subscriptionEndDate
        };
        setUser(userData);
        setIsAuthenticated(true);
      }

      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const supabaseUser = await supabaseAuth.signIn(email, password);
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
        role: supabaseUser.user_metadata?.role || 'restaurateur',
        restaurantId: supabaseUser.user_metadata?.restaurantId,
        subscriptionStatus: supabaseUser.user_metadata?.subscriptionStatus,
        subscriptionEndDate: supabaseUser.user_metadata?.subscriptionEndDate
      };
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw new Error('Email ou mot de passe incorrect');
    }
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
