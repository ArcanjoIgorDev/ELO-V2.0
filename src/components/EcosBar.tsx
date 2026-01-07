
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Trash2, Zap, Heart, MessageCircle, Send, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EchoWithAuthor } from '../types';

export const EcosBar = () => {
  const { user } = useAuth();
  const [echos, setEchos] = useState<EchoWithAuthor[]>([]);
  const [viewingEcho, setViewingEcho] = useState<EchoWithAuthor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEchoContent, setNewEchoContent] = useState('');

  const [vibeLikes, setVibeLikes] = useState(0);
  const [hasLikedVibe, setHasLikedVibe] = useState(false);

  const fetchEchos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('echos')
      .select(`
        *,
        author:profiles!echos_user_id_fkey(username, avatar_url),
        likes:echo_likes(user_id)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: EchoWithAuthor[] = data.map((e: any) => ({
        ...e,
        author_avatar: e.author?.avatar_url,
        author_username: e.author?.username,
        likes_count: e.likes ? e.likes.length : 0,
        comments_count: 0,
        user_has_liked: e.likes ? e.likes.some((l: any) => l.user_id === user.id) : false
      }));
      setEchos(formatted);
    }
  };

  useEffect(() => {
    fetchEchos();
    const sub = supabase.channel('echos_sub').on('postgres_changes', { event: '*', schema: 'public', table: 'echos' }, fetchEchos).subscribe();
    return () => { sub.unsubscribe(); };
  }, [user]);

  useEffect(() => {
    if (viewingEcho) {
      setVibeLikes(viewingEcho.likes_count);
      setHasLikedVibe(viewingEcho.user_has_liked);
    }
  }, [viewingEcho]);

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

  const myEchos = echos.filter(e => e.user_id === user?.id);
  const otherEchos = echos.filter(e => e.user_id !== user?.id);
  const hasMyVibe = myEchos.length > 0;

  return (
    <div className="pt-8 pb-4 mb-2 relative z-20">
      <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar items-center pb-6">

        {/* Create / My Vibe */}
        <div
          className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group"
          onClick={() => hasMyVibe ? setViewingEcho(myEchos[0]) : setIsCreating(true)}
        >
          <div className="relative">
            {/* Animated Ring for My Vibe */}
            {hasMyVibe && (
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary via-blue-400 to-sky-600 rounded-[2.5rem] animate-spin-slow opacity-40 blur-sm" />
            )}

            <div className={`size-[84px] rounded-[2.2rem] flex items-center justify-center relative transition-all duration-700 group-hover:scale-105 group-active:scale-95 ${hasMyVibe ? 'p-[3px] bg-gradient-to-tr from-primary to-blue-400 shadow-2xl shadow-primary/20' : 'bg-midnight-900/50 border-2 border-white/5 border-dashed hover:border-primary/50 hover:bg-white/5'}`}>
              <div className={`w-full h-full rounded-[2rem] bg-midnight-950 overflow-hidden relative flex items-center justify-center ${!hasMyVibe ? 'shadow-inner' : ''}`}>
                {hasMyVibe ? (
                  <img src={myEchos[0].author_avatar} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110" alt="" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="material-symbols-outlined text-slate-700 text-[32px] font-black group-hover:text-primary transition-colors">add_circle</span>
                  </div>
                )}
              </div>
              {!hasMyVibe && (
                <div className="absolute -bottom-1 -right-1 size-8 bg-primary rounded-2xl flex items-center justify-center text-white border-4 border-midnight-950 shadow-xl shadow-primary/20 animate-bounce-subtle">
                  <Plus size={16} strokeWidth={4} />
                </div>
              )}
            </div>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${hasMyVibe ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}`}>
            {hasMyVibe ? 'Sua Vibe' : 'Lançar'}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-16 bg-white/5 shrink-0 mx-1" />

        {/* Others */}
        {otherEchos.map((echo, idx) => (
          <div
            key={echo.id}
            className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setViewingEcho(echo)}
          >
            <div className="relative">
              {/* Active Ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 rounded-[2.5rem] opacity-30 group-hover:opacity-100 group-hover:blur-md transition-all duration-700" />

              <div className="size-[84px] rounded-[2.2rem] p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 shadow-2xl relative z-10 transition-all duration-700 group-hover:scale-105 group-active:scale-95 group-hover:-translate-y-1">
                <div className="w-full h-full rounded-[2rem] bg-midnight-950 overflow-hidden relative border border-white/5">
                  <img src={echo.author_avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-500 truncate max-w-[84px] text-center uppercase tracking-[0.15em] group-hover:text-white transition-colors">{echo.author_username}</span>
          </div>
        ))}

        {/* Placeholder for exploration */}
        {otherEchos.length === 0 && (
          <div className="flex items-center gap-3 px-6 py-4 glass-card rounded-[2rem] border-dashed border-white/5 opacity-40 italic text-xs text-slate-500 shrink-0">
            <Zap size={14} /> Espalhe a primeira Vibe...
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[300] bg-midnight-950/95 backdrop-blur-3xl flex flex-col p-10 animate-fade-in justify-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/10 blur-[150px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-primary/10 to-transparent" />
          </div>

          <button
            onClick={() => setIsCreating(false)}
            className="absolute top-10 right-10 size-14 glass-button rounded-[1.8rem] flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 z-20"
          >
            <X size={28} strokeWidth={3} />
          </button>

          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-12 relative z-10">
            <div className="relative group">
              <div className="absolute inset-x-0 -bottom-2 h-4 bg-primary/20 blur-xl rounded-full scale-x-75 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="size-28 bg-gradient-to-br from-primary to-blue-600 rounded-[3rem] flex items-center justify-center shadow-[0_25px_60px_rgba(13,162,231,0.4)] rotate-6 animate-float relative z-10">
                <span className="material-symbols-outlined text-white text-[56px] fill-1">bolt</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 w-full">
              <h3 className="text-white font-black text-5xl tracking-tighter text-center leading-none">Vibe do Momento</h3>
              <p className="text-primary font-black text-xs uppercase tracking-[0.4em] text-center opacity-70">Desaparece após 24 ciclos</p>
            </div>

            <div className="w-full relative">
              <textarea
                autoFocus
                maxLength={60}
                value={newEchoContent}
                onChange={e => setNewEchoContent(e.target.value)}
                placeholder="Declare sua realidade..."
                className="w-full bg-transparent text-center text-5xl md:text-7xl font-black text-white placeholder:text-white/5 focus:outline-none resize-none leading-[1.1] tracking-tighter selection:bg-primary/50 py-4"
                rows={2}
              />
              <div className="flex justify-center mt-6">
                <div className="px-6 py-2.5 rounded-full glass-panel border-white/10 text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                  {newEchoContent.length} / 60
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateEcho}
              disabled={!newEchoContent.trim()}
              className="group relative w-full h-20 overflow-hidden rounded-[2.5rem] disabled:opacity-20 transition-all active:scale-95 shadow-2xl shadow-primary/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-sky-600 transition-transform group-hover:scale-110" />
              <div className="relative flex items-center justify-center gap-3 text-white font-black text-xl uppercase tracking-[0.2em]">
                SINCRONIZAR VIBE <ArrowUpRight size={24} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingEcho && (
        <div className="fixed inset-0 z-[300] bg-midnight-950 flex flex-col animate-fade-in overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-midnight-950 to-midnight-950 opacity-80 z-10" />
            <div className="absolute size-[800px] bg-primary/10 blur-[180px] rounded-full -top-1/4 -right-1/4 animate-pulse-slow" />
            <div className="absolute size-[600px] bg-purple-500/5 blur-[150px] rounded-full -bottom-1/4 -left-1/4 animate-float" />
          </div>

          {/* Progress Bars */}
          <div className="pt-6 px-6 relative z-30">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-md">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-400 w-full animate-[width_8s_linear] origin-left shadow-[0_0_20px_rgba(13,162,231,0.8)]"
                onAnimationEnd={() => setViewingEcho(null)}
              ></div>
            </div>
          </div>

          {/* Header */}
          <div className="p-8 flex items-center justify-between relative z-30">
            <div className="flex items-center gap-4">
              <div className="p-[2.5px] glass-card rounded-2xl bg-gradient-to-tr from-white/20 to-transparent">
                <Avatar url={viewingEcho.author_avatar} alt="" size="md" className="rounded-[14px]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-[16px] tracking-tight">{viewingEcho.author_username}</span>
                  <Zap size={12} className="text-primary fill-primary" />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR })}</div>
              </div>
            </div>
            <button
              onClick={() => setViewingEcho(null)}
              className="size-14 glass-button rounded-[1.8rem] flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <X size={28} strokeWidth={3} />
            </button>
          </div>

          {/* Immersive Content */}
          <div className="flex-1 flex items-center justify-center p-8 text-center relative z-20">
            <p className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] selection:bg-primary/40 animate-slide-up">
              {viewingEcho.content}
            </p>
          </div>

          {/* Integrated Actions */}
          <div className="p-10 pb-safe-offset-10 relative z-30">
            <div className="flex items-center gap-5 max-w-xl mx-auto w-full">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  placeholder="Enviar frequência de resposta..."
                  className="w-full input-glass border-white/10 rounded-[2.2rem] px-8 py-6 text-sm font-bold text-white focus:outline-none placeholder:text-slate-600 transition-all relative z-10"
                  readOnly
                  onClick={() => alert('Frequências de resposta em fase de testes!')}
                />
                <div className="absolute right-4 top-3.5 size-12 rounded-[1.4rem] bg-white/5 text-white/20 flex items-center justify-center z-20">
                  <Send size={20} />
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    if (!hasLikedVibe) setVibeLikes(p => p + 1);
                    setHasLikedVibe(true);
                    supabase.from('echo_likes').insert({ user_id: user?.id, echo_id: viewingEcho.id }).then();
                  }}
                  className={`size-20 rounded-[2.2rem] flex items-center justify-center transition-all relative overflow-hidden group/like active:scale-90 ${hasLikedVibe ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-110' : 'glass-card text-white hover:bg-white/10'}`}
                >
                  <span className={`material-symbols-outlined text-[36px] transition-transform duration-500 group-hover/like:scale-125 ${hasLikedVibe ? 'fill-1' : ''}`}>
                    favorite
                  </span>
                </button>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vibeLikes} Sincronias</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
