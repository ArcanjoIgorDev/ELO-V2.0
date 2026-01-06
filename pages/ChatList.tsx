
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PullToRefresh } from '../components/ui/PullToRefresh';

export const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    // 1. Busca conexões aceitas (Amigos)
    const { data: connections } = await supabase
      .from('connections')
      .select(`
        requester:profiles!requester_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!connections) {
      setLoading(false);
      return;
    }

    // 2. Para cada amigo, busca a última mensagem
    const friends = connections.map((c: any) => c.requester.id === user.id ? c.receiver : c.requester);
    
    const conversationsData = await Promise.all(friends.map(async (friend) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', friend.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return {
        friend,
        lastMessage: lastMsg,
        unread: unreadCount || 0
      };
    }));

    // 3. Ordena: Quem tem mensagem mais recente primeiro.
    conversationsData.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });

    setConversations(conversationsData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
    
    // Realtime: Recarrega a lista se houver qualquer mudança nas mensagens recebidas
    const channel = supabase
      .channel('inbox_updates_list')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user?.id}` }, 
        () => {
           // Em vez de manipular estado complexo, recarregamos para garantir a verdade
           fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return (
    <PullToRefresh onRefresh={fetchConversations}>
      <div className="min-h-full pb-20 bg-midnight-950">
        <div className="px-5 py-6 sticky top-0 bg-midnight-950/95 backdrop-blur z-30 border-b border-white/5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversas</h1>
          <div className="bg-ocean/10 p-2 rounded-full"><MessageCircle className="text-ocean" size={20} /></div>
        </div>
        
        <div className="p-2 space-y-1 mt-2">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ocean" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><MessageCircle size={30} className="opacity-50" /></div>
               <h3 className="text-white font-bold mb-2">Sua inbox está vazia</h3>
               <p className="text-sm">Conecte-se com pessoas para iniciar conversas.</p>
               <button onClick={() => navigate('/discover')} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold">Encontrar Pessoas</button>
            </div>
          ) : (
            conversations.map(({ friend, lastMessage, unread }) => (
              <button 
                key={friend.id}
                onClick={() => navigate(`/chat/${friend.id}`)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border border-transparent ${unread > 0 ? 'bg-white/5 border-white/5' : 'hover:bg-white/5 active:scale-[0.98]'}`}
              >
                <div className="relative">
                  <Avatar url={friend.avatar_url} alt={friend.username} size="lg" />
                  {unread > 0 && (
                     <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-midnight-950 shadow-sm animate-pulse">
                        {unread}
                     </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-1">
                     <h3 className={`text-[15px] truncate ${unread > 0 ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>{friend.username}</h3>
                     {lastMessage && (
                        <span className={`text-[11px] ${unread > 0 ? 'text-ocean font-bold' : 'text-slate-500'}`}>
                           {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false, locale: ptBR })}
                        </span>
                     )}
                  </div>
                  <p className={`text-sm truncate ${unread > 0 ? 'text-white font-medium' : 'text-slate-500'}`}>
                     {lastMessage ? (
                        lastMessage.sender_id === user?.id ? `Você: ${lastMessage.content}` : lastMessage.content
                     ) : (
                        <span className="italic opacity-60">Toque para iniciar a conversa...</span>
                     )}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-600 opacity-50" />
              </button>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
