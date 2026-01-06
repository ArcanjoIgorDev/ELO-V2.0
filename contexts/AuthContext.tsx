
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref para evitar atualizações em componentes desmontados
  const mounted = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Auth: Erro ao buscar perfil", e);
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        // 1. Version Check (Limpeza de cache se versão mudar)
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          console.log("Auth: Nova versão, limpando sessão local.");
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // 2. Busca Sessão Inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession && mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Busca perfil
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted.current) setProfile(userProfile);
        }
      } catch (err) {
        console.error("Auth: Falha na inicialização", err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // 3. Listener de Eventos (Realtime Auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      // Token Refreshed não deve causar loading state na UI
      if (event === 'TOKEN_REFRESHED_OR_UPDATED') {
        setSession(newSession);
        return;
      }

      // Signed In/Out
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN') {
        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          if (mounted.current) setProfile(p);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        // Limpa cache local sensível se necessário
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair", error);
    } finally {
      if (mounted.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }
  };

  const refreshProfile = async () => {
    if (user && mounted.current) {
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
