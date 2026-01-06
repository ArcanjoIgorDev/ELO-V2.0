
import React, { useEffect, useState, useCallback } from 'react';
import { Home, Search, PlusSquare, Bell, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    try {
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (msgCount !== null) setUnreadMessagesCount(msgCount);

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (notifCount !== null) setHasUnreadNotifs(notifCount > 0);

    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchBadges();

    // HANDLER REFORÇADO: Recebe evento de limpeza
    const handleManualRefresh = () => {
      // 1. Busca com delay para dar tempo do UPDATE do banco ocorrer
      setTimeout(() => {
        fetchBadges();
      }, 500); // Meio segundo de delay é o "pulo do gato" para evitar race condition
    };

    window.addEventListener('elo:refresh-badges', handleManualRefresh);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBadges();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase.channel('badges_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => {
          setUnreadMessagesCount(p => p + 1); // Feedback otimista
          fetchBadges();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => fetchBadges())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setHasUnreadNotifs(true))
      .subscribe();

    return () => {
      window.removeEventListener('elo:refresh-badges', handleManualRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user, fetchBadges]);

  useEffect(() => {
    if (location.pathname === '/notifications') setHasUnreadNotifs(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  if (location.pathname.startsWith('/chat/')) return null;

  const NavItem = ({ path, icon: Icon, label, isPrimary = false, badgeCount = 0, hasDot = false }: { path: string, icon: any, label: string, isPrimary?: boolean, badgeCount?: number, hasDot?: boolean }) => {
    const active = isActive(path);

    if (isPrimary) {
      return (
        <button
          onClick={() => navigate(path)}
          className="group active:scale-95 transition-transform"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-2 border-midnight-950 px-0.5
            ${active ? 'bg-ocean-500 text-white shadow-ocean/40 scale-105' : 'bg-ocean text-white shadow-ocean/20'}`}>
            <Icon size={26} strokeWidth={2.5} />
          </div>
        </button>
      )
    }

    return (
      <button
        onClick={() => navigate(path)}
        className="flex-1 flex flex-col items-center justify-center h-full relative group"
      >
        <div className={`p-2 rounded-xl transition-all duration-300 relative ${active ? 'text-ocean scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <Icon size={24} strokeWidth={active ? 2.5 : 2} fill={active ? "currentColor" : "none"} fillOpacity={0.2} />

          {/* Active Indicator Dot under icon */}
          {active && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ocean rounded-full shadow-[0_0_8px_currentColor]"></span>
          )}
        </div>


        {hasDot && !active && (
          <span className="absolute top-4 right-[28%] w-2 h-2 bg-rose-500 rounded-full border-2 border-midnight-950/80 animate-pulse"></span>
        )}

        {badgeCount > 0 && (
          <span className="absolute top-2.5 right-[20%] bg-rose-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full border border-midnight-950 transition-all font-mono pointer-events-none">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[360px] pb-0">
      <div className="bg-midnight-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex justify-between items-center h-[72px] px-2 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-ocean/30 to-transparent opacity-50" />

        <NavItem path="/feed" icon={Home} label="Início" />
        <NavItem path="/discover" icon={Search} label="Buscar" />

        <div className="relative -top-6">
          <NavItem path="/create" icon={PlusSquare} label="Novo" isPrimary />
        </div>

        <NavItem path="/messages" icon={MessageCircle} label="Chat" badgeCount={unreadMessagesCount} />
        <NavItem path="/notifications" icon={Bell} label="Alertas" hasDot={hasUnreadNotifs} />
      </div>
    </nav>
  );
};
