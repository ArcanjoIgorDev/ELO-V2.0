
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

  // Limpa estado seguro
  const clearAuthState = () => {
    if (!mounted.current) return;
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        // Se der erro (ex: 406), tenta criar profile básico ou ignora
        console.warn("Error fetching profile:", error.message);
        return null;
      }
      return data;
    } catch (e) { 
      return null; 
    }
  };

  const initializeAuth = async () => {
    try {
      // Verifica versão para limpar cache antigo se necessário
      const storedVersion = localStorage.getItem('elo_app_version');
      if (storedVersion !== APP_VERSION) {
        await supabase.auth.signOut();
        localStorage.clear();
        localStorage.setItem('elo_app_version', APP_VERSION);
      }

      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      
      if (error) {
         console.error("Session init error:", error);
         clearAuthState();
      } else if (initialSession?.user) {
        if (mounted.current) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Busca perfil em paralelo para não bloquear UI se falhar
          const p = await fetchProfile(initialSession.user.id);
          if (mounted.current && p) setProfile(p);
        }
      } else {
        clearAuthState();
      }
    } catch (err) {
      console.error("Auth Critical Error:", err);
      clearAuthState();
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
        setLoading(false); 
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession.user);
        
        // Se usuário mudou ou perfil não existe, busca
        if (newSession.user && (!profile || profile.id !== newSession.user.id)) {
           const p = await fetchProfile(newSession.user.id);
           if (mounted.current && p) setProfile(p);
        }
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
         // Já tratado no initializeAuth, mas garante loading false
         setLoading(false);
      }
    });

    // Failsafe absoluto: Remove loading após 3s se algo travar
    const failsafe = setTimeout(() => {
       if (mounted.current && loading) {
          console.warn("Auth failsafe: Forcing loading completion");
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
