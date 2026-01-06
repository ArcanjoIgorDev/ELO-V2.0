
import React, { useEffect, useState, useCallback } from 'react';
import { Home, Search, PlusSquare, User, Bell, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const checkUnread = useCallback(async () => {
    if (!user) return;
    
    // Notificações
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setHasUnreadNotifs((notifCount || 0) > 0);

    // Mensagens
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    setUnreadMessages(msgCount || 0);
  }, [user]);

  // Monitora notificações e mensagens
  useEffect(() => {
    if (!user) return;

    checkUnread();

    // Notificações (Apenas Insert para avisar nova)
    const notifSub = supabase
      .channel('nav:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setHasUnreadNotifs(true);
      })
      .subscribe();

    // Mensagens: Estratégia Híbrida Robustez
    const msgSub = supabase
      .channel('nav:messages_global')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Nova mensagem: Incremento otimista
            setUnreadMessages(prev => prev + 1);
          } else {
            // Update ou Delete: Recalcula do servidor para garantir precisão absoluta
            // Isso resolve o problema de contadores negativos ou travados
            checkUnread();
          }
        }
      )
      .subscribe();

    return () => { 
        notifSub.unsubscribe();
        msgSub.unsubscribe();
    };
  }, [user, checkUnread]);

  // Event Listener para Atualização Forçada (vindo do ChatPage)
  useEffect(() => {
    const handleForceRefresh = () => checkUnread();
    window.addEventListener('elo:refresh-badges', handleForceRefresh);
    return () => window.removeEventListener('elo:refresh-badges', handleForceRefresh);
  }, [checkUnread]);

  // Limpa apenas notificações ao visitar a página
  useEffect(() => {
    if (location.pathname === '/notifications') setHasUnreadNotifs(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label, isPrimary = false, badgeCount = 0, hasDot = false }: { path: string, icon: any, label: string, isPrimary?: boolean, badgeCount?: number, hasDot?: boolean }) => {
    const active = isActive(path);
    
    if (isPrimary) {
      return (
        <button 
          onClick={() => navigate(path)}
          className="flex flex-col items-center justify-center group active:scale-95 transition-transform"
        >
          <div className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${active ? 'bg-ocean-600 text-white shadow-ocean/30' : 'bg-ocean text-white shadow-ocean/20'}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium mt-1 text-ocean opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1">
            {label}
          </span>
        </button>
      )
    }

    return (
      <button 
        onClick={() => navigate(path)}
        className="flex-1 flex flex-col items-center justify-center h-full space-y-1 group active:scale-95 transition-transform relative"
      >
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-ocean' : 'text-slate-500 group-hover:text-slate-300'}`}>
          <Icon size={26} strokeWidth={active ? 2.5 : 2} fill={active ? "currentColor" : "none"} fillOpacity={0.2} />
        </div>
        
        {hasDot && (
          <span className="absolute top-3 right-[28%] w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-midnight-950 animate-pulse"></span>
        )}
        
        {badgeCount > 0 && (
           <span className="absolute top-2 right-[20%] bg-rose-500 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-midnight-950 transition-all transform scale-100 animate-in zoom-in">
             {badgeCount > 9 ? '9+' : badgeCount}
           </span>
        )}
      </button>
    );
  };

  return (
    <nav className="flex-none z-50 w-full pb-safe bg-midnight-950/90 backdrop-blur-xl border-t border-white/5">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        <NavItem path="/feed" icon={Home} label="Início" />
        <NavItem path="/discover" icon={Search} label="Buscar" />
        <div className="px-2">
           <NavItem path="/create" icon={PlusSquare} label="Novo" isPrimary />
        </div>
        <NavItem path="/messages" icon={MessageCircle} label="Chat" badgeCount={unreadMessages} />
        <NavItem path="/notifications" icon={Bell} label="Alertas" hasDot={hasUnreadNotifs} />
      </div>
    </nav>
  );
};
