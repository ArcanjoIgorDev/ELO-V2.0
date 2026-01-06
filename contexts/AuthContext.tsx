
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
  
  // O loading começa true, mas assim que virar false, NUNCA mais volta para true automaticamente.
  const [loading, setLoading] = useState(true);
  
  const mounted = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) return null;
      return data;
    } catch (e) { 
      return null; 
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Função de Boot Inicial (Executa apenas 1 vez)
    const boot = async () => {
      try {
        // Version Check (Limpeza de cache se versão mudar)
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // Verifica sessão atual
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted.current) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            const p = await fetchProfile(initialSession.user.id);
            if (mounted.current && p) setProfile(p);
          }
        }
      } catch (err) {
        console.error("Auth Boot Error:", err);
      } finally {
        // Independente do resultado, liberamos o app.
        if (mounted.current) setLoading(false);
      }
    };

    boot();

    // Listener de Eventos (NUNCA ativa loading = true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      // Atualiza estados sem bloquear UI
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        // Só limpamos dados, não travamos a tela
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Se temos user mas não perfil, buscamos em background
        if (newSession?.user && (!profile || profile.id !== newSession.user.id)) {
           const p = await fetchProfile(newSession.user.id);
           if (mounted.current && p) setProfile(p);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Aqui podemos mostrar loading pois é uma ação explícita do usuário
      // Mas para segurança, mantemos a UI responsiva
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      if (mounted.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
        // Redirecionamento é tratado pelo router
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
