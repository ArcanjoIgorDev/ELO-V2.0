
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

  // Limpeza segura (mantém preferências locais importantes, limpa auth)
  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    // Remove apenas chaves de auth do Supabase, mantém 'has_seen_tutorial' etc se estiver no local
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key === 'supabase.auth.token') {
        localStorage.removeItem(key);
      }
    });
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

    // Timeout de Segurança: Se o Supabase demorar muito (ex: rede lenta ao voltar), libera o app
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth timeout reached. Forcing loading false.");
        setLoading(false);
      }
    }, 4000);

    const initializeAuth = async () => {
      // Verifica versão para reset global se necessário
      const storedVersion = localStorage.getItem('elo_app_version');
      if (storedVersion !== APP_VERSION) {
        console.log(`Atualizando versão para ${APP_VERSION}`);
        await supabase.auth.signOut();
        localStorage.clear();
        localStorage.setItem('elo_app_version', APP_VERSION);
      }

      try {
        // Tenta recuperar sessão
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (initialSession?.user) {
          const userProfile = await fetchProfile(initialSession.user.id);
          
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            // Se não tiver perfil (bug raro), o app vai lidar na UI ou criar depois
            if (userProfile) setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
        // Em caso de erro grave, limpa para forçar login limpo
        if (mounted) clearAuthState();
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initializeAuth();

    // Listener de mudanças de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log(`Auth event: ${event}`);

      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession.user);
        
        // Só busca perfil se não tiver ou se mudou o usuário
        if (!profile || profile.id !== newSession.user.id) {
            const userProfile = await fetchProfile(newSession.user.id);
            setProfile(userProfile);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      clearAuthState();
      setLoading(false);
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
