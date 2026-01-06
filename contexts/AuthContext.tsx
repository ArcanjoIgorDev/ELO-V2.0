
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
  
  // Refs para controle interno sem re-render
  const mounted = useRef(true);

  // Busca perfil sem travar a UI
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch (e) { 
      return null; 
    }
  };

  useEffect(() => {
    mounted.current = true;

    // 1. TIMEOUT DE SEGURANÇA ABSOLUTA (FAIL-OPEN)
    // Se o Supabase demorar ou travar, liberamos o app em 3 segundos no máximo.
    const hardStopTimer = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth: Timeout de segurança atingido. Forçando liberação da UI.");
        setLoading(false);
      }
    }, 2500);

    const initializeAuth = async () => {
      try {
        // Version Check
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // Recupera sessão inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted.current) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            
            // Busca perfil em paralelo
            fetchProfile(initialSession.user.id).then(p => {
              if (mounted.current && p) setProfile(p);
            });
          }
        }
      } catch (err) {
        console.error("Auth: Erro na inicialização", err);
      } finally {
        // Libera o loading se ainda não tiver sido liberado pelo timeout
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // Listener de Eventos - Totalmente Passivo
    // NUNCA altera 'loading' para true.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      // Sincroniza estado da sessão
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (newSession?.user) {
        // Se temos usuário mas não perfil, tenta buscar
        if (!profile || profile.id !== newSession.user.id) {
           const p = await fetchProfile(newSession.user.id);
           if (mounted.current && p) setProfile(p);
        }
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(hardStopTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      if (mounted.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
        // Não resetamos loading aqui para manter fluidez
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const data = await fetchProfile(user.id);
      if (data && mounted.current) setProfile(data);
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
