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
  
  // O loading começa true e só vira false UMA VEZ.
  const [loading, setLoading] = useState(true);
  
  // Refs para garantir integridade em componentes desmontados
  const mounted = useRef(true);

  // Função auxiliar segura para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch (e) {
      console.error("Auth: Erro ao buscar perfil", e);
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;
    let authListener: any = null;

    const initAuth = async () => {
      try {
        // 0. Verifica versão para limpar cache se necessário
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          console.log("Auth: Nova versão detectada, limpando sessão.");
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // 1. Obtem sessão inicial com Timeout de Segurança (Race Condition proposital)
        // Isso garante que se a rede cair ou o Supabase demorar > 4s, o app carrega (como deslogado ou erro)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000));

        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (mounted.current) {
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            // Busca perfil antes de liberar o loading para evitar flash de conteúdo
            const userProfile = await fetchProfile(data.session.user.id);
            if (mounted.current && userProfile) {
              setProfile(userProfile);
            }
          }
        }
      } catch (err) {
        console.warn("Auth: Inicialização falhou ou timeout (o usuário será tratado como deslogado).", err);
      } finally {
        // 2. PONTO CRÍTICO: Loading vira false AQUI, independente de erro ou sucesso.
        if (mounted.current) {
          setLoading(false);
        }
      }
      
      // 3. Configura listener para eventos FUTUROS
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted.current) return;
        
        // Atualiza estados
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           if (newSession?.user) {
             const p = await fetchProfile(newSession.user.id);
             if (mounted.current && p) setProfile(p);
           }
        } else if (event === 'SIGNED_OUT') {
           setProfile(null);
           setSession(null);
           setUser(null);
        }
        
        // NOTA: Nunca voltamos loading para true aqui para evitar loops na UI.
        // O app deve lidar com re-renders reativos.
      });
      authListener = listener.subscription;
    };

    initAuth();

    return () => {
      mounted.current = false;
      if (authListener) authListener.unsubscribe();
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
        // Opcional: Redirecionar via router se necessário, mas o ProtectedLayout cuida disso
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