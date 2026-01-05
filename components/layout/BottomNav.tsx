
import React, { useEffect, useState } from 'react';
import { Home, Search, PlusSquare, User, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  // Monitora notificações não lidas em tempo real
  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setHasUnread((count || 0) > 0);
    };

    checkUnread();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        setHasUnread(true);
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [user, location.pathname]); // Reseta ao navegar

  // Se estiver na página de notificações, limpa o badge visualmente (a lógica de marcar como lida está na página)
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setHasUnread(false);
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label, isPrimary = false, hasBadge = false }: { path: string, icon: any, label: string, isPrimary?: boolean, hasBadge?: boolean }) => {
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
        {hasBadge && (
          <span className="absolute top-3 right-[25%] w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-midnight-950 animate-pulse"></span>
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

        <NavItem path="/notifications" icon={Bell} label="Alertas" hasBadge={hasUnread} />
        <NavItem path="/profile" icon={User} label="Perfil" />

      </div>
    </nav>
  );
};
