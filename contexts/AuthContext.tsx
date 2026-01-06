
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

  // Busca perfil de forma isolada
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch (e) { return null; }
  };

  useEffect(() => {
    mounted.current = true;

    const initAuth = async () => {
      try {
        // Checagem de versão
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // SOLUÇÃO NUCLEAR: Promise.race
        // Criamos uma promessa que resolve em 1.5s
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
        
        // A promessa do Supabase
        const supabasePromise = supabase.auth.getSession();

        // Quem terminar primeiro ganha. Se o Supabase travar, o timeout libera o app.
        const result: any = await Promise.race([supabasePromise, timeoutPromise]);

        // Se o resultado veio do Supabase e tem dados:
        if (result && result.data && mounted.current) {
           const { session: initialSession } = result.data;
           if (initialSession) {
             setSession(initialSession);
             setUser(initialSession.user);
             // Busca perfil em background (não await)
             fetchProfile(initialSession.user.id).then(p => {
               if (mounted.current && p) setProfile(p);
             });
           }
        }
      } catch (err) {
        console.warn("Auth init bypassed:", err);
      } finally {
        // INDEPENDENTE do que aconteça, liberamos o loading.
        if (mounted.current) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      // Atualiza estado reativamente
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user && (!profile || profile.id !== newSession.user.id)) {
           fetchProfile(newSession.user.id).then(p => {
             if (mounted.current && p) setProfile(p);
           });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (mounted.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
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
