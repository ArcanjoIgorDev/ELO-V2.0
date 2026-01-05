
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Trash2, Zap } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Echo {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_avatar?: string;
  author_username?: string;
}

export const EcosBar = () => {
  const { user } = useAuth();
  const [echos, setEchos] = useState<Echo[]>([]);
  const [viewingEcho, setViewingEcho] = useState<Echo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEchoContent, setNewEchoContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEchos = async () => {
    if (!user) return;
    
    // Busca Vibes válidas
    const { data } = await supabase
      .from('echos')
      .select(`id, content, created_at, user_id, author:profiles!echos_user_id_fkey(username, avatar_url)`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map((e: any) => ({
        ...e,
        author_avatar: e.author?.avatar_url,
        author_username: e.author?.username
      }));
      setEchos(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEchos();
    const channel = supabase.channel('echos_pub').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'echos' }, fetchEchos).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCreateEcho = async () => {
    if (!newEchoContent.trim() || !user) return;
    const { error } = await supabase.from('echos').insert({
      user_id: user.id,
      content: newEchoContent,
      type: 'text',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    if (!error) {
      setNewEchoContent('');
      setIsCreating(false);
      fetchEchos();
    }
  };

  const handleDeleteEcho = async (echoId: string) => {
    if (!window.confirm("Apagar?")) return;
    await supabase.from('echos').delete().eq('id', echoId);
    setViewingEcho(null);
    setEchos(prev => prev.filter(e => e.id !== echoId));
  };

  const myEchos = echos.filter(e => e.user_id === user?.id);
  const otherEchos = echos.filter(e => e.user_id !== user?.id);
  const hasMyVibe = myEchos.length > 0;

  return (
    <div className="pt-5 pb-4 bg-midnight-950">
      <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar snap-x items-start">
        
        {/* Minha Vibe */}
        <div className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
          <button 
            onClick={() => hasMyVibe ? setViewingEcho(myEchos[0]) : setIsCreating(true)}
            className="relative w-[74px] h-[74px] flex items-center justify-center transition-transform active:scale-95"
          >
            {/* Ring */}
            <div className={`absolute inset-0 rounded-full p-[2px] ${hasMyVibe ? 'bg-gradient-to-tr from-ocean via-cyan-400 to-emerald-400 animate-spin-slow' : 'border-2 border-dashed border-white/20'}`}></div>
            <div className={`absolute inset-[3px] rounded-full bg-midnight-950 z-0`}></div>
            
            {/* Image */}
            <div className="w-[66px] h-[66px] rounded-full overflow-hidden relative z-10 bg-midnight-900">
               {hasMyVibe ? (
                 <img src={myEchos[0].author_avatar} className="w-full h-full object-cover" alt="Eu" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                   <Plus className="text-ocean" size={24} />
                 </div>
               )}
            </div>
            {!hasMyVibe && (
               <div className="absolute bottom-0 right-0 bg-ocean text-white rounded-full p-1 border-2 border-midnight-950 z-20 shadow-lg">
                  <Plus size={12} />
               </div>
            )}
          </button>
          <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[74px] tracking-wide">
            {hasMyVibe ? 'Sua Vibe' : 'Criar Vibe'}
          </span>
        </div>

        {/* Vibes Amigos */}
        {otherEchos.map((echo) => (
          <div key={echo.id} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
            <button 
              onClick={() => setViewingEcho(echo)}
              className="w-[74px] h-[74px] relative flex items-center justify-center transition-transform active:scale-95"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]"></div>
              <div className="absolute inset-[3px] rounded-full bg-midnight-950"></div>
              <div className="w-[66px] h-[66px] rounded-full overflow-hidden relative z-10 border-2 border-midnight-950">
                <img src={echo.author_avatar} alt={echo.author_username} className="w-full h-full object-cover" />
              </div>
            </button>
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[74px] group-hover:text-white transition-colors">
              {echo.author_username}
            </span>
          </div>
        ))}

        {echos.length === 0 && !loading && (
           <div className="h-[74px] flex items-center px-4">
              <span className="text-xs text-slate-600 font-medium italic">Seus amigos aparecerão aqui</span>
           </div>
        )}
      </div>

      {/* Modal Criar */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-10">
            <button onClick={() => setIsCreating(false)} className="text-white p-2 bg-white/10 rounded-full"><X size={20}/></button>
            <span className="font-bold text-white tracking-widest text-sm">NOVA VIBE</span>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full pb-20">
            <div className="w-24 h-24 bg-gradient-to-tr from-ocean-900 to-midnight-900 rounded-full flex items-center justify-center mb-8 border border-ocean/30 shadow-[0_0_50px_rgba(14,165,233,0.15)]">
               <Zap size={40} className="text-ocean" />
            </div>
            <textarea 
              autoFocus
              maxLength={60}
              placeholder="O que está rolando?"
              value={newEchoContent}
              onChange={e => setNewEchoContent(e.target.value)}
              className="w-full bg-transparent text-center text-4xl font-bold text-white placeholder:text-white/20 focus:outline-none resize-none leading-tight mb-4"
              rows={3}
            />
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
               <span className={newEchoContent.length > 50 ? 'text-rose-400' : ''}>{newEchoContent.length}/60</span>
               <span>•</span>
               <span>Visível por 24h</span>
            </div>
            <button 
              onClick={handleCreateEcho}
              disabled={!newEchoContent.trim()}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              COMPARTILHAR
            </button>
          </div>
        </div>
      )}

      {/* Visualizador */}
      {viewingEcho && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
          <div className="h-1 bg-white/20 w-full mt-safe px-2 pt-2">
            <div className="h-full rounded-full overflow-hidden bg-white/20">
               <div className="h-full bg-white animate-[width_5s_linear] w-full origin-left" onAnimationEnd={() => setViewingEcho(null)}></div>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between mt-4">
             <div className="flex items-center gap-3">
               <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
               <div className="flex flex-col">
                 <span className="text-white font-bold text-sm">{viewingEcho.author_username}</span>
                 <span className="text-slate-400 text-xs">{formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR })}</span>
               </div>
             </div>
             <button onClick={() => setViewingEcho(null)} className="text-white p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 text-center">
             <p className="text-4xl text-white font-bold leading-snug drop-shadow-2xl">{viewingEcho.content}</p>
          </div>
          {viewingEcho.user_id === user?.id && (
            <div className="p-safe mb-8 flex justify-center pb-10">
              <button onClick={() => handleDeleteEcho(viewingEcho.id)} className="flex items-center gap-2 text-white bg-white/10 hover:bg-red-500/20 px-6 py-3 rounded-full text-sm font-bold transition-colors">
                <Trash2 size={18} /> Apagar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
