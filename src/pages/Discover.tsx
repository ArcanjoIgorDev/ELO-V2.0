
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Search as SearchIcon, UserPlus, Ban, Clock, Loader2, MessageCircle, Navigation, Users } from 'lucide-react';
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

    // Validação e sanitização da query
    const sanitizedQuery = query.trim()
      .replace(/[%_]/g, '') // Remove caracteres especiais do SQL LIKE
      .substring(0, 50); // Limita tamanho da busca
    
    if (sanitizedQuery.length < 2) {
      alert('Digite pelo menos 2 caracteres para buscar.');
      return;
    }

    setSearching(true);
    setResults([]);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${sanitizedQuery}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) {
        console.error('Erro na busca:', error);
        alert('Erro ao buscar usuários. Tente novamente.');
        setSearching(false);
        return;
      }

      if (profiles) {
        const profilesWithStatus = await Promise.all((profiles as any[]).map(async (p: any) => {
          const { data: conn } = await supabase
            .from('connections')
            .select('*')
            .or(`and(requester_id.eq."${user.id}",receiver_id.eq."${p.id}"),and(requester_id.eq."${p.id}",receiver_id.eq."${user.id}")`)
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
      const { data: existing } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(requester_id.eq."${user.id}",receiver_id.eq."${receiverId}"),and(requester_id.eq."${receiverId}",receiver_id.eq."${user.id}")`)
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
        setResults((prev: Profile[]) => prev.map((r: Profile) => r.id === receiverId ? { ...r, connection: newConn as Connection } : r));
      }

    } catch (err) {
      alert("Erro ao conectar.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full pb-32">
      <div className="px-5 pt-8 pb-6 sticky top-0 z-30">
        <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-2xl border-b border-white/5" />
        <div className="relative z-10 max-w-lg mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-white tracking-tighter">Descobrir</h1>
            <div className="p-2 glass-button rounded-xl text-primary">
              <Users size={20} />
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar novas conexões..."
                className="w-full input-glass rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="px-4 space-y-4 pt-6 max-w-lg mx-auto">
        {searching ? (
          <div className="py-20 flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="size-20 glass-card rounded-[2.5rem] flex items-center justify-center border-primary/20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Sincronizando</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Aguarde um momento</span>
            </div>
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]">person_search</span>
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Resultados da Busca</h2>
            </div>
            {results.map(profile => {
              const status = profile.connection?.status;
              const isMyRequest = profile.connection?.requester_id === user?.id;

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 glass-card rounded-[2rem] hover:bg-white/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div
                    className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <div className="relative shrink-0">
                      <Avatar url={profile.avatar_url} alt={profile.username} size="md" className="border-white/5" />
                      <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-green-500 border-2 border-background-dark rounded-full shadow-lg" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-black text-white text-[15px] truncate group-hover:text-primary transition-colors">
                          {profile.username}
                        </h3>
                        <span className="material-symbols-outlined text-primary text-[14px] font-black shrink-0">verified</span>
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                        {profile.full_name || `@${profile.username}`}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 shrink-0">
                    {status === 'accepted' ? (
                      <button
                        onClick={() => navigate(`/chat/${profile.id}`)}
                        className="size-12 rounded-2xl glass-button flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/10"
                      >
                        <MessageCircle size={20} />
                      </button>
                    ) : status === 'blocked' ? (
                      <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                        <Ban size={20} />
                      </div>
                    ) : status === 'pending' ? (
                      <div className="h-12 px-4 rounded-2xl glass-panel border-white/5 flex flex-col items-center justify-center gap-0.5">
                        <Clock size={16} className="text-slate-500" />
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">
                          {isMyRequest ? 'Enviado' : 'Recebido'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => sendRequest(profile.id)}
                        disabled={!!processingId}
                        className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-sky-400 shadow-xl shadow-primary/20 transition-all active:scale-95 group-hover:scale-110"
                      >
                        {processingId === profile.id ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} strokeWidth={3} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : query && !searching ? (
          <div className="py-20 text-center flex flex-col items-center gap-6 animate-fade-in px-8">
            <div className="size-24 rounded-[3rem] bg-midnight-900 border border-white/5 flex items-center justify-center rotate-12 shadow-2xl">
              <span className="material-symbols-outlined text-slate-700 text-[48px]">search_off</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-white">Nenhum sinal</h3>
              <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[240px]">
                O usuário <span className="text-primary">"{query}"</span> não foi encontrado.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center animate-fade-in px-10 flex flex-col items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full animate-pulse-slow" />
              <div className="size-28 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-[3rem] flex items-center justify-center border border-primary/20 rotate-6 shadow-2xl relative">
                <Navigation size={40} className="text-primary animate-float" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">Expandir Rede</h2>
              <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[280px]">
                Busque por pessoas interessantes para se conectar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
