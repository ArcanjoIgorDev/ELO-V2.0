
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithAuthor } from '../types';
import { PostCard } from '../components/PostCard';
import { EcosBar } from '../components/EcosBar';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Newspaper, Send, Image, AlertCircle } from 'lucide-react';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';

const FeedSkeleton = () => (
  <div className="animate-pulse mb-0 p-5 border-b border-white/5 bg-midnight-950/50">
    <div className="flex space-x-4">
      <div className="rounded-full bg-slate-800 h-10 w-10 border border-white/5"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-20 bg-slate-800 rounded-xl w-full"></div>
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
      if (!isRefresh && posts.length === 0 && isMounted.current) setLoading(true);
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
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      if (data && isMounted.current) {
        const formattedPosts: PostWithAuthor[] = data.map((post: any) => ({
          ...post,
          likes_count: post.likes ? post.likes.length : 0,
          comments_count: post.comments ? post.comments[0].count : 0,
          views_count: post.post_views ? post.post_views[0].count : 0,
          user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
      if (isMounted.current) setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = async () => {
    await fetchPosts(true);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-full pb-24 bg-midnight-950">
        <EcosBar />
        
        {/* Quick Create Box */}
        <div className="mx-4 mb-4 bg-midnight-900/50 border border-white/5 rounded-3xl p-4 flex items-center gap-3 shadow-sm" onClick={() => navigate('/create')}>
           <Avatar url={profile?.avatar_url} alt="" size="md" />
           <div className="flex-1 bg-white/5 h-10 rounded-full flex items-center px-4 text-slate-500 text-sm cursor-text hover:bg-white/10 transition-colors">
              No que você está pensando?
           </div>
           <button className="p-2 text-ocean hover:bg-white/5 rounded-full"><Image size={20}/></button>
        </div>

        {loading && posts.length === 0 ? (
          <div className="pt-2">
             {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center min-h-[40vh] px-8 text-center animate-fade-in mt-10">
              <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4 border border-red-500/20"><AlertCircle size={32} /></div>
              <p className="text-white font-bold mb-1">Não foi possível carregar</p>
              <p className="text-slate-500 mb-6 text-sm">Verifique sua conexão e tente novamente.</p>
              <button onClick={() => fetchPosts()} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                 <RefreshCw size={16} /> Tentar novamente
              </button>
           </div>
        ) : (
          <div className="pb-10">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-slide-up">
                <div className="w-20 h-20 bg-midnight-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                  <Newspaper size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Feed Silencioso</h3>
                <p className="text-slate-500 max-w-xs leading-relaxed font-medium text-sm">
                  Seja o primeiro a criar uma onda hoje.
                </p>
                <button onClick={() => navigate('/create')} className="mt-6 px-6 py-3 bg-ocean text-white font-bold rounded-xl shadow-lg shadow-ocean/20">Criar Post</button>
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
