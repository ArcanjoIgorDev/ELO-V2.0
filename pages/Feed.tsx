
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithAuthor } from '../types';
import { PostCard } from '../components/PostCard';
import { EcosBar } from '../components/EcosBar';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Newspaper } from 'lucide-react';

const FeedSkeleton = () => (
  <div className="animate-pulse mb-4 rounded-3xl p-5 border border-white/5 bg-midnight-900/50">
    <div className="flex space-x-4">
      <div className="rounded-full bg-slate-800 h-10 w-10"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-800 rounded-lg w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded-lg w-full"></div>
          <div className="h-4 bg-slate-800 rounded-lg w-5/6"></div>
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(false);
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

      if (data) {
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
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-full pt-2">
        <div className="px-4 mb-6"><div className="h-20 bg-white/5 rounded-xl animate-pulse"></div></div>
        <div className="px-4">
           {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center pt-32 px-8 text-center animate-fade-in">
           <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
              <RefreshCw size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-200 mb-2">Erro de conexão</h3>
           <p className="text-slate-500 mb-6">Não foi possível carregar o feed.</p>
           <button onClick={fetchPosts} className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold">Tentar novamente</button>
        </div>
     )
  }

  return (
    <div className="min-h-full pb-24">
      <EcosBar />
      
      <div className="px-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 px-8 text-center animate-slide-up">
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
  );
};
