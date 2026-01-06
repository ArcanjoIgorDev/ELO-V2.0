
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Send, Loader2, MoreVertical, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingInitial]);

  // Função robusta para limpar badge
  const markAsRead = useCallback(async () => {
    if (!user || !userId) return;

    // 1. DISPARA O EVENTO VISUAL IMEDIATAMENTE (Otimista)
    // Isso faz o badge sumir na hora, sem esperar o banco.
    window.dispatchEvent(new Event('elo:refresh-badges'));

    try {
      // 2. Atualiza no banco silenciosamente
      await supabase
        .from('messages')
        .update({ is_read: true })
        .match({ sender_id: userId, receiver_id: user.id, is_read: false });

      // 3. Dispara de novo para garantir consistência após DB
      setTimeout(() => {
        window.dispatchEvent(new Event('elo:refresh-badges'));
      }, 500);

    } catch (err) {
      console.error("Erro background read:", err);
    }
  }, [user, userId]);

  useEffect(() => {
    if (!userId || !user) return;

    // Marca lido ao focar na janela
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markAsRead();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loadChatData = async () => {
      try {
        await markAsRead(); // Marca lido ao montar

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setFriend(profile);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (msgs) setMessages(msgs);

      } catch (err) {
        console.error("Erro carregando chat:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadChatData();

    const channel = supabase
      .channel(`chat:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, async (payload) => {
        const msg = payload.new as any;

        if (msg.sender_id === userId) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Recebeu msg com chat aberto? Marca lido e limpa badge na hora
          await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
          window.dispatchEvent(new Event('elo:refresh-badges'));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, user, markAsRead]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: userId,
      content: textToSend,
      created_at: new Date().toISOString(),
      is_read: false,
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content: textToSend
      }).select().single();

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (err) {
      console.error("Erro envio:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(textToSend);
      alert("Não foi possível enviar. Verifique sua conexão.");
    }
  };

  if (loadingInitial) return <div className="h-screen w-full flex flex-col items-center justify-center bg-transparent gap-4">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
      <Loader2 className="animate-spin text-primary relative z-10" size={40} />
    </div>
    <span className="text-sm font-bold tracking-widest uppercase text-slate-500 animate-pulse">Sincronizando...</span>
  </div>;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">

      {/* Header Glass */}
      <div className="flex-none h-20 flex items-center justify-between px-4 z-30 relative">
        <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-xl border-b border-white/5" />
        <div className="relative z-10 flex items-center justify-between w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full active:scale-90 transition-transform bg-white/5 border border-white/5">
              <ArrowLeft size={22} />
            </button>
            {friend && (
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${friend.id}`)}>
                <div className="relative">
                  <Avatar url={friend.avatar_url} alt={friend.username} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background-dark shadow-lg"></div>
                </div>
                <div>
                  <div className="font-bold text-white text-[15px] leading-tight group-hover:text-primary transition-colors">{friend.username}</div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider leading-tight">Online</div>
                </div>
              </div>
            )}
          </div>
          <button className="p-2 text-slate-500 hover:text-white rounded-full glass-button"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-transparent scrollbar-hide" ref={scrollRef}>
        <div className="max-w-lg mx-auto space-y-2">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            const isFirstInSequence = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const isLastInSequence = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInSequence ? 'mt-4' : 'mt-1'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed break-words shadow-lg transition-all backdrop-blur-md
                    ${isMe
                      ? `bg-primary/20 text-white border border-primary/20 ${isLastInSequence ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                      : `bg-white/5 text-slate-100 border border-white/5 ${isLastInSequence ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                    }
                    ${msg.pending ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                  `}
                >
                  {msg.content}
                </div>

                {isLastInSequence && (
                  <div className={`flex items-center gap-1.5 mt-1.5 px-1 min-h-[14px] ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-50">
                      {msg.pending ? 'Enviando' : format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    {isMe && !msg.pending && (
                      <CheckCheck size={14} className={msg.is_read ? 'text-primary' : 'text-slate-600'} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-4" />
      </div>

      {/* Input Area Glass */}
      <div className="flex-none bg-transparent pb-safe z-40 px-4 py-4">
        <div className="max-w-lg mx-auto relative">
          <form onSubmit={handleSend} className="flex gap-3 items-end p-2 glass-panel rounded-[2rem] border-white/10 shadow-2xl">
            <textarea
              rows={1}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Sintonize uma mensagem..."
              className="flex-1 bg-white/5 border border-transparent rounded-[1.5rem] px-5 py-3.5 text-white focus:outline-none focus:bg-white/10 transition-all resize-none max-h-32 min-h-[52px] placeholder:text-slate-500 text-[15px]"
              style={{ height: '52px' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-[52px] h-[52px] bg-primary text-white rounded-full disabled:opacity-30 disabled:grayscale flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-primary/20 active:scale-90 shrink-0"
            >
              {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} className="ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
