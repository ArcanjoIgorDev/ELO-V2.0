
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithAuthor } from '../types';
import { PostCard } from '../components/PostCard';
import { EcosBar } from '../components/EcosBar';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Newspaper, AlertCircle, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const FeedSkeleton = () => (
  <div className="animate-pulse mb-6 p-6 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    <div className="flex items-center gap-4 mb-6">
      <div className="rounded-2xl bg-white/5 h-12 w-12 shrink-0 border border-white/5"></div>
      <div className="flex-1 space-y-2.5">
        <div className="h-3 bg-white/10 rounded-full w-1/3"></div>
        <div className="h-2 bg-white/5 rounded-full w-1/4"></div>
      </div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-3 bg-white/5 rounded-full w-full"></div>
      <div className="h-3 bg-white/5 rounded-full w-5/6"></div>
      <div className="h-3 bg-white/5 rounded-full w-2/3"></div>
    </div>
    <div className="flex gap-4 pt-4 border-t border-white/5">
      <div className="h-8 w-16 bg-white/5 rounded-xl"></div>
      <div className="h-8 w-16 bg-white/5 rounded-xl"></div>
    </div>
  </div>
);

export const Feed = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!user) {
      if (isMounted.current) setLoading(false);
      return;
    }

    try {
      if (!isRefresh && posts.length === 0 && isMounted.current) {
        setLoading(true);
      }

      if (isMounted.current) setError(false);

      const { data, error: dbError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          likes(user_id),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbError) {
        console.error('Erro ao buscar posts:', dbError);
        // Só marca como erro se não for um erro de "tabela não existe" ou similar
        if (dbError.code !== 'PGRST116' && isMounted.current) {
          setError(true);
        }
        if (isMounted.current) {
          setPosts([]);
          setLoading(false);
        }
        return;
      }

      if (data && isMounted.current) {
        const formattedPosts: PostWithAuthor[] = data.map((post: any) => ({
          ...post,
          likes_count: Array.isArray(post.likes) ? post.likes.length : 0,
          comments_count: post.comments && post.comments[0] ? post.comments[0].count : 0,
          views_count: 0,
          user_has_liked: Array.isArray(post.likes) ? post.likes.some((like: any) => like.user_id === user?.id) : false,
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error("Feed error:", err);
      if (isMounted.current) setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user, posts.length]);

  useEffect(() => {
    fetchPosts();
    const safetyTimer = setTimeout(() => {
      if (loading && isMounted.current) {
        setLoading(false);
      }
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, [fetchPosts]);

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PullToRefresh onRefresh={() => fetchPosts(true)}>
      <div className="min-h-full pb-32 bg-midnight-950">
        <EcosBar />

        {/* Home Header */}
        <div className="px-5 mb-8 flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none">Feed Principal</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <TrendingUp size={10} className="text-primary" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.1em]">Explorar</span>
              </div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Ondas de hoje</span>
            </div>
          </div>
          <button className="size-12 rounded-2xl glass-button flex items-center justify-center text-primary shadow-xl shadow-primary/5 border-white/10 transition-all hover:scale-110 active:scale-90">
            <span className="material-symbols-outlined text-[24px]">tune</span>
          </button>
        </div>

        {/* Quick Create Box */}
        <div className="px-3 mb-10">
          <div
            className="glass-card rounded-[2.5rem] p-5 flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden border-white/5 shadow-2xl"
            onClick={() => navigate('/create')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="p-1 glass-panel rounded-2xl">
                <Avatar url={profile?.avatar_url} alt="" size="md" className="relative border-white/5 rounded-xl" />
              </div>
            </div>

            <div className="flex-1 bg-white/[0.03] h-16 rounded-[1.5rem] flex items-center px-6 text-slate-400 text-sm font-bold border border-white/5 group-hover:bg-white/[0.07] group-hover:border-primary/30 transition-all tracking-tight">
              Inicie uma nova frequência...
            </div>

            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined text-[28px] fill-1 group-hover:scale-110 transition-transform">add_circle</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-3 space-y-6">
            {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in mx-3 glass-card rounded-[3rem] border-red-500/10 mb-20">
            <div className="size-24 rounded-[3rem] bg-red-500/5 flex items-center justify-center mb-8 border border-red-500/10 shadow-2xl shadow-red-500/5">
              <AlertCircle size={48} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Sinal Interrompido</h3>
            <p className="text-slate-500 mb-10 text-sm font-bold leading-relaxed max-w-[240px]">O oceano está muito agitado no momento. Tente novamente.</p>
            <button
              onClick={() => fetchPosts(true)}
              className="h-16 px-10 rounded-[2rem] bg-white text-midnight-950 font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3"
            >
              <RefreshCw size={18} /> Reconectar
            </button>
          </div>
        ) : (
          <div className="px-3 space-y-8 mb-20">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-8 text-center animate-slide-up glass-card rounded-[3rem] border-dashed border-white/5">
                <div className="size-28 rounded-[3.5rem] bg-midnight-900 border border-white/5 flex items-center justify-center mb-10 rotate-3 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                  <span className="material-symbols-outlined text-slate-700 text-[56px] opacity-40">waves</span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Oceano Calmo</h3>
                <p className="text-slate-500 max-w-[260px] leading-relaxed font-bold text-sm mb-10">
                  Nenhuma onda detectada. Seja o pioneiro a impactar a rede hoje.
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="h-16 px-12 rounded-[2rem] bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-sky-400 transition-all active:scale-95"
                >
                  Criar Onda
                </button>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
              ))
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};
