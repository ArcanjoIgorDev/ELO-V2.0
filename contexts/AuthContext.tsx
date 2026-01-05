
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

  // Limpeza de Estado e LocalStorage (Cookies)
  const clearAuthState = () => {
    if (!mounted.current) return;
    setSession(null);
    setUser(null);
    setProfile(null);
    
    // Limpa chaves específicas do Supabase para evitar loops de token inválido
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key === 'supabase.auth.token') {
        localStorage.removeItem(key);
      }
    });
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch { return null; }
  };

  useEffect(() => {
    mounted.current = true;

    // Timeout de Segurança Supremo: Garante que o loading saia em 3s no máximo
    const safetyTimer = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth timeout forced unlock.");
        setLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      // 1. Version Check
      const storedVersion = localStorage.getItem('elo_app_version');
      if (storedVersion !== APP_VERSION) {
        await supabase.auth.signOut();
        localStorage.clear();
        localStorage.setItem('elo_app_version', APP_VERSION);
      }

      try {
        // 2. Busca sessão inicial
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (initialSession?.user && mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Busca perfil em paralelo para não travar tanto
          fetchProfile(initialSession.user.id).then(p => {
             if(mounted.current && p) setProfile(p);
          });
        }
      } catch (error) {
        console.error("Auth init failed, clearing storage:", error);
        clearAuthState();
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // 3. Listener de Eventos (BLINDADO: Nunca seta loading=true aqui)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      console.log(`Auth event: ${event}`);

      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
        setLoading(false); // Garante que destrave
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession.user);
        
        // Atualiza perfil se necessário
        if (!profile || profile.id !== newSession.user.id) {
           const p = await fetchProfile(newSession.user.id);
           if(mounted.current) setProfile(p);
        }
        // NÃO setamos loading=true aqui para não piscar a tela
      }
    });

    // 4. Visibility Listener (Silent Refresh)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted.current) {
        // Apenas verifica se a sessão ainda é válida em background
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Se o token expirou enquanto estava minimizado, o onAuthStateChange cuidará disso via event SIGNED_OUT
          // Não fazemos nada aqui para não conflitar
        } else if (data.session.user.id !== user?.id) {
           setSession(data.session);
           setUser(data.session.user);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted.current = false;
      clearTimeout(safetyTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true); // Aqui pode ter loading pois é ação do usuário
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuthState();
      if(mounted.current) setLoading(false);
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
  if (!context) throw new Error('useAuth error');
  return context;
};
