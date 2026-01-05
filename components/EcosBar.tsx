
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Trash2 } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(false);

  const fetchEchos = async () => {
    if (!user) return;
    
    // Busca Ecos das últimas 24h
    const { data } = await supabase
      .from('echos')
      .select(`
        id, content, created_at, user_id,
        author:profiles(username, avatar_url)
      `)
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
  };

  useEffect(() => {
    fetchEchos();
  }, [user]);

  const handleCreateEcho = async () => {
    if (!newEchoContent.trim() || !user) return;
    
    await supabase.from('echos').insert({
      user_id: user.id,
      content: newEchoContent,
      type: 'text',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    setNewEchoContent('');
    setIsCreating(false);
    fetchEchos();
  };

  const handleDeleteEcho = async (echoId: string) => {
    if (!window.confirm("Apagar esta Vibe?")) return;
    setDeleting(true);
    try {
      await supabase.from('echos').delete().eq('id', echoId);
      setViewingEcho(null);
      setEchos(prev => prev.filter(e => e.id !== echoId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const isMyEcho = (echo: Echo) => user?.id === echo.user_id;

  return (
    <div className="mb-6 pt-4 pb-2 border-b border-white/5">
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
        
        {/* Botão Criar (Style Organic) */}
        <div className="flex flex-col items-center gap-2 shrink-0 snap-start">
          <button 
            onClick={() => setIsCreating(true)}
            className="w-[72px] h-[72px] rounded-full border border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative group active:scale-95"
          >
            <div className="w-[64px] h-[64px] rounded-full bg-midnight-900 flex items-center justify-center">
               <Plus className="text-ocean group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-ocean rounded-full p-1 border-2 border-midnight-950">
               <Plus size={10} className="text-white" />
            </div>
          </button>
          <span className="text-[11px] text-slate-400 font-medium">Nova Vibe</span>
        </div>

        {/* Lista de Vibes (Style Organic) */}
        {echos.map((echo) => (
          <div key={echo.id} className="flex flex-col items-center gap-2 shrink-0 snap-start">
            <button 
              onClick={() => setViewingEcho(echo)}
              className={`w-[72px] h-[72px] rounded-full p-[2px] ${isMyEcho(echo) ? 'bg-gradient-to-tr from-slate-700 to-slate-500' : 'bg-gradient-to-tr from-ocean to-emerald-400'} active:scale-95 transition-transform`}
            >
              <div className="w-full h-full rounded-full border-[3px] border-midnight-950 overflow-hidden bg-midnight-900 relative">
                <img src={echo.author_avatar} alt="" className="w-full h-full object-cover" />
                {/* Overlay sutil para indicar texto */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                   <span className="text-[8px] text-white/80 font-bold uppercase tracking-widest">Texto</span>
                </div>
              </div>
            </button>
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[70px]">
              {isMyEcho(echo) ? 'Você' : echo.author_username}
            </span>
          </div>
        ))}
      </div>

      {/* Modal de Criação (Redesign) */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <button onClick={() => setIsCreating(false)} className="self-end p-2 bg-white/10 rounded-full text-white mb-10 hover:bg-white/20 transition-colors">
            <X />
          </button>
          <div className="flex-1 flex flex-col justify-center items-center gap-8 max-w-md mx-auto w-full">
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-emerald-400 font-bold text-2xl">
              Compartilhe sua Vibe
            </h3>
            <div className="w-full relative">
              <textarea 
                autoFocus
                maxLength={140}
                placeholder="O que você está sentindo?"
                value={newEchoContent}
                onChange={e => setNewEchoContent(e.target.value)}
                className="w-full h-48 bg-midnight-900/50 border border-white/10 rounded-3xl p-6 text-center text-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-ocean/50 focus:border-transparent resize-none leading-relaxed"
              />
              <span className="absolute bottom-4 right-4 text-xs text-slate-500 font-medium">
                {newEchoContent.length}/140
              </span>
            </div>
            <button 
              onClick={handleCreateEcho}
              disabled={!newEchoContent.trim()}
              className="w-full bg-ocean hover:bg-ocean-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-ocean/20 disabled:opacity-50 transition-all active:scale-95"
            >
              Publicar (24h)
            </button>
          </div>
        </div>
      )}

      {/* Visualizador de Vibe (Redesign) */}
      {viewingEcho && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
          {/* Progress Bar */}
          <div className="h-1 bg-white/20 w-full mt-safe">
            <div 
              className="h-full bg-white animate-[width_5s_linear] w-full origin-left" 
              onAnimationEnd={() => setViewingEcho(null)}
            ></div>
          </div>

          <div className="p-6 flex items-center justify-between mt-4">
             <div className="flex items-center gap-3">
               <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
               <div className="flex flex-col">
                 <span className="text-white font-bold text-sm">{viewingEcho.author_username}</span>
                 <span className="text-white/50 text-xs">
                   {formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR, addSuffix: true })}
                 </span>
               </div>
             </div>
             <button onClick={() => setViewingEcho(null)} className="text-white/80 p-2">
               <X />
             </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
             {/* Decorative Quotes */}
             <div className="absolute top-1/4 left-8 text-8xl text-white/5 font-serif">“</div>
             
             <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed max-w-md drop-shadow-lg">
               {viewingEcho.content}
             </p>

             <div className="absolute bottom-1/4 right-8 text-8xl text-white/5 font-serif rotate-180">“</div>
          </div>

          {isMyEcho(viewingEcho) && (
            <div className="p-safe mb-8 flex justify-center">
              <button 
                onClick={() => handleDeleteEcho(viewingEcho.id)}
                className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-full text-sm font-bold hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={16} />
                Apagar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
