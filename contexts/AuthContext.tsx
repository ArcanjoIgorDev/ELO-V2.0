
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { APP_VERSION } from '../lib/constants';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função segura para limpar tudo
  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.clear(); 
  };

  // VERIFICAÇÃO DE VERSÃO (RESET GLOBAL)
  const checkAppVersion = async () => {
    const storedVersion = localStorage.getItem('elo_app_version');
    
    if (storedVersion !== APP_VERSION) {
      console.warn(`Nova versão detectada (${APP_VERSION}). Executando limpeza global.`);
      await supabase.auth.signOut();
      localStorage.clear();
      localStorage.setItem('elo_app_version', APP_VERSION);
      return false; // Indica que houve reset
    }
    return true;
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. Verifica versão antes de tudo
      const versionValid = await checkAppVersion();
      if (!versionValid) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (initialSession?.user) {
          const userProfile = await fetchProfile(initialSession.user.id);
          
          if (!userProfile) {
            // Perfil não encontrado (possível inconsistência), logout forçado
            await supabase.auth.signOut();
            throw new Error("Sessão sem perfil correspondente.");
          }

          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            setProfile(userProfile);
          }
        } else {
          if (mounted) clearAuthState();
        }
      } catch (error) {
        console.error("Auth recovery:", error);
        await supabase.auth.signOut();
        if (mounted) clearAuthState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession.user);
        const userProfile = await fetchProfile(newSession.user.id);
        setProfile(userProfile);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      clearAuthState();
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const data = await fetchProfile(user.id);
      if (data) setProfile(data);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
