
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useToast } from './ToastContext';

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
  const { showToast } = useToast();

  // Função auxiliar isolada para buscar perfil
  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil:", error.message);
      }
      return data;
    } catch (e) {
      console.error("Exceção ao buscar perfil:", e);
      return null;
    }
  }, []);

  // Lógica de Autocura de Perfil (caso usuário exista no Auth mas não na tabela profiles)
  const ensureProfileExists = useCallback(async (u: User) => {
    const newProfile = {
      id: u.id,
      username: u.user_metadata?.username || u.email?.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
      full_name: u.user_metadata?.full_name || '',
      avatar_url: u.user_metadata?.avatar_url || null,
      has_seen_tutorial: false
    };

    // Tenta criar. Se falhar, provavelmente já existe (race condition resolvida pelo banco)
    const { error } = await supabase.from('profiles').insert(newProfile);
    if (!error) return newProfile as Profile;
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // INICIALIZAÇÃO ÚNICA E DETERMINÍSTICA
    const init = async () => {
      try {
        // 1. Pega a sessão do armazenamento local (síncrono/rápido)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          if (mounted) setLoading(false);
          return; // Para aqui se der erro na sessão inicial
        }

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);

            // 2. Busca o perfil em background para não travar a UI inicial se possível?
            // Não, precisamos do perfil para alguns guards. Mas vamos limitar o tempo.

            try {
              let userProfile = await getProfile(initialSession.user.id);

              // 3. Fallback: Se não tem perfil, cria um
              if (!userProfile) {
                userProfile = await ensureProfileExists(initialSession.user);
              }

              if (mounted && userProfile) setProfile(userProfile);
            } catch (profileErr) {
              console.error("Erro não-bloqueante ao buscar perfil:", profileErr);
            }
          }
        }
      } catch (err) {
        console.error("Falha na inicialização da Auth:", err);
      } finally {
        // O LOADING *TEM* QUE PARAR AQUI, NÃO IMPORTA O QUE ACONTEÇA
        if (mounted) setLoading(false);
      }
    };

    init();

    // Safety Timeout Reduzido e Agressivo
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("⚠️ Auth loading force-stop (timeout 3s)");
        setLoading(false);
      }
    }, 3000); // 3 segundos é mais que suficiente para local session

    // Window Focus Handler (Correção para Mobile Resume)
    const handleFocus = () => {
      const { data: { session: currentSession } } = supabase.auth.getSession().then(({ data }) => {
        if (data.session && !session) setSession(data.session);
      });
      // Se voltarmos para o app e ele estiver preso carregando, soltamos.
      if (loading) setLoading(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    // ESCUTA EVENTOS DE MUDANÇA DE ESTADO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      console.log(`Auth event: ${event}`);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Apenas busca perfil se ainda não tiver
        if (!profile) {
          getProfile(newSession.user.id).then(p => {
            if (mounted && p) setProfile(p);
          });
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      subscription.unsubscribe();
    };
  }, [getProfile, ensureProfileExists]);

  const signOut = async () => {
    setLoading(true); // Feedback visual imediato
    try {
      await supabase.auth.signOut();
      // O listener onAuthStateChange vai lidar com a limpeza do estado
    } catch (error) {
      console.error("Erro ao sair:", error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const data = await getProfile(user.id);
      if (data) setProfile(data);
    }
  };

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [session, user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
