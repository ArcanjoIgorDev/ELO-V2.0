
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      // Busca conexões aceitas
      const { data } = await supabase
        .from('connections')
        .select(`
          requester:profiles!requester_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (data) {
        // Formata para pegar apenas o "outro" usuário
        const formatted = data.map((c: any) => {
          const friend = c.requester.id === user.id ? c.receiver : c.requester;
          return friend;
        });
        setFriends(formatted);
      }
    };
    fetchFriends();
  }, [user]);

  return (
    <div className="min-h-full pb-20 bg-midnight-950">
      <div className="px-5 py-6 sticky top-0 bg-midnight-950/95 backdrop-blur z-30 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Mensagens</h1>
      </div>
      
      <div className="p-2">
        {friends.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
             <MessageSquare size={40} className="mx-auto mb-4 opacity-20" />
             <p>Conecte-se com pessoas para iniciar conversas.</p>
          </div>
        ) : (
          friends.map(friend => (
            <button 
              key={friend.id}
              onClick={() => navigate(`/chat/${friend.id}`)}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors text-left group"
            >
              <Avatar url={friend.avatar_url} alt={friend.username} size="md" />
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">{friend.username}</h3>
                <p className="text-slate-500 text-xs">Toque para conversar</p>
              </div>
              <div className="w-2 h-2 bg-ocean rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
