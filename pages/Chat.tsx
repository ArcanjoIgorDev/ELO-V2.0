
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Carrega perfil do amigo
  useEffect(() => {
    if (userId) {
      supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => setFriend(data));
    }
  }, [userId]);

  // Carrega mensagens e assina realtime
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
        filter: `receiver_id=in.(${user.id},${userId})` // Simplificação do filtro
      }, (payload) => {
        // Verifica se a mensagem pertence a esta conversa
        const msg = payload.new as any;
        if (
          (msg.sender_id === userId && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === userId)
        ) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, userId]);

  // Auto-scroll
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

  if (!friend) return <div className="p-4 text-white">Carregando...</div>;

  return (
    <div className="flex flex-col h-full bg-midnight-950">
      {/* Header */}
      <div className="flex-none h-16 flex items-center px-4 border-b border-white/5 bg-midnight-950/90 backdrop-blur z-20">
        <button onClick={() => navigate(-1)} className="mr-3 text-slate-400 hover:text-white">
          <ArrowLeft />
        </button>
        <Avatar url={friend.avatar_url} alt={friend.username} size="sm" />
        <span className="ml-3 font-bold text-white">{friend.username}</span>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                  ? 'bg-ocean text-white rounded-tr-none' 
                  : 'bg-white/10 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex-none p-4 pb-safe bg-midnight-950 border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-midnight-900 border border-white/10 rounded-full px-4 py-3 text-white focus:outline-none focus:border-ocean/50"
          />
          <button 
            disabled={!newMessage.trim() || sending}
            className="bg-ocean text-white p-3 rounded-full disabled:opacity-50 hover:bg-ocean-600 transition-colors"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};
