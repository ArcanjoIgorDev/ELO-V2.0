
import React, { useEffect, useState, useCallback } from 'react';
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

    const handleManualRefresh = () => {
      setTimeout(() => {
        fetchBadges();
      }, 500);
    };

    window.addEventListener('elo:refresh-badges', handleManualRefresh);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBadges();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase.channel('badges_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq."${user.id}"` },
        () => {
          setUnreadMessagesCount(p => p + 1);
          fetchBadges();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq."${user.id}"` },
        () => fetchBadges())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq."${user.id}"` },
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

  const NavItem = ({ path, icon, badgeCount = 0, hasDot = false }: { path: string, icon: string, badgeCount?: number, hasDot?: boolean }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => navigate(path)}
        className="relative flex flex-col items-center justify-center p-2.5 group transition-all"
      >
        <div className={`relative flex items-center justify-center transition-all duration-300 ${active ? 'text-primary scale-110 mb-1' : 'text-slate-500 hover:text-slate-300'}`}>
          <span className={`material-symbols-outlined text-[28px] ${active ? 'fill-1' : ''}`}>
            {icon}
          </span>

          {hasDot && !active && (
            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full border-2 border-[#020617] animate-pulse"></span>
          )}

          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full border border-[#020617] shadow-lg shadow-primary/20">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>
        {active && (
          <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(13,162,231,0.5)]"></div>
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 glass-nav p-safe pb-4 transition-all duration-300 translate-y-0 group-data-[keyboard=open]:translate-y-full">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto w-full px-2">
        <NavItem path="/feed" icon="home" />
        <NavItem path="/discover" icon="explore" />

        {/* Create Post Button - Highlighted */}
        <button
          onClick={() => navigate('/create')}
          className="relative -top-3 transform transition-all active:scale-90"
        >
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/30 border border-white/10">
            <span className="material-symbols-outlined text-[32px] font-bold">add</span>
          </div>
        </button>

        <NavItem path="/messages" icon="mail" badgeCount={unreadMessagesCount} />
        <NavItem path="/notifications" icon="notifications" hasDot={hasUnreadNotifs} />
      </div>
    </nav>
  );
};
