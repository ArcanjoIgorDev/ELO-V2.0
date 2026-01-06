
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Send, Loader2, MoreVertical } from 'lucide-react';
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

  useEffect(() => {
    if (userId) {
      supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => setFriend(data));
      // Marcar como lido ao abrir
      if (user) {
         supabase.from('messages').update({ is_read: true }).match({ sender_id: userId, receiver_id: user.id }).then();
      }
    }
  }, [userId, user]);

  useEffect(() => {
    if (!user || !userId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=in.(${user.id},${userId})`
      }, (payload) => {
        const msg = payload.new as any;
        if (
          (msg.sender_id === userId && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === userId)
        ) {
          setMessages(prev => [...prev, msg]);
          // Se eu recebi, marco como lido instantaneamente se estiver na tela
          if (msg.receiver_id === user.id) {
             supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then();
          }
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId || sending) return;
    setSending(true);

    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content: newMessage.trim()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!friend) return <div className="h-full flex items-center justify-center bg-midnight-950"><Loader2 className="animate-spin text-ocean"/></div>;

  return (
    <div className="flex flex-col h-full bg-midnight-950 fixed inset-0 z-50">
      {/* Header */}
      <div className="flex-none h-16 flex items-center justify-between px-4 border-b border-white/5 bg-midnight-950/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10">
             <ArrowLeft size={20} />
           </button>
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${friend.id}`)}>
              <Avatar url={friend.avatar_url} alt={friend.username} size="sm" />
              <div>
                 <div className="font-bold text-white text-sm">{friend.username}</div>
                 <div className="text-[10px] text-emerald-500 font-medium">Online</div>
              </div>
           </div>
        </div>
        <button className="p-2 text-slate-500 hover:text-white"><MoreVertical size={20} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-midnight-950" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const showTime = idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[75%] px-5 py-3 text-[15px] leading-relaxed break-words shadow-sm ${
                  isMe 
                  ? 'bg-ocean text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white/10 text-slate-200 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
              {showTime && (
                 <span className="text-[10px] text-slate-600 mt-1 px-1">
                    {format(new Date(msg.created_at), 'HH:mm')}
                 </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex-none p-4 pb-safe bg-midnight-950 border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea 
            rows={1}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Mensagem..."
            className="flex-1 bg-midnight-900 border border-white/10 rounded-3xl px-5 py-3.5 text-white focus:outline-none focus:border-ocean/50 resize-none max-h-32 scrollbar-hide"
            onKeyDown={e => {
               if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
               }
            }}
          />
          <button 
            disabled={!newMessage.trim() || sending}
            className="bg-ocean text-white p-3.5 rounded-full disabled:opacity-50 hover:bg-ocean-600 transition-colors shadow-lg shadow-ocean/20 mb-1"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
