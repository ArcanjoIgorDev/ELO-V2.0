
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, Bell, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PullToRefresh } from '../components/ui/PullToRefresh';

interface Notification {
  id: string;
  type: string;
  actor_id: string;
  user_id: string;
  created_at: string;
  is_read: boolean;
  reference_id?: string;
  actor?: {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
  } | null;
  is_virtual?: boolean;
}

export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      // FIX CRÍTICO: Usa !actor_id (nome da coluna) para o join, mais seguro que constraint name
      const { data: notifsData, error } = await supabase
        .from('notifications')
        .select(`*, actor:profiles!actor_id(id, username, avatar_url, full_name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro fetch notifications:", error);
      }

      // Solicitações Pendentes
      const { data: pendingRequests } = await supabase
        .from('connections')
        .select(`id, created_at, requester:profiles!requester_id(id, username, avatar_url, full_name)`)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      let combined: Notification[] = [...(notifsData as any || [])];

      // Merge seguro
      if (pendingRequests) {
        pendingRequests.forEach((req: any) => {
          const exists = combined.some(n =>
            n.type === 'request_received' &&
            (n.reference_id === req.id || n.actor_id === req.requester?.id)
          );

          if (!exists) {
            combined.unshift({
              id: `sys-${req.id}`,
              type: 'request_received',
              user_id: user.id,
              actor_id: req.requester?.id,
              actor: req.requester,
              reference_id: req.id,
              is_read: false,
              created_at: req.created_at,
              is_virtual: true
            });
          }
        });
      }

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(combined);

      // Mark as read (silencioso)
      const unreadIds = notifsData?.filter((n: any) => !n.is_read).map((n: any) => n.id) || [];
      if (unreadIds.length > 0) {
        supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then(() => { });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!user) return;
    const channel = supabase
      .channel('notifications_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleFriendRequest = async (notification: Notification, action: 'accepted' | 'declined') => {
    if (processingId || !user) return;
    setProcessingId(notification.id);

    try {
      let connectionId = notification.reference_id;
      const targetUserId = notification.actor_id;

      if (!connectionId) {
        const { data: conn } = await supabase
          .from('connections')
          .select('id')
          .eq('requester_id', targetUserId)
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (conn) connectionId = conn.id;
      }

      if (!connectionId) {
        if (action === 'declined') {
          // Cleanup de segurança
          await supabase.from('connections').delete().match({ requester_id: targetUserId, receiver_id: user.id });
        } else {
          // Tenta recuperar conexão aceita anteriormente
          const { data: exists } = await supabase.from('connections').select('id').match({ requester_id: targetUserId, receiver_id: user.id, status: 'accepted' }).maybeSingle();
          if (!exists) throw new Error("Solicitação não encontrada.");
        }
      } else {
        if (action === 'declined') {
          await supabase.from('connections').delete().eq('id', connectionId);
        } else {
          const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', connectionId);

          if (error) throw error;

          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: user.id,
            type: 'request_accepted',
            reference_id: connectionId
          });
        }
      }

      setNotifications((prev: Notification[]) => prev.map((n: Notification) => {
        if (n.id === notification.id) {
          return { ...n, type: action === 'accepted' ? 'request_accepted_by_me' : 'request_declined_by_me' };
        }
        return n;
      }));

    } catch (error: any) {
      console.error("Erro ao processar:", error);
      // Recarrega para garantir estado correto
      fetchData();
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
      case 'request_declined_by_me': return <X className="text-slate-500" size={14} />;
      default: return <div className="w-2 h-2 bg-ocean rounded-full" />;
    }
  };

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="min-h-full pb-32">
        {/* Sticky Header */}
        <div className="px-5 py-5 sticky top-0 z-30 transition-all">
          <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-xl border-b border-white/5" />
          <div className="relative z-10 max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">Atividade</h1>
            {loading && <Loader2 className="animate-spin text-primary" size={20} />}
          </div>
        </div>

        <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
          {!loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in glass-panel rounded-[2rem]">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-primary/20 rotate-6 shadow-xl shadow-primary/5">
                <Bell size={32} className="text-primary" />
              </div>
              <h3 className="text-white font-bold mb-2">Tudo calmo no oceano</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                Você ainda não tem novas notificações. Suas interações aparecerão aqui.
              </p>
            </div>
          ) : (
            notifications.map(n => {
              const actorName = n.actor?.username || "Alguém";
              const actorAvatar = n.actor?.avatar_url;
              const isUnread = !n.is_read;

              return (
                <div
                  key={n.id}
                  className={`relative p-4 glass-panel rounded-[1.5rem] flex gap-4 transition-all group hover:bg-white/5 active:scale-[0.99] border-white/5 ${isUnread ? 'ring-1 ring-primary/30 border-primary/20 bg-primary/5' : ''}`}
                >
                  {isUnread && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#0da2e7]" />
                  )}

                  <div className="relative shrink-0">
                    <Avatar url={actorAvatar} alt={actorName} size="md" />
                    <div className="absolute -bottom-1 -right-1 bg-background-dark rounded-full p-1.5 border border-white/10 shadow-lg">
                      <NotificationIcon type={n.type} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-slate-300 leading-snug">
                      <span className="font-bold text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/profile/${n.actor?.id}`)}>
                        {actorName}
                      </span>
                      <span className="ml-1">
                        {n.type === 'like_post' && 'curtiu seu post.'}
                        {n.type === 'comment' && 'comentou na sua publicação.'}
                        {n.type === 'request_received' && 'quer conectar com você.'}
                        {n.type === 'request_accepted' && 'agora é sua conexão!'}
                        {n.type === 'request_accepted_by_me' && '• Conexão aceita.'}
                        {n.type === 'request_declined_by_me' && '• Solicitação removida.'}
                      </span>
                    </p>

                    <span className="text-[11px] text-slate-500 mt-1 block font-bold uppercase tracking-wider opacity-60">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </span>

                    {n.type === 'request_received' && (
                      <div className="flex gap-2 mt-4 animate-slide-up">
                        <button
                          onClick={() => handleFriendRequest(n, 'accepted')}
                          disabled={!!processingId}
                          className="flex-1 bg-primary hover:bg-sky-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                          {processingId === n.id ? <Loader2 size={14} className="animate-spin" /> : 'Aceitar'}
                        </button>
                        <button
                          onClick={() => handleFriendRequest(n, 'declined')}
                          disabled={!!processingId}
                          className="flex-1 glass-button text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PullToRefresh>

  );
};
