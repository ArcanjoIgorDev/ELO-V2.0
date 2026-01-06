
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
  // NUNCA deve voltar para true após a primeira carga, a menos que seja um logout explícito.
  const [loading, setLoading] = useState(true);
  
  const mounted = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.warn("Auth: Perfil não encontrado ou erro discreto", error.message);
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
        // Version Check (Limpeza preventiva)
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          console.log("Auth: Nova versão detectada. Limpando sessão local.");
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // Busca sessão inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession && mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Busca perfil sem bloquear se falhar
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted.current) setProfile(userProfile);
        }
      } catch (err) {
        console.error("Auth: Falha na inicialização", err);
      } finally {
        // REGRA DE OURO: O app DEVE iniciar, mesmo se der erro no auth.
        // O ProtectedLayout lidará com redirecionamentos se não houver sessão.
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // Listener de Eventos (Realtime Auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      console.log(`Auth Event: ${event}`);

      // Atualiza sessão se mudou
      if (newSession?.access_token !== session?.access_token) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      // Lógica específica por evento
      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            const p = await fetchProfile(newSession.user.id);
            if (mounted.current) setProfile(p);
          }
          break;
        
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setProfile(null);
          break;

        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          // Apenas mantém a sessão atualizada (já feito acima).
          // NUNCA setar loading=true aqui.
          break;
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
        // O redirecionamento acontece reativamente no App.tsx
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
