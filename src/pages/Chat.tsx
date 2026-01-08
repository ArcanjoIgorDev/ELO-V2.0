
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Send, Loader2, MoreVertical, CheckCheck, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const markAsRead = useCallback(async () => {
    if (!user || !userId) return;
    window.dispatchEvent(new Event('elo:refresh-badges'));

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .match({ sender_id: userId, receiver_id: user.id, is_read: false });

      setTimeout(() => {
        window.dispatchEvent(new Event('elo:refresh-badges'));
      }, 500);

    } catch (err) {
      console.error("Erro background read:", err);
    }
  }, [user, userId]);

  useEffect(() => {
    if (!userId || !user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markAsRead();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loadChatData = async () => {
      try {
        await markAsRead();

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setFriend(profile);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq."${user.id}",receiver_id.eq."${userId}"),and(sender_id.eq."${userId}",receiver_id.eq."${user.id}")`)
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
        filter: `receiver_id=eq."${user.id}"`
      }, async (payload) => {
        const msg = payload.new as any;

        if (msg.sender_id === userId) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

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

    // Validação e sanitização
    const textToSend = newMessage.trim();
    
    if (textToSend.length === 0) return;
    if (textToSend.length > 1000) {
      alert('Mensagem muito longa. Máximo de 1000 caracteres.');
      return;
    }

    // Sanitização básica
    const sanitizedMessage = textToSend
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
    
    setNewMessage('');
    setSending(true);

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
      // Verificar se há conexão aceita antes de enviar mensagem
      const { data: connection } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq."${user.id}",receiver_id.eq."${userId}"),and(requester_id.eq."${userId}",receiver_id.eq."${user.id}")`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!connection) {
        alert('Você precisa estar conectado com este usuário para enviar mensagens.');
        setNewMessage(sanitizedMessage);
        setSending(false);
        return;
      }

      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content: sanitizedMessage
      }).select().single();

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (err: any) {
      console.error("Erro envio:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(sanitizedMessage);
      alert(err.message || 'Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (loadingInitial) return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-midnight-950 gap-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="size-20 glass-card rounded-[2.5rem] flex items-center justify-center border-primary/20 relative z-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sintonizando</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Conexão segura ELO</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-midnight-950 relative">

      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      {/* Header Glass */}
      <div className="flex-none h-24 flex items-center justify-between px-5 z-30 relative">
        <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-2xl border-b border-white/5" />
        <div className="relative z-10 flex items-center justify-between w-full max-w-lg mx-auto gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="size-11 glass-button rounded-2xl flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            {friend && (
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${friend.id}`)}>
                <div className="relative">
                  <div className="p-[2px] glass-panel rounded-2xl">
                    <Avatar url={friend.avatar_url} alt={friend.username} size="md" className="rounded-[0.9rem]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-3.5 bg-emerald-500 rounded-full border-4 border-midnight-950 shadow-lg"></div>
                </div>
                <div className="flex flex-col">
                  <div className="font-black text-white text-[15px] leading-tight group-hover:text-primary transition-colors tracking-tight">{friend.full_name || friend.username}</div>
                  <div className="text-[9px] text-primary font-black uppercase tracking-[0.1em] leading-tight mt-0.5 group-hover:opacity-70 transition-opacity">@{friend.username}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="size-10 glass-button rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <Phone size={18} />
            </button>
            <button className="size-10 glass-button rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-8 space-y-2 bg-transparent scrollbar-hide" ref={scrollRef}>
        <div className="max-w-lg mx-auto flex flex-col gap-1.5">
          {messages.length === 0 && friend && (
            <div className="py-20 flex flex-col items-center text-center animate-fade-in">
              <div className="size-24 glass-card rounded-[3rem] flex items-center justify-center mb-6 border-white/5 opacity-50">
                <span className="material-symbols-outlined text-[48px] text-primary">chat_bubble</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Inicie a Frequência</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                Envie uma mensagem para sintonizar com @{friend.username}
              </p>
            </div>
          )}

                  {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            const isFirstInSequence = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const isLastInSequence = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInSequence ? 'mt-6' : 'mt-0.5'}`}
              >
                {isFirstInSequence && (
                  <span className={`text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                )}

                <div
                  className={`max-w-[85%] px-5 py-4 text-[14px] font-bold leading-relaxed break-words shadow-2xl transition-all relative
                    ${isMe
                      ? `bg-primary/20 text-white border border-primary/20 ${isFirstInSequence ? 'rounded-t-[2rem]' : ''} ${isLastInSequence ? 'rounded-b-[2rem] rounded-tr-[5px]' : 'rounded-[2rem]'}`
                      : `glass-panel text-slate-200 border-white/5 ${isFirstInSequence ? 'rounded-t-[2rem]' : ''} ${isLastInSequence ? 'rounded-b-[2rem] rounded-tl-[5px]' : 'rounded-[2rem]'}`
                    }
                    ${msg.pending ? 'opacity-50 scale-95 blur-[2px]' : 'opacity-100 scale-100'}
                  `}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line || <br />}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>

                {isLastInSequence && isMe && !msg.pending && (
                  <div className="flex items-center gap-1.5 mt-2 px-2">
                    <CheckCheck size={14} className={msg.is_read ? 'text-primary' : 'text-slate-700'} />
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                      {msg.is_read ? 'Lido' : 'Entregue'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-6" />
      </div>

      {/* Input Area Glass */}
      <div className="flex-none bg-transparent pb-10 z-40 px-5">
        <div className="max-w-lg mx-auto relative group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-all duration-700" />

          <form onSubmit={handleSend} className="relative flex gap-3 items-end p-2.5 glass-panel rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/10 group-focus-within:bg-primary/40 transition-all" />

            <textarea
              rows={1}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Escreva algo brilhante..."
              className="flex-1 bg-white/5 border border-transparent rounded-[2rem] px-6 py-4 text-white focus:outline-none focus:bg-white/10 transition-all resize-none max-h-32 min-h-[56px] placeholder:text-slate-600 text-[14px] font-bold leading-relaxed overflow-y-auto scrollbar-hide"
              style={{ height: '56px' }}
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
              className="size-14 bg-primary text-white rounded-[1.7rem] disabled:opacity-20 disabled:grayscale flex items-center justify-center hover:bg-sky-400 transition-all shadow-xl shadow-primary/20 active:scale-90 shrink-0 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="relative z-10" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

