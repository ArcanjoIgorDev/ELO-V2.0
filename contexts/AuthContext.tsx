
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
  
  const mounted = useRef(true);

  // Função auxiliar para limpar tudo
  const clearAuthState = () => {
    if (!mounted.current) return;
    setSession(null);
    setUser(null);
    setProfile(null);
    // Não forçamos setLoading(false) aqui, quem chama decide quando o loading acaba
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch { return null; }
  };

  const initializeAuth = async () => {
    try {
      // Version Check
      const storedVersion = localStorage.getItem('elo_app_version');
      if (storedVersion !== APP_VERSION) {
        await supabase.auth.signOut();
        localStorage.clear();
        localStorage.setItem('elo_app_version', APP_VERSION);
      }

      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      
      if (error) {
         console.error("Session error:", error);
         clearAuthState();
      } else if (initialSession?.user) {
        if (mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          const p = await fetchProfile(initialSession.user.id);
          if (mounted.current && p) setProfile(p);
        }
      } else {
        clearAuthState();
      }
    } catch (err) {
      console.error("Auth Init Critical Failure:", err);
      clearAuthState();
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    initializeAuth();

    // Listener de Eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
        setLoading(false); 
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession.user);
        
        // Só busca perfil se não tiver ou se mudou o user
        if (!profile || profile.id !== newSession.user.id) {
           const p = await fetchProfile(newSession.user.id);
           if (mounted.current && p) setProfile(p);
        }
        setLoading(false);
      }
    });

    // Failsafe Timer: Garante que o loading nunca fique preso por mais de 3s
    const failsafe = setTimeout(() => {
       if (mounted.current && loading) {
          console.warn("Auth failsafe triggered: forcing loading to false");
          setLoading(false);
       }
    }, 3000);

    return () => {
      mounted.current = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuthState();
      if (mounted.current) setLoading(false);
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
