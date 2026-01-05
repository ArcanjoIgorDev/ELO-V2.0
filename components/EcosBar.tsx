
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';
import { Avatar } from './ui/Avatar';

interface Echo {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_avatar?: string;
  author_username?: string;
}

export const EcosBar = () => {
  const { user, profile } = useAuth();
  const [echos, setEchos] = useState<Echo[]>([]);
  const [viewingEcho, setViewingEcho] = useState<Echo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEchoContent, setNewEchoContent] = useState('');

  // Busca Ecos válidos (últimas 24h)
  const fetchEchos = async () => {
    if (!user) return;
    
    // Consulta simulada. Idealmente usaria uma View ou query mais complexa para agrupar por usuário
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
      type: 'text' // Simplificado para texto por enquanto
    });

    setNewEchoContent('');
    setIsCreating(false);
    fetchEchos();
  };

  return (
    <div className="mb-6 pt-2">
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar snap-x">
        
        {/* Botão Criar */}
        <div className="flex flex-col items-center gap-1 shrink-0 snap-start">
          <button 
            onClick={() => setIsCreating(true)}
            className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative"
          >
            <Plus className="text-ocean" />
            <div className="absolute bottom-0 right-0 bg-ocean rounded-full p-0.5 border-2 border-midnight-950">
               <Plus size={10} className="text-white" />
            </div>
          </button>
          <span className="text-[11px] text-slate-400 font-medium">Novo Eco</span>
        </div>

        {/* Lista de Ecos */}
        {echos.map((echo) => (
          <div key={echo.id} className="flex flex-col items-center gap-1 shrink-0 snap-start">
            <button 
              onClick={() => setViewingEcho(echo)}
              className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-ocean to-emerald-400"
            >
              <div className="w-full h-full rounded-full border-2 border-midnight-950 overflow-hidden bg-midnight-900">
                <img src={echo.author_avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </button>
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[64px]">
              {echo.author_username}
            </span>
          </div>
        ))}
      </div>

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <button onClick={() => setIsCreating(false)} className="self-end p-2 bg-white/10 rounded-full text-white mb-8">
            <X />
          </button>
          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            <h3 className="text-white font-bold text-xl">Novo Eco (24h)</h3>
            <textarea 
              autoFocus
              maxLength={140}
              placeholder="O que está acontecendo agora?"
              value={newEchoContent}
              onChange={e => setNewEchoContent(e.target.value)}
              className="w-full h-40 bg-transparent text-center text-2xl text-white placeholder:text-slate-600 border-none focus:ring-0 resize-none"
            />
            <button 
              onClick={handleCreateEcho}
              disabled={!newEchoContent.trim()}
              className="bg-ocean text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-ocean/30 disabled:opacity-50"
            >
              Compartilhar Eco
            </button>
          </div>
        </div>
      )}

      {/* Visualizador de Eco */}
      {viewingEcho && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in" onClick={() => setViewingEcho(null)}>
          <div className="h-1 bg-white/20 w-full">
            <div className="h-full bg-white animate-[width_5s_linear] w-full origin-left"></div>
          </div>
          <div className="p-4 flex items-center gap-3">
             <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
             <span className="text-white font-bold text-sm">{viewingEcho.author_username}</span>
             <span className="text-white/50 text-xs ml-auto">há pouco</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 text-center">
             <p className="text-2xl text-white font-medium leading-relaxed">
               "{viewingEcho.content}"
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
