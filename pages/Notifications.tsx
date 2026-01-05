
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
      // 1. Busca Notificações Normais
      const { data: notifsData, error: notifsError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (notifsError) throw notifsError;

      // 2. Busca Solicitações Pendentes "Órfãs" (Sem notificação)
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('connections')
        .select(`
          id,
          created_at,
          requester:profiles!requester_id (
             id, username, avatar_url, full_name
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // 3. Mesclagem (Merge)
      let combined = [...(notifsData || [])];
      
      pendingRequests?.forEach((req: any) => {
        const alreadyHas = combined.some(
          n => n.type === 'request_received' && n.reference_id === req.id
        );

        if (!alreadyHas) {
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
      
      // Filtra itens inválidos
      const cleanList = combined.filter(n => !!n.actor);
      setNotifications(cleanList);

      // Marca reais como lidas
      const realUnreadIds = notifsData?.filter((n: any) => !n.is_read).map((n: any) => n.id) || [];
      if (realUnreadIds.length > 0) {
        supabase.from('notifications').update({ is_read: true }).in('id', realUnreadIds).then(() => {});
      }

    } catch (err: any) {
      console.error("Erro notifications:", err);
      // Não mostra erro visual para não assustar o usuário, apenas loga
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!user) return;

    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleConnection = async (notification: any, action: 'accepted' | 'declined') => {
    if (processingId || !user) return;
    setProcessingId(notification.id); // Trava UI pelo ID da notificação

    const connectionId = notification.reference_id; 

    try {
      // 1. ATUALIZAÇÃO CRÍTICA (DB)
      const { error: updateError } = await supabase
        .from('connections')
        .update({ 
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId); // Simplificado: removemos check extra de receiver para evitar conflito de cache, RLS do banco já protege.

      if (updateError) throw updateError;

      // 2. ATUALIZAÇÃO VISUAL IMEDIATA (Otimista)
      setNotifications(prev => prev.map(n => {
         if (n.reference_id === connectionId && n.type === 'request_received') {
             return { 
               ...n, 
               type: action === 'accepted' ? 'request_accepted_by_me' : 'request_declined_by_me' 
             };
         }
         return n;
      }));

      // 3. NOTIFICAÇÃO SECUNDÁRIA (Tenta enviar, mas ignora erro de RLS)
      if (action === 'accepted') {
        try {
           await supabase.from('notifications').insert({
            user_id: notification.actor_id, // Destino
            actor_id: user.id,              // Origem
            type: 'request_accepted',
            reference_id: connectionId
          });
        } catch (ignorableError) {
          // Em produção, isso falha frequentemente se o RLS não permitir insert em outro user.
          // Ignoramos intencionalmente para não travar o fluxo do usuário.
          console.warn("Notificação de aceite falhou (RLS), mas conexão foi criada.");
        }
      }

    } catch (error: any) {
      console.error("Erro crítico handleConnection:", error);
      alert("Não foi possível processar a ação. Tente recarregar.");
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
      case 'request_declined_by_me': return <p className="text-[15px] text-slate-500">Solicitação recusada.</p>;
      default: return <p className="text-[15px] text-slate-400">Nova interação de {boldName}.</p>;
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
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
             <AlertCircle className="text-red-400" size={20} />
             <p className="text-sm text-red-200 font-medium">{error}</p>
          </div>
        )}

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
          ) : notifications.length === 0 && !error ? (
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
