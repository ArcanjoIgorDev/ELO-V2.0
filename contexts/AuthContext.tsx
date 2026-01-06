
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
  
  // O loading inicia true para verificar a sessão local.
  // Uma vez false, ele PERMANECE false para sempre durante o ciclo de vida da janela.
  const [loading, setLoading] = useState(true);
  
  // Ref para garantir que não busquemos perfil múltiplas vezes desnecessariamente
  const isFetchingProfile = useRef(false);

  const fetchProfile = async (userId: string) => {
    if (isFetchingProfile.current) return null;
    isFetchingProfile.current = true;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) return null;
      return data;
    } catch (e) { 
      return null; 
    } finally {
      isFetchingProfile.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Version Check Rápido
        const storedVersion = localStorage.getItem('elo_app_version');
        if (storedVersion !== APP_VERSION) {
          // Limpa tudo se versão mudar, força login novo
          await supabase.auth.signOut();
          localStorage.clear();
          localStorage.setItem('elo_app_version', APP_VERSION);
        }

        // 2. Busca Sessão Local (Síncrono/Rápido na maioria das vezes)
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            
            // Busca perfil sem bloquear se demorar
            fetchProfile(initialSession.user.id).then(p => {
              if (mounted && p) setProfile(p);
            });
          }
        }
      } catch (err) {
        console.error("Auth init warning:", err);
      } finally {
        // 3. Libera o App IMEDIATAMENTE após checar sessão local.
        // Não esperamos rede ou validação remota para liberar a UI.
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 4. Listener de Eventos (Totalmente passivo)
    // Esse listener NUNCA mexe no estado 'loading'.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Se o token for renovado ou usuário logar, atualizamos o estado
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
           // Atualiza perfil silenciosamente
           const p = await fetchProfile(newSession.user.id);
           if (mounted && p) setProfile(p);
        }
      } 
      else if (event === 'SIGNED_OUT') {
        // Apenas limpa dados, o router cuidará do redirecionamento
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      // NOTA: Ignoramos eventos de erro de rede para não travar a UI
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      // Não setamos loading=true aqui para manter a fluidez da saída
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
