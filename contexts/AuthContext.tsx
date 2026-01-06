
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
  
  // 'loading' controla APENAS a inicialização da aplicação (Splash Screen)
  const [loading, setLoading] = useState(true);
  
  const mounted = useRef(true);

  // Função auxiliar isolada para buscar perfil sem travar
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        // Se não achar perfil (ex: conta deletada), não quebra o app, retorna null
        console.warn("Auth: Perfil não encontrado ou erro", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error("Auth: Erro crítico ao buscar perfil", e);
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        // 1. Version Check Limpo
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          console.log("Auth: Atualizando versão...");
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // 2. Pega sessão atual
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession && mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Busca perfil em paralelo para não bloquear render inicial se a rede estiver lenta
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted.current) setProfile(userProfile);
        }
      } catch (err) {
        console.error("Auth: Falha na inicialização", err);
      } finally {
        // CRÍTICO: Sempre remove o loading, aconteça o que acontecer.
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // 3. Listener Realtime (Sem setar loading=true aqui!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      console.log(`Auth Event: ${event}`);

      // Atualiza sessão se mudou
      if (newSession?.access_token !== session?.access_token) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      // Se for login explícito, busca perfil
      if (event === 'SIGNED_IN' && newSession?.user) {
         const p = await fetchProfile(newSession.user.id);
         if (mounted.current) setProfile(p);
      }
      
      // Se for logout, limpa tudo
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      // NOTA: TOKEN_REFRESHED não faz nada além de atualizar a sessão acima.
      // Jamais setamos loading=true aqui.
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
        // Não precisamos setar loading aqui, o redirect cuida do resto
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
