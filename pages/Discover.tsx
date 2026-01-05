
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Search as SearchIcon, UserPlus, Check, Clock, Ban, Loader2 } from 'lucide-react';
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
    if (!query.trim()) return;
    
    setSearching(true);
    
    // Busca perfis
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user?.id || '')
      .limit(10);
    
    if (profiles && user) {
      // Busca estado da conexão para cada perfil
      const profilesWithStatus = await Promise.all(profiles.map(async (p) => {
        const { data: conn } = await supabase
          .from('connections')
          .select('*')
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${user.id})`)
          .single();
        
        return { ...p, connection: conn };
      }));
      setResults(profilesWithStatus);
    }
    setSearching(false);
  };

  const sendRequest = async (receiverId: string) => {
    if (!user || processingId) return;
    setProcessingId(receiverId);
    
    try {
      // 1. Verifica se já existe uma conexão (recusada ou antiga)
      const { data: existingConn } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .single();

      let connectionId = existingConn?.id;
      let isNew = false;

      if (existingConn) {
        if (existingConn.status === 'blocked') {
            alert('Não é possível conectar com este usuário.');
            setProcessingId(null);
            return;
        }
        // Se já existe mas foi recusada ou cancelada, atualiza para pending
        const { error: updateError } = await supabase
            .from('connections')
            .update({ status: 'pending', requester_id: user.id, receiver_id: receiverId, updated_at: new Date().toISOString() })
            .eq('id', existingConn.id);
        
        if (updateError) throw updateError;
      } else {
        // Se não existe, cria nova
        isNew = true;
        const { data: newConn, error: insertError } = await supabase
            .from('connections')
            .insert({
                requester_id: user.id,
                receiver_id: receiverId,
                status: 'pending'
            })
            .select()
            .single();
        
        if (insertError) throw insertError;
        connectionId = newConn.id;
      }

      // 2. Envia notificação
      if (connectionId) {
         await supabase.from('notifications').insert({
           user_id: receiverId,
           actor_id: user.id,
           type: 'request_received',
           reference_id: connectionId
         });

         // Atualiza UI local
         setResults(results.map(r => r.id === receiverId ? { ...r, connection: { status: 'pending', requester_id: user.id, updated_at: new Date().toISOString() } } : r));
      }

    } catch (err: any) {
      console.error("Erro ao enviar pedido:", err);
      // alert("Falha ao enviar pedido: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const checkCooldown = (updatedAt: string) => {
    if (!updatedAt) return false;
    const diff = new Date().getTime() - new Date(updatedAt).getTime();
    return diff < 60000; // 1 minuto
  };

  return (
    <div className="min-h-full pb-20 bg-midnight-950">
      <div className="px-5 py-6 sticky top-0 bg-midnight-950/95 backdrop-blur z-30 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">Descobrir</h1>
        <form onSubmit={handleSearch} className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-ocean transition-colors" size={20} />
          <input
            type="text"
            placeholder="Encontrar pessoas..."
            className="w-full bg-midnight-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean/50 transition-all font-medium placeholder:text-slate-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {searching ? (
          <div className="text-slate-500 text-center py-4 flex items-center justify-center gap-2">
             <Loader2 className="animate-spin" size={18} />
             Procurando nas profundezas...
          </div>
        ) : results.length > 0 ? (
          results.map(profile => {
            const status = profile.connection?.status;
            // Se eu sou o requester e está pending -> aguardando
            // Se o outro é o requester e está pending -> tenho que aceitar (mas aqui mostra pendente)
            const isCooldown = status === 'declined' && checkCooldown(profile.connection.updated_at);

            return (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-midnight-900/60 rounded-3xl border border-white/5 shadow-sm">
                <div 
                   className="flex items-center space-x-3.5 cursor-pointer"
                   onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <Avatar url={profile.avatar_url} alt={profile.username} />
                  <div>
                    <div className="font-bold text-white text-[15px]">{profile.username}</div>
                    <div className="text-xs text-slate-400 font-medium">{profile.full_name}</div>
                  </div>
                </div>
                
                {status === 'accepted' ? (
                  <button onClick={() => navigate(`/chat/${profile.id}`)} className="px-4 py-2 bg-white/5 text-ocean font-bold text-xs rounded-xl">
                    Mensagem
                  </button>
                ) : status === 'blocked' ? (
                  <span className="text-xs text-red-400 font-medium flex items-center gap-1"><Ban size={12}/> Bloqueado</span>
                ) : status === 'pending' ? (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock size={12}/> Pendente</span>
                ) : isCooldown ? (
                  <span className="text-xs text-slate-600 font-medium">Aguarde...</span>
                ) : (
                  <button 
                    onClick={() => sendRequest(profile.id)}
                    disabled={!!processingId}
                    className="p-3 bg-ocean text-white rounded-2xl hover:bg-ocean-600 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all active:scale-90 disabled:opacity-50"
                  >
                    {processingId === profile.id ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} strokeWidth={2.5} />}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight-900 text-slate-600 mb-4 shadow-sm border border-white/5">
                <SearchIcon size={32} />
             </div>
             <p className="text-slate-500 font-medium">
               {query ? "Ninguém encontrado." : "Pesquise para encontrar novas conexões."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
