
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, Bell, Loader2, X, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: notifsData, error } = await supabase
        .from('notifications')
        .select(`*, actor:profiles!actor_id(id, username, avatar_url, full_name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro fetch notifications:", error);
      }

      const { data: pendingRequests } = await supabase
        .from('connections')
        .select(`id, created_at, requester:profiles!requester_id(id, username, avatar_url, full_name)`)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      let combined: Notification[] = [...(notifsData as any || [])];

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq."${user.id}"` }, fetchData)
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
          await supabase.from('connections').delete().match({ requester_id: targetUserId, receiver_id: user.id });
        } else {
          const { data: exists } = await supabase.from('connections').select('id').match({ requester_id: targetUserId, receiver_id: user.id, status: 'accepted' }).maybeSingle();
          if (!exists) throw new Error("Solicitação não encontrada.");
        }
      } else {
        if (action === 'declined') {
          await supabase.from('connections').delete().eq('id', connectionId);
          showToast('Solicitação recusada.');
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
          showToast('Conexão estabelecida!');
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
      fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'like_post': return <span className="material-symbols-outlined text-rose-500 fill-1 text-[20px]">favorite</span>;
      case 'comment': return <span className="material-symbols-outlined text-primary fill-1 text-[20px]">chat_bubble</span>;
      case 'request_received': return <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>;
      case 'request_accepted': return <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>;
      case 'request_accepted_by_me': return <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>;
      case 'request_declined_by_me': return <span className="material-symbols-outlined text-slate-500 text-[20px]">cancel</span>;
      default: return <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>;
    }
  };

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="min-h-full pb-32">
        {/* Header */}
        <div className="px-5 pt-8 pb-6 sticky top-0 z-30">
          <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-2xl border-b border-white/5" />
          <div className="relative z-10 max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">Atividade</h1>
            <div className="size-10 glass-button rounded-xl flex items-center justify-center text-primary relative">
              <Bell size={20} />
              {notifications.some(n => !n.is_read) && (
                <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full border-2 border-midnight-950 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-6 animate-pulse">
              <div className="size-20 glass-card rounded-[2.5rem] flex items-center justify-center border-primary/20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Sincronizando</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Buscando notificações</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in glass-card rounded-[3rem] border-dashed border-white/10">
              <div className="size-24 bg-midnight-900 rounded-[3rem] flex items-center justify-center mb-8 border border-white/5 rotate-6 shadow-2xl">
                <span className="material-symbols-outlined text-slate-700 text-[48px]">notifications_off</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Nenhuma notificação</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[240px]">
                  Você está em dia! Novas interações aparecerão aqui.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map(n => {
                const actorName = n.actor?.username || "Membro";
                const actorAvatar = n.actor?.avatar_url;
                const isUnread = !n.is_read;

                return (
                  <div
                    key={n.id}
                    className={`relative p-5 glass-card rounded-[2rem] flex gap-4 transition-all group hover:bg-white/5 active:scale-[0.98] border-white/5 ${isUnread ? 'bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(13,162,231,0.05)]' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar url={actorAvatar} alt={actorName} size="md" className="rounded-2xl border-white/5" />
                      <div className="absolute -bottom-1 -right-1 size-7 bg-midnight-950 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                        <NotificationIcon type={n.type} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-300 leading-snug">
                          <span
                            className="font-black text-white group-hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/profile/${n.actor?.id}`)}
                          >
                            {actorName}
                          </span>
                          <span className="ml-1.5 opacity-80">
                            {n.type === 'like_post' && 'curtiu sua publicação.'}
                            {n.type === 'comment' && 'comentou sua publicação.'}
                            {n.type === 'request_received' && 'quer se conectar.'}
                            {n.type === 'request_accepted' && 'aceitou sua conexão!'}
                            {n.type === 'request_accepted_by_me' && '• Conexão estabelecida.'}
                            {n.type === 'request_declined_by_me' && '• Solicitação removida.'}
                          </span>
                        </p>
                        {isUnread && (
                          <div className="shrink-0 size-2 bg-primary rounded-full shadow-[0_0_8px_rgba(13,162,231,0.8)]" />
                        )}
                      </div>

                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </span>

                      {n.type === 'request_received' && (
                        <div className="flex gap-3 mt-4 animate-slide-up">
                          <button
                            onClick={() => handleFriendRequest(n, 'accepted')}
                            disabled={!!processingId}
                            className="flex-1 h-12 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                          >
                            {processingId === n.id ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(n, 'declined')}
                            disabled={!!processingId}
                            className="flex-1 h-12 glass-button text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
