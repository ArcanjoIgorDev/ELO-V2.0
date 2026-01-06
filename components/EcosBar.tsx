
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Trash2, Zap, Heart, MessageCircle, Send } from 'lucide-react';
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
  
  // Interaction States inside viewing
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
        likes:echo_likes(user_id),
        comments:echo_comments(id)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: EchoWithAuthor[] = data.map((e: any) => ({
        ...e,
        author_avatar: e.author?.avatar_url,
        author_username: e.author?.username,
        likes_count: e.likes ? e.likes.length : 0,
        comments_count: e.comments ? e.comments.length : 0,
        user_has_liked: e.likes ? e.likes.some((l: any) => l.user_id === user.id) : false
      }));
      setEchos(formatted);
    }
  };

  useEffect(() => {
    fetchEchos();
    const channel = supabase.channel('echos_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'echos' }, fetchEchos).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load interactions when viewing
  useEffect(() => {
    if (viewingEcho) {
      setVibeLikes(viewingEcho.likes_count);
      setHasLikedVibe(viewingEcho.user_has_liked);
      
      const loadComments = async () => {
        const { data } = await supabase
          .from('echo_comments')
          .select('*, author:profiles(username, avatar_url)')
          .eq('echo_id', viewingEcho.id)
          .order('created_at', { ascending: true });
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

  const handleDeleteEcho = async (echoId: string) => {
    if (!window.confirm("Apagar vibe?")) return;
    await supabase.from('echos').delete().eq('id', echoId);
    setViewingEcho(null);
    setEchos(prev => prev.filter(e => e.id !== echoId));
  };

  const handleLikeVibe = async () => {
    if (!user || !viewingEcho) return;
    const originalState = hasLikedVibe;
    setHasLikedVibe(!hasLikedVibe);
    setVibeLikes(prev => hasLikedVibe ? prev - 1 : prev + 1);

    try {
      if (originalState) {
        await supabase.from('echo_likes').delete().match({ user_id: user.id, echo_id: viewingEcho.id });
      } else {
        await supabase.from('echo_likes').insert({ user_id: user.id, echo_id: viewingEcho.id });
      }
    } catch (e) {
      setHasLikedVibe(originalState); // Revert
    }
  };

  const handleCommentVibe = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user || !viewingEcho || !newVibeComment.trim()) return;
     
     const { data, error } = await supabase
       .from('echo_comments')
       .insert({ user_id: user.id, echo_id: viewingEcho.id, content: newVibeComment.trim() })
       .select('*, author:profiles(username, avatar_url)')
       .single();
     
     if (!error && data) {
       setVibeComments([...vibeComments, data]);
       setNewVibeComment('');
     }
  };

  const myEchos = echos.filter(e => e.user_id === user?.id);
  const otherEchos = echos.filter(e => e.user_id !== user?.id);
  const hasMyVibe = myEchos.length > 0;

  return (
    <div className="pt-4 pb-2 bg-midnight-950">
      <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar items-center">
        
        {/* Create / My Vibe */}
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" onClick={() => hasMyVibe ? setViewingEcho(myEchos[0]) : setIsCreating(true)}>
           <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center relative transition-all duration-300 ${hasMyVibe ? 'bg-gradient-to-br from-ocean to-emerald-400 p-[2px]' : 'bg-white/5 border border-white/10'}`}>
              <div className="w-full h-full rounded-[1.9rem] bg-midnight-950 overflow-hidden relative">
                 {hasMyVibe ? (
                   <img src={myEchos[0].author_avatar} className="w-full h-full object-cover opacity-80" alt="" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <Plus className="text-ocean" />
                   </div>
                 )}
              </div>
              {!hasMyVibe && <div className="absolute -bottom-1 -right-1 bg-ocean rounded-full p-1 border-2 border-midnight-950"><Plus size={10} className="text-white"/></div>}
           </div>
           <span className="text-[10px] font-bold text-slate-400">Eu</span>
        </div>

        {/* Others */}
        {otherEchos.map(echo => (
           <div key={echo.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setViewingEcho(echo)}>
              <div className="w-16 h-16 rounded-[2rem] p-[2px] bg-gradient-to-br from-indigo-500 to-purple-500">
                 <div className="w-full h-full rounded-[1.9rem] bg-midnight-950 overflow-hidden">
                    <img src={echo.author_avatar} className="w-full h-full object-cover" alt="" />
                 </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400 truncate max-w-[64px]">{echo.author_username}</span>
           </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-midnight-950/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in">
          <button onClick={() => setIsCreating(false)} className="self-end p-2 bg-white/10 rounded-full text-white mb-10"><X /></button>
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-ocean/20 rounded-full flex items-center justify-center mb-6 text-ocean animate-pulse"><Zap size={40}/></div>
             <textarea 
               autoFocus maxLength={60} value={newEchoContent} onChange={e => setNewEchoContent(e.target.value)}
               placeholder="Mande sua vibe..."
               className="w-full bg-transparent text-center text-3xl font-bold text-white placeholder:text-white/20 focus:outline-none resize-none mb-4"
             />
             <div className="text-sm text-slate-500 font-medium">{newEchoContent.length}/60</div>
          </div>
          <button onClick={handleCreateEcho} disabled={!newEchoContent.trim()} className="w-full bg-ocean text-white font-bold py-4 rounded-2xl mb-8 disabled:opacity-50">COMPARTILHAR VIBE</button>
        </div>
      )}

      {/* VIEW MODAL (IMMERSIVE) */}
      {viewingEcho && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex flex-col animate-fade-in">
          {/* Progress */}
          <div className="pt-2 px-2"><div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white w-full animate-[width_10s_linear] origin-left" onAnimationEnd={() => setViewingEcho(null)}></div></div></div>
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Avatar url={viewingEcho.author_avatar} alt="" size="sm" />
               <div className="leading-tight">
                 <div className="font-bold text-white">{viewingEcho.author_username}</div>
                 <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(viewingEcho.created_at), { locale: ptBR })}</div>
               </div>
             </div>
             <button onClick={() => setViewingEcho(null)}><X className="text-white" /></button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-8 text-center">
             <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-lg">{viewingEcho.content}</p>
          </div>

          {/* Interactions Overlay */}
          <div className="p-4 pb-safe bg-gradient-to-t from-black via-black/80 to-transparent">
             
             {/* Comments List Preview (Last 2) */}
             <div className="space-y-2 mb-4 max-h-32 overflow-y-auto mask-image-b">
                {vibeComments.map(c => (
                   <div key={c.id} className="flex gap-2 text-sm text-white/90 animate-slide-up">
                      <span className="font-bold text-white">{c.author.username}:</span>
                      <span>{c.content}</span>
                   </div>
                ))}
             </div>

             <div className="flex items-center gap-3">
                <form onSubmit={handleCommentVibe} className="flex-1 relative">
                  <input 
                    value={newVibeComment} onChange={e => setNewVibeComment(e.target.value)}
                    placeholder="Responda essa vibe..."
                    className="w-full bg-white/10 border border-white/10 rounded-full pl-4 pr-10 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-md"
                  />
                  <button type="submit" disabled={!newVibeComment.trim()} className="absolute right-1 top-1 p-2 bg-white/20 rounded-full text-white disabled:opacity-0"><Send size={16}/></button>
                </form>
                
                <button onClick={handleLikeVibe} className="flex flex-col items-center gap-1 group">
                   <div className={`p-3 rounded-full ${hasLikedVibe ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 text-white'} transition-colors`}>
                      <Heart size={24} className={hasLikedVibe ? 'fill-current' : ''} />
                   </div>
                   <span className="text-xs font-bold text-white">{vibeLikes}</span>
                </button>
             </div>

             {viewingEcho.user_id === user?.id && (
                <button onClick={() => handleDeleteEcho(viewingEcho.id)} className="w-full mt-4 py-3 text-red-400 text-sm font-bold bg-white/5 rounded-xl flex items-center justify-center gap-2">
                   <Trash2 size={16} /> Apagar Vibe
                </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
