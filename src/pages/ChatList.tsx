
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

    // FIX: Usa nome da coluna para join (!requester_id)
    const { data: connections } = await supabase
      .from('connections')
      .select(`
        requester:profiles!requester_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted') as { data: any[] | null, error: any };

    if (!connections) {
      setLoading(false);
      return;
    }

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

    const channel = supabase
      .channel('inbox_updates_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user?.id}` },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return (
    <PullToRefresh onRefresh={fetchConversations}>
      <div className="min-h-full pb-32">
        {/* Sticky Header */}
        <div className="px-5 py-5 sticky top-0 z-30 transition-all">
          <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-xl border-b border-white/5" />
          <div className="relative z-10 max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">Conversas</h1>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <MessageCircle className="text-primary" size={20} />
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-500 animate-pulse">Sintonizando...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-[2rem] border-dashed px-8">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                <MessageCircle size={36} className="text-slate-600" />
              </div>
              <h3 className="text-white font-bold mb-2">Inbox em silêncio</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                O oceano está calmo. Conecte-se com novas mentes para iniciar uma conversa.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-sky-400 active:scale-95 transition-all"
              >
                Explorar Conexões
              </button>
            </div>
          ) : (
            conversations.map(({ friend, lastMessage, unread }) => (
              <button
                key={friend.id}
                onClick={() => navigate(`/chat/${friend.id}`)}
                className={`w-full flex items-center gap-4 p-4 glass-panel rounded-[1.5rem] transition-all group hover:bg-white/5 active:scale-[0.99] border-white/5 ${unread > 0 ? 'ring-1 ring-primary/30 border-primary/20 bg-primary/5' : ''}`}
              >
                <div className="relative shrink-0">
                  <Avatar url={friend.avatar_url} alt={friend.username} size="lg" />
                  {unread > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-6 min-w-[24px] px-1.5 flex items-center justify-center rounded-full border-2 border-background-dark shadow-[0_0_10px_rgba(13,162,231,0.5)] animate-pulse">
                      {unread}
                    </span>
                  ) : (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-background-dark rounded-full shadow-lg" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-[16px] truncate transition-colors group-hover:text-primary ${unread > 0 ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                      {friend.username}
                    </h3>
                    {lastMessage && (
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${unread > 0 ? 'text-primary' : 'text-slate-500 opacity-60'}`}>
                        {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false, locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate leading-snug ${unread > 0 ? 'text-white font-medium opacity-100' : 'text-slate-500 opacity-80'}`}>
                    {lastMessage ? (
                      lastMessage.sender_id === user?.id ? (
                        <span className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-primary uppercase opacity-60">Você:</span> {lastMessage.content}
                        </span>
                      ) : lastMessage.content
                    ) : (
                      <span className="italic opacity-60">Inicie esta frequência...</span>
                    )}
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors opacity-40" />
              </button>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>

  );
};
