
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, Bell, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PullToRefresh } from '../components/ui/PullToRefresh';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Busca inicial
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
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
    fetchNotifications();
    
    if (!user) return;

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
    if (processingId) return;
    setProcessingId(notification.id);

    try {
      let connectionId = notification.reference_id;

      // --- LÓGICA DE SELF-HEALING (CORREÇÃO DE BUGS ANTIGOS) ---
      // Se a notificação não tiver ID (bug anterior), tentamos achar a conexão manualmente
      if (!connectionId) {
        console.warn("Reference ID faltando. Tentando recuperar conexão pendente...");
        const { data: fallbackConnection } = await supabase
          .from('connections')
          .select('id')
          .eq('requester_id', notification.actor_id)
          .eq('receiver_id', user?.id)
          .eq('status', 'pending')
          .single();

        if (fallbackConnection) {
          connectionId = fallbackConnection.id;
        } else {
          // Se não achar mesmo assim, removemos a notificação pois é inválida
          await supabase.from('notifications').delete().eq('id', notification.id);
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          throw new Error("Este pedido não existe mais ou foi cancelado.");
        }
      }
      // -----------------------------------------------------------

      // 2. Tenta atualizar o status
      const { error: updateError } = await supabase
        .from('connections')
        .update({ 
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      if (updateError) {
         console.error("Erro Supabase:", updateError);
         throw new Error("Falha ao atualizar conexão. Tente recarregar.");
      }

      // 3. Se aceitou, notifica o remetente original
      if (action === 'accepted') {
        await supabase.from('notifications').insert({
          user_id: notification.actor_id, // Quem pediu
          actor_id: user?.id,             // Eu (que aceitei)
          type: 'request_accepted',
          reference_id: connectionId
        });
      }

      // 4. Atualiza UI localmente
      setNotifications(prev => prev.map(n => {
         if (n.id === notification.id) {
             return { ...n, type: action === 'accepted' ? 'request_accepted_by_me' : 'request_declined_by_me' };
         }
         return n;
      }));

    } catch (error: any) {
      console.error("Falha ao processar pedido:", error);
      alert(error.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'like_post': return <Heart className="text-rose-500 fill-rose-500" size={14} />;
      case 'like_comment': return <Heart className="text-rose-500" size={14} />;
      case 'comment': return <MessageCircle className="text-ocean fill-ocean" size={14} />;
      case 'request_received': return <UserPlus className="text-ocean" size={14} />;
      case 'request_accepted': return <Check className="text-emerald-500" size={14} />;
      case 'request_accepted_by_me': return <Check className="text-emerald-500" size={14} />;
      case 'request_declined': return <X className="text-red-500" size={14} />;
      case 'request_declined_by_me': return <X className="text-slate-500" size={14} />;
      default: return <div className="w-2 h-2 bg-ocean rounded-full" />;
    }
  };

  const NotificationContent = ({ n }: { n: any }) => {
    const name = n.actor?.username || 'Usuário';
    const boldName = <span className="font-bold text-slate-100">{name}</span>;
    
    switch (n.type) {
      case 'like_post': return <p className="text-[15px] text-slate-400">{boldName} curtiu seu post.</p>;
      case 'like_comment': return <p className="text-[15px] text-slate-400">{boldName} curtiu seu comentário.</p>;
      case 'comment': return <p className="text-[15px] text-slate-400">{boldName} comentou em sua publicação.</p>;
      case 'request_received': return <p className="text-[15px] text-slate-200 font-medium">{boldName} quer conectar com você.</p>;
      case 'request_accepted': return <p className="text-[15px] text-emerald-400">{boldName} aceitou seu pedido!</p>;
      case 'request_accepted_by_me': return <p className="text-[15px] text-slate-500">Você aceitou {boldName}.</p>;
      case 'request_declined_by_me': return <p className="text-[15px] text-slate-500">Você recusou {boldName}.</p>;
      default: return <p className="text-[15px] text-slate-400">Nova interação de {boldName}.</p>;
    }
  };

  return (
    <PullToRefresh onRefresh={fetchNotifications}>
      <div className="min-h-full pb-20 bg-midnight-950">
        <div className="px-5 py-4 sticky top-0 bg-midnight-950/95 backdrop-blur-xl z-30 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Atividade</h1>
          {loading && <Loader2 className="animate-spin text-ocean" size={16} />}
        </div>

        <div className="divide-y divide-white/5">
          {loading && notifications.length === 0 ? (
             [1,2,3].map(i => (
               <div key={i} className="p-4 flex gap-4 animate-pulse">
                 <div className="w-10 h-10 rounded-full bg-white/5" />
                 <div className="flex-1 space-y-2">
                   <div className="w-1/2 h-3 bg-white/5 rounded" />
                   <div className="w-1/3 h-2 bg-white/5 rounded" />
                 </div>
               </div>
             ))
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                 <Bell size={24} />
              </div>
              <p className="text-slate-400 font-medium">Você está em dia.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.is_read ? 'bg-ocean-950/10' : ''}`}>
                <div className="relative shrink-0 pt-1">
                  <Avatar url={n.actor?.avatar_url} alt={n.actor?.username || '?'} size="md" />
                  <div className="absolute -bottom-1 -right-1 bg-midnight-950 rounded-full p-1 border border-white/10 ring-2 ring-midnight-950">
                     <NotificationIcon type={n.type} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <NotificationContent n={n} />
                  <span className="text-xs text-slate-500 mt-1 block">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  
                  {n.type === 'request_received' && (
                    <div className="flex gap-3 mt-3 animate-fade-in">
                      <button 
                        onClick={() => handleConnection(n, 'accepted')}
                        disabled={!!processingId}
                        className="flex-1 bg-ocean hover:bg-ocean-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-ocean/20"
                      >
                        {processingId === n.id ? '...' : 'Aceitar'}
                      </button>
                      <button 
                        onClick={() => handleConnection(n, 'declined')}
                        disabled={!!processingId}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-white/5"
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
    </PullToRefresh>
  );
};
