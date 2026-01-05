
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
    
    // Busca Ecos globais válidos (últimas 24h)
    // IMPORTANTE: RLS no Supabase deve permitir SELECT 'authenticated'
    const { data, error } = await supabase
      .from('echos')
      .select(`
        id, content, created_at, user_id,
        author:profiles!echos_user_id_fkey(username, avatar_url)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar vibes:", error);
    }

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
    
    // Realtime para novas vibes
    const channel = supabase
      .channel('public:echos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'echos' }, () => {
        fetchEchos();
      })
      .subscribe();

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
    if (!window.confirm("Apagar esta Vibe?")) return;
    try {
      await supabase.from('echos').delete().eq('id', echoId);
      setViewingEcho(null);
      setEchos(prev => prev.filter(e => e.id !== echoId));
    } catch (err) {
      console.error(err);
    }
  };

  const isMyEcho = (echo: Echo) => user?.id === echo.user_id;

  // Separa minha vibe das outras
  const myEchos = echos.filter(e => e.user_id === user?.id);
  const otherEchos = echos.filter(e => e.user_id !== user?.id);
  
  // Se eu tenho vibe, mostra a minha primeiro, senão botão de criar
  const hasMyVibe = myEchos.length > 0;

  return (
    <div className="pt-4 pb-2 border-b border-white/5 bg-midnight-950/50 backdrop-blur-sm">
      <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar snap-x items-center">
        
        {/* Minha Vibe / Criar Nova */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group">
          <button 
            onClick={() => hasMyVibe ? setViewingEcho(myEchos[0]) : setIsCreating(true)}
            className="relative w-[70px] h-[70px] flex items-center justify-center transition-transform active:scale-95"
          >
            {/* Anel Gradiente */}
            <div className={`absolute inset-0 rounded-full p-[2px] ${hasMyVibe ? 'bg-gradient-to-tr from-ocean to-emerald-400' : 'border-2 border-dashed border-white/20'}`}></div>
            
            {/* Foto */}
            <div className="w-full h-full rounded-full border-4 border-midnight-950 overflow-hidden bg-midnight-900 relative z-10">
               {hasMyVibe ? (
                 <img src={myEchos[0].author_avatar} className="w-full h-full object-cover opacity-90" alt="Eu" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                   <Plus className="text-ocean" size={24} />
                 </div>
               )}
            </div>

            {/* Badge de Adicionar (só se não tiver vibe) */}
            {!hasMyVibe && (
               <div className="absolute bottom-0 right-0 bg-ocean rounded-full p-1 border-2 border-midnight-950 z-20">
                  <Plus size={10} className="text-white" />
               </div>
            )}
          </button>
          <span className="text-[11px] font-medium text-slate-300 truncate max-w-[70px]">
            {hasMyVibe ? 'Sua Vibe' : 'Nova Vibe'}
          </span>
        </div>

        {/* Vibes dos Amigos */}
        {otherEchos.map((echo) => (
          <div key={echo.id} className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer">
            <button 
              onClick={() => setViewingEcho(echo)}
              className="w-[70px] h-[70px] relative rounded-full p-[2px] bg-gradient-to-tr from-ocean-600 via-ocean to-indigo-500 active:scale-95 transition-transform"
            >
              <div className="w-full h-full rounded-full border-4 border-midnight-950 overflow-hidden bg-midnight-900 relative">
                <img src={echo.author_avatar} alt={echo.author_username} className="w-full h-full object-cover" />
              </div>
            </button>
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[70px]">
              {echo.author_username}
            </span>
          </div>
        ))}
        
        {echos.length === 0 && !loading && (
           <div className="flex flex-col justify-center h-[70px] pl-2 opacity-40">
              <span className="text-xs text-slate-500 italic">Sem vibes recentes...</span>
           </div>
        )}
      </div>

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setIsCreating(false)} className="text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
            <span className="font-bold text-white tracking-wide">NOVA VIBE</span>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-6 max-w-md mx-auto w-full">
            <div className="w-20 h-20 bg-ocean/10 rounded-full flex items-center justify-center mb-4 border border-ocean/20 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
               <Zap size={32} className="text-ocean" />
            </div>
            
            <div className="w-full relative">
              <textarea 
                autoFocus
                maxLength={60}
                placeholder="Qual a boa de hoje?"
                value={newEchoContent}
                onChange={e => setNewEchoContent(e.target.value)}
                className="w-full h-32 bg-transparent border-b-2 border-white/20 text-center text-3xl font-bold text-white placeholder:text-white/20 focus:ring-0 focus:border-ocean resize-none leading-tight"
                style={{ caretColor: '#0ea5e9' }}
              />
            </div>
            
            <span className={`text-sm font-medium transition-colors ${newEchoContent.length > 50 ? 'text-red-400' : 'text-slate-500'}`}>
               {60 - newEchoContent.length} caracteres
            </span>

            <button 
              onClick={handleCreateEcho}
              disabled={!newEchoContent.trim()}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              COMPARTILHAR
            </button>
          </div>
        </div>
      )}

      {/* Visualizador de Vibe */}
      {viewingEcho && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
          {/* Barra de Progresso */}
          <div className="h-1 bg-white/20 w-full mt-safe px-1 pt-1">
            <div className="h-full rounded-full overflow-hidden bg-white/20">
               <div 
                 className="h-full bg-white animate-[width_5s_linear] w-full origin-left" 
                 onAnimationEnd={() => setViewingEcho(null)}
               ></div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between mt-2">
             <div className="flex items-center gap-3">
               <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
               <div className="flex flex-col text-shadow">
                 <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{viewingEcho.author_username}</span>
                 <span className="text-white/70 text-xs shadow-black drop-shadow-md">
                   {formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR, addSuffix: true })}
                 </span>
               </div>
             </div>
             <button onClick={() => setViewingEcho(null)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
               <X size={24} />
             </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative bg-gradient-to-b from-transparent via-ocean/5 to-transparent">
             <p className="text-3xl md:text-4xl text-white font-bold leading-tight drop-shadow-2xl">
               "{viewingEcho.content}"
             </p>
          </div>

          {isMyEcho(viewingEcho) && (
            <div className="p-safe mb-8 flex justify-center pb-10">
              <button 
                onClick={() => handleDeleteEcho(viewingEcho.id)}
                className="flex items-center gap-2 text-white bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-6 py-3 rounded-full text-sm font-bold backdrop-blur-md transition-colors border border-white/5"
              >
                <Trash2 size={18} />
                Apagar Vibe
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
