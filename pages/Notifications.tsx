
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, X, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca inicial
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setNotifications(data);
        
        // Marca como lidas silenciosamente
        const unreadIds = data.filter((n: any) => !n.is_read).map((n: any) => n.id);
        if (unreadIds.length > 0) {
          await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        }
      }
      setLoading(false);
    };

    fetchNotifications();

    // ⚡ REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Busca os dados do ator (quem gerou a notificação) para exibir Avatar e Nome
          const { data: actorData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.actor_id)
            .single();

          if (actorData) {
            const newNotification = {
              ...payload.new,
              actor: actorData
            };
            
            setNotifications((prev) => [newNotification, ...prev]);
            
            // Marca como lida imediatamente se o usuário já estiver nesta tela
            supabase.from('notifications').update({ is_read: true }).eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleConnection = async (notification: any, action: 'accepted' | 'declined' | 'blocked') => {
    // 1. Atualizar conexão
    const { error } = await supabase
      .from('connections')
      .update({ 
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.reference_id);

    if (!error) {
      // 2. Atualizar UI da notificação localmente
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // 3. Gerar notificação reversa se aceito
      if (action === 'accepted') {
        await supabase.from('notifications').insert({
          user_id: notification.actor_id,
          actor_id: user?.id,
          type: 'request_accepted',
          reference_id: notification.reference_id
        });
      }
    }
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'like_post': return <Heart className="text-rose-500 fill-rose-500" size={14} />;
      case 'like_comment': return <Heart className="text-rose-500" size={14} />;
      case 'comment': return <MessageCircle className="text-ocean fill-ocean" size={14} />;
      case 'request_received': return <UserPlus className="text-emerald-500" size={14} />;
      case 'request_accepted': return <Check className="text-emerald-500" size={14} />;
      default: return <div className="w-2 h-2 bg-ocean rounded-full" />;
    }
  };

  const NotificationContent = ({ n }: { n: any }) => {
    const boldName = <span className="font-bold text-slate-200 hover:underline cursor-pointer">{n.actor?.username || 'Alguém'}</span>;
    switch (n.type) {
      case 'like_post': return <p className="text-sm text-slate-400 leading-snug">{boldName} curtiu sua publicação.</p>;
      case 'like_comment': return <p className="text-sm text-slate-400 leading-snug">{boldName} curtiu seu comentário.</p>;
      case 'comment': return <p className="text-sm text-slate-400 leading-snug">{boldName} comentou em sua publicação.</p>;
      case 'request_received': return <p className="text-sm text-slate-400 leading-snug">{boldName} deseja conectar-se com você.</p>;
      case 'request_accepted': return <p className="text-sm text-slate-400 leading-snug">{boldName} agora é sua conexão.</p>;
      case 'request_declined': return <p className="text-sm text-slate-400 leading-snug">{boldName} recusou o pedido.</p>;
      default: return <p className="text-sm text-slate-400 leading-snug">Nova interação de {boldName}.</p>;
    }
  };

  return (
    <div className="min-h-full pb-20 bg-midnight-950">
      <div className="px-5 py-4 sticky top-0 bg-midnight-950/90 backdrop-blur-xl z-30 border-b border-white/5 flex items-center gap-3">
        <Bell size={20} className="text-white" />
        <h1 className="text-lg font-bold text-white tracking-tight">Atividade</h1>
      </div>

      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs text-slate-500 font-medium">Sincronizando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Bell size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Tudo tranquilo por aqui.</p>
            <p className="text-slate-600 text-xs mt-2 max-w-[200px]">Interaja com a comunidade para receber notificações.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.is_read ? 'bg-ocean-900/10' : 'hover:bg-white/[0.02]'}`}>
              <div className="relative shrink-0">
                <Avatar url={n.actor?.avatar_url} alt={n.actor?.username || '?'} size="md" />
                <div className="absolute -bottom-1 -right-1 bg-midnight-950 rounded-full p-1 border border-white/10 shadow-sm">
                   <NotificationIcon type={n.type} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <NotificationContent n={n} />
                <span className="text-[11px] text-slate-600 mt-1 block font-medium">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                
                {n.type === 'request_received' && (
                  <div className="flex gap-3 mt-3">
                    <button 
                      onClick={() => handleConnection(n, 'accepted')}
                      className="flex-1 bg-ocean hover:bg-ocean-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-ocean/20"
                    >
                      Aceitar
                    </button>
                    <button 
                      onClick={() => handleConnection(n, 'declined')}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 px-4 rounded-lg transition-colors border border-white/5"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
