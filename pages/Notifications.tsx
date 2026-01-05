
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
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    
    try {
      // 1. Busca Notificações
      const { data: notifsData } = await supabase
        .from('notifications')
        .select(`*, actor:profiles!notifications_actor_id_fkey(username, avatar_url, full_name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // 2. Busca Pedidos Pendentes (Garante que nada seja perdido)
      const { data: pendingRequests } = await supabase
        .from('connections')
        .select(`id, created_at, requester:profiles!requester_id(id, username, avatar_url, full_name)`)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      // 3. Mesclagem Inteligente
      let combined = [...(notifsData || [])];
      
      pendingRequests?.forEach((req: any) => {
        // Verifica se já existe notificação visual para este pedido
        const exists = combined.some(n => n.type === 'request_received' && (n.reference_id === req.id || n.actor_id === req.requester.id));
        
        if (!exists) {
          combined.unshift({
            id: `synth-${req.id}`,
            type: 'request_received',
            user_id: user.id,
            actor_id: req.requester.id,
            actor: req.requester,
            reference_id: req.id,
            is_read: false,
            created_at: req.created_at
          });
        }
      });

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Remove notificações órfãs (usuários deletados)
      setNotifications(combined.filter(n => !!n.actor));

      // Marca lidas
      const unreadIds = notifsData?.filter((n: any) => !n.is_read).map((n: any) => n.id) || [];
      if (unreadIds.length > 0) {
        supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then(() => {});
      }

    } catch (err) {
      console.warn("Sync warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!user) return;

    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleConnection = async (notification: any, action: 'accepted' | 'declined') => {
    if (processingId || !user) return;
    setProcessingId(notification.id);

    // Estratégia Dupla: Tenta ID da conexão OU par de usuários
    const connectionId = notification.reference_id;
    const requesterId = notification.actor_id;

    try {
      let updateSuccessful = false;

      // Tentativa 1: Via ID direto (mais rápido)
      if (connectionId && !connectionId.startsWith('synth-')) {
        const { error, count } = await supabase
          .from('connections')
          .update({ status: action, updated_at: new Date().toISOString() })
          .eq('id', connectionId)
          .select('id', { count: 'exact' }); // Confirma se atualizou algo
        
        if (!error) updateSuccessful = true;
      }

      // Tentativa 2: Via Requester + Receiver (Fallback de segurança)
      if (!updateSuccessful && requesterId) {
        const { error } = await supabase
          .from('connections')
          .update({ status: action, updated_at: new Date().toISOString() })
          .eq('requester_id', requesterId)
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
        
        if (!error) updateSuccessful = true;
      }

      // Se falhou tudo, lança erro
      if (!updateSuccessful) {
        // Verifica se JÁ foi aceito antes (evita erro falso)
        const { data: check } = await supabase
           .from('connections')
           .select('status')
           .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${requesterId})`)
           .maybeSingle();
        
        if (check?.status !== action) {
           throw new Error("Não foi possível localizar o pedido.");
        }
      }

      // Atualiza UI Otimista
      setNotifications(prev => prev.map(n => {
         // Atualiza todos os itens relacionados a este usuário
         if ((n.reference_id === connectionId || n.actor_id === requesterId) && n.type === 'request_received') {
             return { 
               ...n, 
               type: action === 'accepted' ? 'request_accepted_by_me' : 'request_declined_by_me' 
             };
         }
         return n;
      }));

      // Notifica o outro usuário (apenas se aceitou)
      if (action === 'accepted' && requesterId) {
        // Ignora erro de RLS aqui para não bloquear o fluxo principal
        supabase.from('notifications').insert({
          user_id: requesterId,
          actor_id: user.id,
          type: 'request_accepted',
          reference_id: connectionId
        }).then(() => {}); 
      }

    } catch (error: any) {
      console.error("Erro handleConnection:", error);
      alert("Houve um problema ao processar. Tente atualizar a página.");
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

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="min-h-full pb-20 bg-midnight-950">
        <div className="px-5 py-4 sticky top-0 bg-midnight-950/95 backdrop-blur-xl z-30 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Atividade</h1>
          {loading && <Loader2 className="animate-spin text-ocean" size={16} />}
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
             <AlertCircle className="text-red-400" size={16} />
             <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {!loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                 <Bell size={24} />
              </div>
              <p className="text-slate-400 font-medium">Tudo tranquilo por aqui.</p>
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
                    {n.type === 'comment' && ' comentou: "..."'}
                    {n.type === 'request_received' && ' quer conectar.'}
                    {n.type === 'request_accepted' && ' aceitou seu pedido!'}
                    {n.type === 'request_accepted_by_me' && ' • Conexão aceita.'}
                    {n.type === 'request_declined_by_me' && ' • Pedido removido.'}
                  </p>
                  
                  <span className="text-xs text-slate-500 mt-1 block">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  
                  {n.type === 'request_received' && (
                    <div className="flex gap-3 mt-3 animate-fade-in">
                      <button 
                        onClick={() => handleConnection(n, 'accepted')}
                        disabled={!!processingId}
                        className="flex-1 bg-ocean hover:bg-ocean-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-ocean/20 flex items-center justify-center"
                      >
                        {processingId === n.id ? <Loader2 size={16} className="animate-spin" /> : 'Aceitar'}
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
