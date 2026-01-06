
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Check, Bell, Loader2, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PullToRefresh } from '../components/ui/PullToRefresh';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // 1. Busca notificações do banco
      const { data: notifsData } = await supabase
        .from('notifications')
        .select(`*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url, full_name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Busca solicitações pendentes reais (Fonte da verdade)
      const { data: pendingRequests } = await supabase
        .from('connections')
        .select(`id, created_at, requester:profiles!requester_id(id, username, avatar_url, full_name)`)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      // 3. Merge para garantir que solicitações sem notificação apareçam
      let combined = [...(notifsData || [])];
      
      pendingRequests?.forEach((req: any) => {
        const exists = combined.some(n => 
          n.type === 'request_received' && 
          (n.reference_id === req.id || n.actor_id === req.requester.id)
        );
        
        if (!exists) {
          combined.unshift({
            id: `sys-${req.id}`,
            type: 'request_received',
            user_id: user.id,
            actor_id: req.requester.id,
            actor: req.requester,
            reference_id: req.id,
            is_read: false,
            created_at: req.created_at,
            is_virtual: true
          });
        }
      });

      // Ordenar e filtrar
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(combined.filter(n => !!n.actor));

      // Marcar como lidas
      const unreadIds = notifsData?.filter((n: any) => !n.is_read).map((n: any) => n.id) || [];
      if (unreadIds.length > 0) {
        supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then(() => {});
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

  const handleFriendRequest = async (notification: any, action: 'accepted' | 'declined') => {
    if (processingId || !user) return;
    setProcessingId(notification.id);

    try {
      let connectionId = notification.reference_id;
      const targetUserId = notification.actor_id;

      // Se não tivermos o ID da conexão direto, buscamos no banco
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
        // Fallback final: Tenta atualizar direto pelo par de IDs se o ID da row falhar
        // Nota: RLS deve permitir isso
        if (action === 'declined') {
           await supabase.from('connections').delete().match({ requester_id: targetUserId, receiver_id: user.id });
        } else {
           // Se não achou ID, não dá pra dar update.
           throw new Error("Solicitação não encontrada ou já processada.");
        }
      } else {
        // Temos o ID, fazemos a ação
        if (action === 'declined') {
          await supabase.from('connections').delete().eq('id', connectionId);
        } else {
          const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', connectionId);
          
          if (error) throw error;

          // Notifica o solicitante
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: user.id,
            type: 'request_accepted',
            reference_id: connectionId
          });
        }
      }

      // Atualiza UI Otimista
      setNotifications(prev => prev.map(n => {
        if (n.id === notification.id) {
          return { ...n, type: action === 'accepted' ? 'request_accepted_by_me' : 'request_declined_by_me' };
        }
        return n;
      }));

    } catch (error: any) {
      console.error("Erro ao aceitar:", error);
      alert(`Erro: ${error.message || "Falha ao processar."}`);
      // Recarrega para garantir estado real
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
      <div className="min-h-full pb-20 bg-midnight-950">
        <div className="px-5 py-4 sticky top-0 bg-midnight-950/95 backdrop-blur-xl z-30 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Atividade</h1>
          {loading && <Loader2 className="animate-spin text-ocean" size={16} />}
        </div>

        <div className="divide-y divide-white/5">
          {!loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                 <Bell size={24} />
              </div>
              <p className="text-slate-400 font-medium">Você não tem novas notificações.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.is_read ? 'bg-ocean-950/10' : ''}`}>
                <div className="relative shrink-0 pt-1">
                  <Avatar url={n.actor?.avatar_url} alt={n.actor?.username} size="md" />
                  <div className="absolute -bottom-1 -right-1 bg-midnight-950 rounded-full p-1 border border-white/10 ring-2 ring-midnight-950">
                     <NotificationIcon type={n.type} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-slate-300">
                    <span className="font-bold text-slate-100">{n.actor?.username}</span>
                    {n.type === 'like_post' && ' curtiu seu post.'}
                    {n.type === 'comment' && ' comentou na sua publicação.'}
                    {n.type === 'request_received' && ' quer conectar com você.'}
                    {n.type === 'request_accepted' && ' agora é sua conexão!'}
                    {n.type === 'request_accepted_by_me' && ' • Conexão aceita.'}
                    {n.type === 'request_declined_by_me' && ' • Solicitação removida.'}
                  </p>
                  
                  <span className="text-xs text-slate-500 mt-1 block">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  
                  {n.type === 'request_received' && (
                    <div className="flex gap-3 mt-3 animate-fade-in">
                      <button 
                        onClick={() => handleFriendRequest(n, 'accepted')}
                        disabled={!!processingId}
                        className="flex-1 bg-ocean hover:bg-ocean-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-ocean/20 flex items-center justify-center gap-2"
                      >
                        {processingId === n.id ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar'}
                      </button>
                      <button 
                        onClick={() => handleFriendRequest(n, 'declined')}
                        disabled={!!processingId}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-white/5"
                      >
                        Excluir
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
