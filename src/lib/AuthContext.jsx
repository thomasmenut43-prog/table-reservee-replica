import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, supabaseAuth, getUserRole, ADMIN_EMAIL } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';

const defaultAuthValue = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: true,
  authError: null,
  appPublicSettings: null,
  login: async () => {},
  logout: async () => {},
  navigateToLogin: () => window.location.href = '/',
  checkAppState: async () => {}
};

const AuthContext = createContext(defaultAuthValue);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // Transform Supabase user to app user format
  const transformUser = (supabaseUser) => {
    if (!supabaseUser) return null;
    const role = getUserRole(supabaseUser.email);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
      role: role,
      restaurantId: supabaseUser.user_metadata?.restaurantId || null,
      subscriptionStatus: supabaseUser.user_metadata?.subscriptionStatus || null,
      subscriptionEndDate: supabaseUser.user_metadata?.subscriptionEndDate || null
    };
  };

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const session = await supabaseAuth.getSession();
        if (session?.user) {
          const userData = transformUser(session.user);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();

    // Listen to auth state changes for persistent sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          const userData = transformUser(session.user);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoadingAuth(false);
      }
    );

    // Load platform settings
    base44.entities.PlatformSettings.filter({ settingKey: 'design' })
      .then(result => {
        setAppPublicSettings(result[0] || null);
        setIsLoadingPublicSettings(false);
      })
      .catch(() => {
        setIsLoadingPublicSettings(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      const settings = await base44.entities.PlatformSettings.filter({ settingKey: 'design' });
      setAppPublicSettings(settings[0] || null);
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoadingPublicSettings(false);
    }
  };

  const login = async (email, password) => {
    try {
      const supabaseUser = await supabaseAuth.signIn(email, password);
      const userData = transformUser(supabaseUser);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
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
  return context ?? defaultAuthValue;
};
