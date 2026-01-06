
import React, { useEffect, useState, useRef } from 'react';
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

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!userId || !user) return;

    const loadChatData = async () => {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setFriend(profile);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        
        if (msgs) setMessages(msgs);

        // Marca como lido e avisa a UI global para zerar contador
        await supabase
           .from('messages')
           .update({ is_read: true })
           .match({ sender_id: userId, receiver_id: user.id, is_read: false });
         
        window.dispatchEvent(new Event('elo:refresh-badges'));
      } catch (err) {
        console.error("Erro carregando chat:", err);
      } finally {
        setLoadingInitial(false);
        setTimeout(scrollToBottom, 100);
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
          setMessages(prev => [...prev, msg]);
          
          // Marca lido imediatamente se a conversa está aberta
          await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
          window.dispatchEvent(new Event('elo:refresh-badges'));
          setTimeout(scrollToBottom, 100);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [userId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId) return; 
    
    const textToSend = newMessage.trim();
    setNewMessage(''); 
    
    // UI Otimista: A mensagem aparece NA HORA
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
    setTimeout(scrollToBottom, 50);

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content: textToSend
      }).select().single();

      if (error) throw error;

      // Sucesso: Troca a mensagem fake pela real
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (err) {
      console.error("Erro envio:", err);
      // Falha: Remove a mensagem e devolve o texto pro input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(textToSend);
      alert("Não foi possível enviar. Verifique sua conexão.");
    }
  };

  if (loadingInitial) return <div className="h-screen w-full flex items-center justify-center bg-midnight-950"><Loader2 className="animate-spin text-ocean" size={32}/></div>;

  return (
    // Container Flex Principal - Garante que o input fique na base da viewport visível
    <div className="flex flex-col h-[100dvh] bg-midnight-950 overflow-hidden">
      
      {/* Header Fixo no Topo */}
      <div className="flex-none h-16 flex items-center justify-between px-4 border-b border-white/5 bg-midnight-950/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
           <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full active:scale-90 transition-transform">
             <ArrowLeft size={22} />
           </button>
           {friend && (
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${friend.id}`)}>
                <div className="relative">
                  <Avatar url={friend.avatar_url} alt={friend.username} size="sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-midnight-950"></div>
                </div>
                <div>
                   <div className="font-bold text-white text-sm leading-tight">{friend.username}</div>
                   <div className="text-[10px] text-slate-400 font-medium leading-tight">Online</div>
                </div>
             </div>
           )}
        </div>
        <button className="p-2 text-slate-500 hover:text-white rounded-full"><MoreVertical size={20} /></button>
      </div>

      {/* Área de Scroll das Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-midnight-950 scroll-smooth" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const prevMsg = messages[idx - 1];
          const nextMsg = messages[idx + 1];
          const isFirstInSequence = !prevMsg || prevMsg.sender_id !== msg.sender_id;
          const isLastInSequence = !nextMsg || nextMsg.sender_id !== msg.sender_id;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInSequence ? 'mt-2' : 'mt-0.5'}`}>
              <div 
                className={`max-w-[85%] px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm transition-all
                  ${isMe 
                    ? `bg-ocean text-white ${isLastInSequence ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-r-md'}` 
                    : `bg-white/10 text-slate-100 ${isLastInSequence ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-l-md'}`
                  }
                  ${msg.pending ? 'opacity-70' : 'opacity-100'}
                `}
              >
                {msg.content}
              </div>
              
              {isLastInSequence && (
                 <div className="flex items-center gap-1 mt-1 px-1 min-h-[14px]">
                    <span className="text-[10px] text-slate-500 font-medium">
                        {msg.pending ? 'Enviando...' : format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    {isMe && !msg.pending && (
                      <CheckCheck size={12} className={msg.is_read ? 'text-ocean' : 'text-slate-600'} />
                    )}
                 </div>
              )}
            </div>
          );
        })}
        <div className="h-2" />
      </div>

      {/* Input Area - Flex None para ficar no rodapé */}
      <div className="flex-none bg-midnight-950 border-t border-white/5 pb-safe z-40">
        <form onSubmit={handleSend} className="flex gap-2 items-end p-3 bg-midnight-950">
          <textarea 
            rows={1}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Mensagem..."
            className="flex-1 bg-midnight-900 border border-white/10 rounded-[1.5rem] px-5 py-3.5 text-white focus:outline-none focus:border-ocean/50 focus:ring-1 focus:ring-ocean/50 resize-none max-h-32 min-h-[50px] transition-all placeholder:text-slate-500 text-[15px]"
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
            disabled={!newMessage.trim()}
            className="w-[52px] h-[52px] bg-ocean text-white rounded-full disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center hover:bg-ocean-600 transition-all shadow-lg shadow-ocean/10 active:scale-95 shrink-0"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={22} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
