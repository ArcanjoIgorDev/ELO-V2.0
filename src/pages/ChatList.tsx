
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronRight, Search, Zap } from 'lucide-react';
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
        .or(`and(sender_id.eq."${user.id}",receiver_id.eq."${friend.id}"),and(sender_id.eq."${friend.id}",receiver_id.eq."${user.id}")`)
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
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq."${user?.id}"` },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return (
    <PullToRefresh onRefresh={fetchConversations}>
      <div className="min-h-full pb-32 bg-midnight-950">

        {/* Sticky Header */}
        <div className="px-5 pt-10 pb-6 sticky top-0 z-30">
          <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-2xl border-b border-white/5" />
          <div className="relative z-10 max-w-lg mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-white tracking-tighter shrink-0">Conversas</h1>
                <div className="flex items-center gap-1.5">
                  <Zap size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Criptografia ELO ativa</span>
                </div>
              </div>
              <div className="size-12 glass-button rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                <span className="material-symbols-outlined text-[24px]">chat_add_on</span>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar conversas..."
                  className="w-full input-glass rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-8 space-y-4 max-w-lg mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="size-16 glass-card rounded-[2rem] flex items-center justify-center border-primary/20 relative z-10">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary animate-pulse">Carregando</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-24 text-center glass-card rounded-[3rem] border-dashed border-white/10 px-8 max-w-sm mx-auto animate-fade-in shadow-2xl">
              <div className="size-24 bg-midnight-900 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                <span className="material-symbols-outlined text-slate-700 text-[48px] opacity-40">forum</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">Nenhuma conversa</h3>
              <p className="text-slate-500 text-sm font-bold leading-relaxed mb-10 max-w-[200px] mx-auto uppercase tracking-wide">
                Conecte-se com pessoas para começar conversas.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="w-full py-5 bg-white text-midnight-950 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
              >
                Descobrir Pessoas
              </button>
            </div>
          ) : (
            conversations.map(({ friend, lastMessage, unread }, idx) => (
              <button
                key={friend.id}
                onClick={() => navigate(`/chat/${friend.id}`)}
                className={`w-full flex items-center gap-5 p-5 glass-card rounded-[2.5rem] transition-all group relative overflow-hidden animate-fade-in border-white/5 active:scale-[0.98] ${unread > 0 ? 'bg-primary/5 border-primary/20' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {unread > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary blur-[2px]" />
                )}

                <div className="relative shrink-0">
                  <div className={`p-[1.5px] glass-panel rounded-2xl transition-all group-hover:border-primary/40 ${unread > 0 ? 'border-primary/40 p-[2px]' : ''}`}>
                    <Avatar url={friend.avatar_url} alt={friend.username} size="lg" className="rounded-xl" />
                  </div>
                  {unread > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[11px] font-black h-7 min-w-[28px] px-2 flex items-center justify-center rounded-2xl border-4 border-midnight-950 shadow-2xl shadow-primary/40">
                      {unread}
                    </span>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-4 border-midnight-950 rounded-full shadow-xl" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-[16px] truncate transition-colors group-hover:text-primary tracking-tight font-black ${unread > 0 ? 'text-white' : 'text-slate-200 opacity-90'}`}>
                      {friend.full_name || friend.username}
                    </h3>
                    {lastMessage && (
                      <span className={`text-[9px] font-black uppercase tracking-tight shrink-0 transition-opacity ${unread > 0 ? 'text-primary' : 'text-slate-600 opacity-80'}`}>
                        {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false, locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className={`text-[13px] truncate leading-tight font-bold tracking-tight ${unread > 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                    {lastMessage ? (
                      lastMessage.sender_id === user?.id ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 shrink-0">Você</span>
                          <span className="truncate opacity-80">{lastMessage.content}</span>
                        </span>
                      ) : (
                        <span className="truncate">{lastMessage.content}</span>
                      )
                    ) : (
                      <span className="italic opacity-30 text-[11px] uppercase tracking-widest">Inicie a transmissão</span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 size-10 rounded-xl flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-1">
                  <ChevronRight size={20} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
