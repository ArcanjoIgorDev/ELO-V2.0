
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Search as SearchIcon, UserPlus, Ban, Clock, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;
    
    setSearching(true);
    setResults([]);
    
    try {
      // 1. Busca perfis
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', user.id) 
        .limit(20);

      if (error) throw error;
      
      if (profiles) {
        // 2. Busca status de conexão para cada perfil
        const profilesWithStatus = await Promise.all(profiles.map(async (p) => {
          const { data: conn } = await supabase
            .from('connections')
            .select('*')
            .or(`and(requester_id.eq.${user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${user.id})`)
            .maybeSingle(); 
          
          return { ...p, connection: conn };
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
      // Verifica limpeza antes de inserir
      const { data: existing } = await supabase
         .from('connections')
         .select('id, status')
         .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`)
         .maybeSingle();

      if (existing) {
         if (existing.status === 'blocked') { alert("Não permitido."); return; }
         // Se já existe e não está bloqueado, deleta para recriar (reset limpo)
         await supabase.from('connections').delete().eq('id', existing.id);
      }

      // Inserção Limpa
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
         // Notificação (Fire & Forget)
         supabase.from('notifications').insert({
           user_id: receiverId,
           actor_id: user.id,
           type: 'request_received',
           reference_id: newConn.id
         }).then(() => {});
         
         // Update UI
         setResults(prev => prev.map(r => r.id === receiverId ? { ...r, connection: newConn } : r));
      }

    } catch (err) {
      alert("Erro ao conectar.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full pb-20 bg-midnight-950">
      <div className="px-5 py-6 sticky top-0 bg-midnight-950/95 backdrop-blur z-30 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">Descobrir</h1>
        <form onSubmit={handleSearch} className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-ocean transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            className="w-full bg-midnight-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean/50 transition-all font-medium placeholder:text-slate-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {searching ? (
          <div className="text-slate-500 text-center py-12 flex flex-col items-center justify-center gap-4 animate-pulse">
             <Loader2 className="animate-spin text-ocean" size={32} />
             <span className="text-sm font-medium">Buscando...</span>
          </div>
        ) : results.length > 0 ? (
          results.map(profile => {
            const status = profile.connection?.status;
            const isMyRequest = profile.connection?.requester_id === user?.id;

            return (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-midnight-900/60 rounded-3xl border border-white/5 shadow-sm hover:bg-midnight-900 transition-colors">
                <div 
                   className="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0"
                   onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <Avatar url={profile.avatar_url} alt={profile.username} />
                  <div className="truncate">
                    <div className="font-bold text-white text-[15px] truncate">{profile.username}</div>
                    <div className="text-xs text-slate-400 font-medium truncate">{profile.full_name}</div>
                  </div>
                </div>
                
                <div className="ml-3 shrink-0">
                  {status === 'accepted' ? (
                    <button 
                      onClick={() => navigate(`/chat/${profile.id}`)} 
                      className="w-10 h-10 flex items-center justify-center bg-white/5 text-ocean rounded-2xl active:scale-95 transition-transform"
                    >
                      <MessageCircle size={20} />
                    </button>
                  ) : status === 'blocked' ? (
                    <span className="text-xs text-red-400 font-medium flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg">
                        <Ban size={12}/>
                    </span>
                  ) : status === 'pending' ? (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <Clock size={12}/> {isMyRequest ? 'Enviado' : 'Recebido'}
                    </span>
                  ) : (
                    <button 
                      onClick={() => sendRequest(profile.id)}
                      disabled={!!processingId}
                      className="w-10 h-10 flex items-center justify-center bg-ocean text-white rounded-2xl hover:bg-ocean-600 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all active:scale-90 disabled:opacity-50"
                    >
                      {processingId === profile.id ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : query && !searching ? (
          <div className="text-center py-12 animate-fade-in">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight-900 text-slate-600 mb-4 shadow-sm border border-white/5">
                <SearchIcon size={32} />
             </div>
             <p className="text-slate-500 font-medium">Nenhum resultado.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
