
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Search as SearchIcon, UserPlus, Ban, Clock, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  connection?: Connection | null;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
}

export const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setSearching(true);
    setResults([]);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;

      if (profiles) {
        const profilesWithStatus = await Promise.all((profiles as any[]).map(async (p: any) => {
          const { data: conn } = await supabase
            .from('connections')
            .select('*')
            .or(`and(requester_id.eq.${user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${user.id})`)
            .maybeSingle();

          return { ...p, connection: conn as Connection | null };
        }));
        setResults(profilesWithStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (receiverId: string) => {
    if (!user || processingId) return;
    setProcessingId(receiverId);

    try {
      // Cleanup para garantir insert limpo
      const { data: existing } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'blocked') {
          alert("Não permitido.");
          setProcessingId(null);
          return;
        }
        await supabase.from('connections').delete().eq('id', existing.id);
      }

      const { data: newConn, error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      if (newConn) {
        // Fire & forget notification
        supabase.from('notifications').insert({
          user_id: receiverId,
          actor_id: user.id,
          type: 'request_received',
          reference_id: newConn.id
        }).then(() => { });

        setResults((prev: Profile[]) => prev.map((r: Profile) => r.id === receiverId ? { ...r, connection: newConn as Connection } : r));
      }

    } catch (err) {
      alert("Erro ao conectar. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full pb-32">
      {/* Sticky Top Header */}
      <div className="px-5 py-6 sticky top-0 z-30 transition-all">
        <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-xl border-b border-white/5" />
        <div className="relative z-10 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-white mb-5 tracking-tight">Descobrir</h1>
          <form onSubmit={handleSearch} className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar mentes brilhantes..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all font-medium placeholder:text-slate-500 backdrop-blur-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-6 max-w-lg mx-auto">
        {searching ? (
          <div className="text-slate-500 text-center py-20 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="animate-spin text-primary relative z-10" size={40} />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-slate-400 animate-pulse">Sondando o Oceano...</span>
          </div>
        ) : results.length > 0 ? (
          results.map(profile => {
            const status = profile.connection?.status;
            const isMyRequest = profile.connection?.requester_id === user?.id;

            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 glass-panel rounded-3xl shadow-lg hover:bg-white/5 transition-all group active:scale-[0.99]"
              >
                <div
                  className="flex items-center space-x-4 cursor-pointer flex-1 min-w-0"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <div className="relative">
                    <Avatar url={profile.avatar_url} alt={profile.username} size="md" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background-dark rounded-full" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-[16px] truncate group-hover:text-primary transition-colors">
                      {profile.username}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {profile.full_name || `@${profile.username}`}
                    </div>
                  </div>
                </div>

                <div className="ml-3 shrink-0">
                  {status === 'accepted' ? (
                    <button
                      onClick={() => navigate(`/chat/${profile.id}`)}
                      className="w-12 h-12 flex items-center justify-center glass-button text-primary rounded-2xl active:scale-90 transition-all hover:bg-primary/10"
                    >
                      <MessageCircle size={22} className="fill-current" />
                    </button>
                  ) : status === 'blocked' ? (
                    <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-400">
                      <Ban size={18} />
                    </div>
                  ) : status === 'pending' ? (
                    <div className="flex flex-col items-center gap-1 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                      <Clock size={16} className="text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {isMyRequest ? 'Enviado' : 'Pendente'}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => sendRequest(profile.id)}
                      disabled={!!processingId}
                      className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-2xl hover:bg-sky-400 shadow-[0_0_20px_rgba(13,162,231,0.3)] transition-all active:scale-90 disabled:opacity-50"
                    >
                      {processingId === profile.id ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : query && !searching ? (
          <div className="text-center py-20 glass-panel rounded-[2rem] mx-2 border-dashed">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 text-slate-600 mb-6 border border-white/5">
              <SearchIcon size={36} />
            </div>
            <h3 className="text-white font-bold mb-2">Sem sinais detectados</h3>
            <p className="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
              Não encontramos ninguém com o nome <span className="text-primary">"{query}"</span>.
            </p>
          </div>
        ) : (
          <div className="py-20 text-center animate-fade-in px-8">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-6 shadow-xl shadow-primary/5">
              <SearchIcon size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Explore o ELO</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Busque por amigos, criadores ou pessoas inspiradoras para conectar ao seu oceano.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
