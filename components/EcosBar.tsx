
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Trash2, Zap, Heart, MessageCircle, Send, PlusCircle } from 'lucide-react';
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
  
  // Interaction States
  const [vibeLikes, setVibeLikes] = useState(0);
  const [hasLikedVibe, setHasLikedVibe] = useState(false);
  const [vibeComments, setVibeComments] = useState<any[]>([]);
  const [newVibeComment, setNewVibeComment] = useState('');

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

  // Load interactions
  useEffect(() => {
    if (viewingEcho) {
      setVibeLikes(viewingEcho.likes_count);
      setHasLikedVibe(viewingEcho.user_has_liked);
      
      const loadComments = async () => {
        const { data } = await supabase
          .from('echo_comments')
          .select('*, author:profiles(username)')
          .eq('echo_id', viewingEcho.id)
          .order('created_at', { ascending: true })
          .limit(5);
        if (data) setVibeComments(data);
      };
      loadComments();
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
    <div className="pt-5 pb-3 bg-midnight-950/50 backdrop-blur-sm border-b border-white/5 mb-2">
      <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar items-center pb-2">
        
        {/* Create / My Vibe */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => hasMyVibe ? setViewingEcho(myEchos[0]) : setIsCreating(true)}>
           <div className={`w-[70px] h-[70px] rounded-[24px] flex items-center justify-center relative transition-all duration-300 ${hasMyVibe ? 'p-[2px] bg-gradient-to-tr from-ocean to-emerald-400 shadow-lg shadow-ocean/20' : 'bg-white/5 border border-white/10 border-dashed hover:border-ocean/50 hover:bg-white/10'}`}>
              <div className="w-full h-full rounded-[22px] bg-midnight-950 overflow-hidden relative flex items-center justify-center">
                 {hasMyVibe ? (
                   <img src={myEchos[0].author_avatar} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" alt="" />
                 ) : (
                   <PlusCircle className="text-ocean w-8 h-8 opacity-80" strokeWidth={1.5} />
                 )}
              </div>
           </div>
           <span className="text-[11px] font-bold text-slate-300">{hasMyVibe ? 'Sua Vibe' : 'Criar'}</span>
        </div>

        {/* Others */}
        {otherEchos.map(echo => (
           <div key={echo.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => setViewingEcho(echo)}>
              <div className="w-[70px] h-[70px] rounded-[24px] p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 shadow-md transition-transform group-hover:scale-[1.02]">
                 <div className="w-full h-full rounded-[22px] bg-midnight-950 overflow-hidden relative">
                    <img src={echo.author_avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                 </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400 truncate max-w-[70px] text-center">{echo.author_username}</span>
           </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <button onClick={() => setIsCreating(false)} className="self-end p-2 bg-white/10 rounded-full text-white mb-10 hover:bg-white/20"><X /></button>
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
             <div className="w-20 h-20 bg-gradient-to-tr from-ocean to-emerald-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-ocean/30 rotate-3">
                <Zap size={40} className="text-white fill-white"/>
             </div>
             <h3 className="text-white font-bold text-xl mb-6">O que você está sentindo?</h3>
             <textarea 
               autoFocus maxLength={60} value={newEchoContent} onChange={e => setNewEchoContent(e.target.value)}
               placeholder="Digite aqui..."
               className="w-full bg-transparent text-center text-4xl font-black text-white placeholder:text-white/10 focus:outline-none resize-none mb-4 leading-tight"
               rows={2}
             />
             <div className="text-sm text-slate-500 font-bold tracking-wider">{newEchoContent.length}/60</div>
          </div>
          <button onClick={handleCreateEcho} disabled={!newEchoContent.trim()} className="w-full max-w-md mx-auto bg-ocean hover:bg-ocean-600 text-white font-bold py-4 rounded-2xl mb-8 disabled:opacity-50 transition-all shadow-lg shadow-ocean/20">PUBLICAR ECOS</button>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingEcho && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col animate-fade-in">
          {/* Progress Bar */}
          <div className="pt-2 px-2"><div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white w-full animate-[width_10s_linear] origin-left" onAnimationEnd={() => setViewingEcho(null)}></div></div></div>
          
          <div className="p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
               <div>
                 <div className="font-bold text-white text-sm">{viewingEcho.author_username}</div>
                 <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR })}</div>
               </div>
             </div>
             <button onClick={() => setViewingEcho(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="text-white" /></button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 text-center relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute inset-0 bg-gradient-to-tr from-ocean/20 to-purple-500/20 blur-[100px] pointer-events-none"></div>
             <p className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl relative z-10">{viewingEcho.content}</p>
          </div>

          {/* Interactions */}
          <div className="p-4 pb-safe bg-gradient-to-t from-black via-black/80 to-transparent">
             <div className="flex items-center gap-4 max-w-md mx-auto w-full">
                <div className="flex-1 relative">
                  <input 
                    placeholder="Responder..."
                    className="w-full bg-white/10 border border-white/10 rounded-full pl-5 pr-10 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-md"
                    readOnly 
                    onClick={() => alert('Respostas a Ecos em breve!')}
                  />
                  <button className="absolute right-2 top-2 p-1.5 bg-white/10 rounded-full"><Send size={16} className="text-white"/></button>
                </div>
                
                <button onClick={() => {
                   if (!hasLikedVibe) setVibeLikes(p => p + 1);
                   setHasLikedVibe(true);
                   // Lógica de like simplificada
                   supabase.from('echo_likes').insert({ user_id: user?.id, echo_id: viewingEcho.id }).then();
                }} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
                   <div className={`p-3.5 rounded-full ${hasLikedVibe ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/10 text-white'} transition-colors`}>
                      <Heart size={24} className={hasLikedVibe ? 'fill-current' : ''} strokeWidth={2.5} />
                   </div>
                   <span className="text-xs font-bold text-white">{vibeLikes}</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
