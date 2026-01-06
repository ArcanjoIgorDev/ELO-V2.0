
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

const FeedSkeleton = () => (
  <div className="animate-pulse mb-4 p-5 border border-white/5 bg-midnight-900/40 rounded-3xl mx-2">
    <div className="flex space-x-4">
      <div className="rounded-full bg-slate-800 h-10 w-10"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-24 bg-slate-800 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  </div>
);

export const Feed = () => {
  const { user, profile } = useAuth();
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
    if (!user) return;
    
    try {
      // CORREÇÃO: Só mostra loading se não houver posts (primeira carga) ou se for refresh explícito
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
          comments(count),
          post_views(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbError) throw dbError;

      if (data && isMounted.current) {
        const formattedPosts: PostWithAuthor[] = data.map((post: any) => ({
          ...post,
          likes_count: post.likes ? post.likes.length : 0,
          comments_count: post.comments && post.comments[0] ? post.comments[0].count : 0,
          views_count: post.post_views && post.post_views[0] ? post.post_views[0].count : 0,
          user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]); // user é estável graças ao AuthContext refatorado

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PullToRefresh onRefresh={() => fetchPosts(true)}>
      <div className="min-h-full pb-32 bg-midnight-950">
        <EcosBar />
        
        {/* Quick Create Box */}
        <div className="mx-3 mb-6 bg-gradient-to-r from-midnight-900 to-midnight-900/50 border border-white/10 rounded-[2rem] p-4 flex items-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer" onClick={() => navigate('/create')}>
           <div className="opacity-80"><Avatar url={profile?.avatar_url} alt="" size="md" /></div>
           <div className="flex-1 bg-white/5 h-11 rounded-full flex items-center px-5 text-slate-400 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5">
              No que você está pensando?
           </div>
           <button className="p-2.5 text-ocean bg-ocean/10 rounded-full hover:bg-ocean/20 transition-colors border border-ocean/20">
             <Sparkles size={20} />
           </button>
        </div>

        {loading && posts.length === 0 ? (
          <div className="pt-2 px-1">
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
          <div className="px-2 space-y-4">
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
