import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, Bell, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca inicial
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      // Importante: actor:profiles!actor_id garante que o Supabase entenda qual FK usar
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      if (data) {
        setNotifications(data);
        
        // Marca como lidas silenciosamente após carregar
        const unreadIds = data.filter((n: any) => !n.is_read).map((n: any) => n.id);
        if (unreadIds.length > 0) {
          await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

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
          // Quando chega uma nova notificação, precisamos buscar os dados do perfil (actor)
          // pois o payload do realtime só traz os IDs, não o join.
          const { data: actorData } = await supabase
            .from('profiles')
            .select('username, avatar_url, full_name')
            .eq('id', payload.new.actor_id)
            .single();

          if (actorData) {
            const newNotification = {
              ...payload.new,
              actor: actorData
            };
            
            setNotifications((prev) => [newNotification, ...prev]);
            
            // Marca como lida imediatamente já que o usuário está vendo a tela
            supabase.from('notifications').update({ is_read: true }).eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleConnection = async (notification: any, action: 'accepted' | 'declined') => {
    // 1. Atualizar conexão
    const { error } = await supabase
      .from('connections')
      .update({ 
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.reference_id);

    if (!error) {
      // 2. Atualizar UI da notificação localmente para remover os botões
      setNotifications(prev => prev.map(n => 
        n.id === notification.id 
          ? { ...n, type: action === 'accepted' ? 'request_accepted' : 'request_declined' } 
          : n
      ));
      
      // 3. Se aceitou, cria notificação para a outra pessoa
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
      case 'request_declined': return <X className="text-red-500" size={14} />;
      default: return <div className="w-2 h-2 bg-ocean rounded-full" />;
    }
  };

  const NotificationContent = ({ n }: { n: any }) => {
    const name = n.actor?.username || 'Usuário desconhecido';
    const boldName = <span className="font-bold text-slate-200 hover:underline cursor-pointer">{name}</span>;
    
    switch (n.type) {
      case 'like_post': return <p className="text-sm text-slate-400 leading-snug">{boldName} curtiu sua publicação.</p>;
      case 'like_comment': return <p className="text-sm text-slate-400 leading-snug">{boldName} curtiu seu comentário.</p>;
      case 'comment': return <p className="text-sm text-slate-400 leading-snug">{boldName} comentou em sua publicação.</p>;
      case 'request_received': return <p className="text-sm text-slate-400 leading-snug">{boldName} deseja conectar-se com você.</p>;
      case 'request_accepted': return <p className="text-sm text-slate-400 leading-snug">{boldName} agora é sua conexão.</p>;
      case 'request_declined': return <p className="text-sm text-slate-400 leading-snug">Você recusou o pedido de {boldName}.</p>;
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
             <Loader2 className="animate-spin text-ocean" size={32} />
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
                  <div className="flex gap-3 mt-3 animate-fade-in">
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