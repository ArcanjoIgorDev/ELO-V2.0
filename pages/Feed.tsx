
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithAuthor } from '../types';
import { PostCard } from '../components/PostCard';
import { EcosBar } from '../components/EcosBar';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Newspaper } from 'lucide-react';
import { PullToRefresh } from '../components/ui/PullToRefresh';

const FeedSkeleton = () => (
  <div className="animate-pulse mb-4 p-4 border-b border-white/5 bg-midnight-950">
    <div className="flex space-x-4">
      <div className="rounded-full bg-slate-800 h-10 w-10"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

export const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Ref para rastrear se o componente está montado
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!user) return;
    
    try {
      // Só mostra loading na tela inteira se não for um refresh e não tiver posts
      if (!isRefresh && posts.length === 0 && isMounted.current) setLoading(true);
      if (isMounted.current) setError(false);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          likes(user_id),
          comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && isMounted.current) {
        const formattedPosts: PostWithAuthor[] = data.map((post: any) => ({
          ...post,
          likes_count: post.likes ? post.likes.length : 0,
          comments_count: post.comments ? post.comments[0].count : 0,
          user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
        }));
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      if (isMounted.current) setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]); // 'posts.length' removido para evitar loops e stale closures

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = async () => {
    await fetchPosts(true);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-full pt-safe">
         <div className="h-32 bg-white/5 animate-pulse mb-6" /> 
         {[1, 2, 3, 4].map((i) => <FeedSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-8 text-center animate-fade-in">
           <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
              <RefreshCw size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-200 mb-2">Erro de conexão</h3>
           <p className="text-slate-500 mb-6">Não foi possível carregar o feed.</p>
           <button onClick={() => fetchPosts()} className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold">Tentar novamente</button>
        </div>
     )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-full pb-24">
        <EcosBar />
        
        <div>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 px-8 text-center animate-slide-up">
              <div className="w-20 h-20 bg-midnight-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Newspaper size={32} className="text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seu feed está vazio</h3>
              <p className="text-slate-500 max-w-xs leading-relaxed font-medium text-sm">
                Conecte-se com pessoas ou crie sua primeira publicação para iniciar.
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
