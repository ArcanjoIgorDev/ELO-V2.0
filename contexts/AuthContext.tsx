
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useMemo } from 'react';
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
  
  const mounted = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.warn("Auth: Perfil não encontrado", error.message);
        return null;
      }
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
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession && mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted.current) setProfile(userProfile);
        }
      } catch (err) {
        console.error("Auth: Init error", err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      // Só atualiza estado se o token mudou realmente, evitando re-renders desnecessários
      if (newSession?.access_token !== session?.access_token) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      if (event === 'SIGNED_IN' && newSession?.user) {
        // Se já temos perfil carregado e o ID é o mesmo, evita refetch imediato
        if (!profile || profile.id !== newSession.user.id) {
           const p = await fetchProfile(newSession.user.id);
           if (mounted.current) setProfile(p);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []); // Dependência vazia é intencional

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      if (mounted.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (user && mounted.current) {
      const data = await fetchProfile(user.id);
      if (data) setProfile(data);
    }
  };

  // Memoiza o valor do contexto para garantir estabilidade referencial
  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [session, user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
