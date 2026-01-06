
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
  
  // O loading começa true, mas temos garantia matemática que virará false.
  const [loading, setLoading] = useState(true);
  
  // Refs para evitar updates em componente desmontado
  const mounted = useRef(true);

  // Função auxiliar segura para buscar perfil
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
    let authListener: any = null;

    const bootstrap = async () => {
      // 1. Inicia um Timer de Segurança (2 segundos MAX)
      // Esse timer corre em paralelo com a requisição do Supabase.
      const safetyTimer = setTimeout(() => {
        if (mounted.current && loading) {
          console.warn("Auth: Timeout de segurança atingido. Forçando renderização.");
          setLoading(false); 
        }
      }, 2000);

      try {
        // Checagem de Versão (Limpa cache se versão mudar)
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // 2. Busca a Sessão
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        // Se o componente ainda estiver montado, atualiza o estado
        if (mounted.current) {
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Busca perfil em background (sem await para não travar loading)
            fetchProfile(data.session.user.id).then(p => {
              if (mounted.current && p) setProfile(p);
            });
          }
        }
      } catch (err) {
        console.error("Auth: Erro na inicialização ou sem sessão", err);
        // Não fazemos nada crítico aqui, o finally cuidará do loading
      } finally {
        // 3. Libera o App
        // Cancela o timer de segurança pois já terminamos
        clearTimeout(safetyTimer);
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    // 4. Configura Listener de Eventos
    const setupListener = async () => {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted.current) return;
        
        // Atualiza sessão e usuário
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
        
        // Listener nunca reativa o loading.
      });
      authListener = data.subscription;
    };

    setupListener();

    return () => {
      mounted.current = false;
      if (authListener) authListener.unsubscribe();
    };
  }, []); // Array vazio: Executa apenas uma vez na montagem

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
