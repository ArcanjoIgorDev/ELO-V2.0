
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithAuthor } from '../types';
import { PostCard } from '../components/PostCard';
import { EcosBar } from '../components/EcosBar';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Newspaper, AlertCircle, Sparkles } from 'lucide-react';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const FeedSkeleton = () => (
  <div className="animate-pulse mb-6 p-6 glass-panel rounded-[2rem] mx-0">
    <div className="flex items-center gap-4 mb-4">
      <div className="rounded-full bg-white/10 h-10 w-10 shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded-full w-1/3"></div>
        <div className="h-2 bg-white/5 rounded-full w-1/4"></div>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-white/5 rounded-full w-full"></div>
      <div className="h-3 bg-white/5 rounded-full w-5/6"></div>
      <div className="h-3 bg-white/5 rounded-full w-4/6"></div>
    </div>
    <div className="flex gap-4 pt-2 border-t border-white/5">
      <div className="h-6 w-12 bg-white/5 rounded-lg"></div>
      <div className="h-6 w-12 bg-white/5 rounded-lg"></div>
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
    // CORREÇÃO CRÍTICA: Se não tiver usuário, para o loading imediatamente.
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

      if (dbError) throw dbError;

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
      // GARANTIA ABSOLUTA: O loading VAI parar.
      if (isMounted.current) setLoading(false);
    }
  }, [user, posts.length]);

  useEffect(() => {
    fetchPosts();

    // Safety Valve: Se por algum milagre o loading travar por 8 segundos, força parada.
    const safetyTimer = setTimeout(() => {
      if (loading && isMounted.current) {
        console.warn("Forçando parada do loading do Feed por timeout.");
        setLoading(false);
      }
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, [fetchPosts]); // Removemos 'loading' da dependência para evitar loop, mantemos fetchPosts

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PullToRefresh onRefresh={() => fetchPosts(true)}>
      <div className="min-h-full pb-32">
        <EcosBar />

        {/* Quick Create Box */}
        {/* Quick Create Box */}
        <div
          className="mx-4 mb-6 glass-panel rounded-[2rem] p-4 flex items-center gap-4 shadow-xl active:scale-[0.99] transition-all cursor-pointer group relative overflow-hidden"
          onClick={() => navigate('/create')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="shrink-0 p-0.5 rounded-full border border-white/10 group-hover:border-primary/40 transition-colors">
            <Avatar url={profile?.avatar_url} alt="" size="md" />
          </div>

          <div className="flex-1 bg-white/5 h-12 rounded-full flex items-center px-5 text-slate-400 text-sm font-medium border border-white/5 group-hover:bg-white/10 group-hover:border-primary/20 transition-all">
            Compartilhe suas ideias...
          </div>

          <button className="p-3 text-primary bg-primary/10 rounded-full group-hover:bg-primary/20 group-hover:scale-105 transition-all border border-primary/20 shadow-lg shadow-primary/10">
            <Sparkles size={20} className="fill-current" />
          </button>
        </div>

        {loading ? (
          <div className="pt-2 px-3 space-y-4">
            {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] px-8 text-center animate-fade-in mt-4">
            <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4 border border-red-500/20 shadow-lg shadow-red-500/10"><AlertCircle size={32} /></div>
            <p className="text-white font-bold mb-1 text-lg">Não foi possível carregar</p>
            <p className="text-slate-500 mb-6 text-sm">Verifique sua conexão e tente novamente.</p>
            <button onClick={() => fetchPosts(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <RefreshCw size={18} /> Tentar novamente
            </button>
          </div>
        ) : (
          <div className="px-3 space-y-5 pb-safe">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-slide-up">
                <div className="w-24 h-24 bg-midnight-900 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-2xl rotate-3">
                  <Newspaper size={40} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Feed Silencioso</h3>
                <p className="text-slate-500 max-w-xs leading-relaxed font-medium text-sm mb-6">
                  Parece que o oceano está calmo hoje. Seja o primeiro a criar uma onda.
                </p>
                <button onClick={() => navigate('/create')} className="px-8 py-3.5 bg-ocean text-white font-bold rounded-2xl shadow-lg shadow-ocean/20 hover:shadow-ocean/40 transition-all hover:-translate-y-1">Criar Post</button>
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
