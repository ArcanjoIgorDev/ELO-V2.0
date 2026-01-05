
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { LogOut, Grid, Users, Trash2, AlertTriangle, Activity } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostWithAuthor } from '../types';

export const ProfilePage = () => {
  const { profile, signOut, user } = useAuth();
  const [stats, setStats] = useState({ posts: 0, connections: 0 });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [myPosts, setMyPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadStats();
      if (activeTab === 'posts') {
        loadMyPosts();
      }
    }
  }, [profile, activeTab]);

  const loadStats = async () => {
    if (!profile) return;
    setLoading(true);
    const postsReq = await supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', profile.id);
    const connectionsReq = await supabase
      .from('connections')
      .select('id', { count: 'exact' })
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq('status', 'accepted');

    setStats({
      posts: postsReq.count || 0,
      connections: connectionsReq.count || 0
    });
    setLoading(false);
  };

  const loadMyPosts = async () => {
    if (!profile) return;
    setLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*),
        likes(user_id),
        comments(count)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: PostWithAuthor[] = data.map((post: any) => ({
        ...post,
        likes_count: post.likes ? post.likes.length : 0,
        comments_count: post.comments ? post.comments[0].count : 0,
        user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
      }));
      setMyPosts(formatted);
    }
    setLoadingPosts(false);
  };

  const handlePostDeleted = (postId: string) => {
    setMyPosts(prev => prev.filter(p => p.id !== postId));
    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("ATENÇÃO: Isso excluirá PERMANENTEMENTE sua conta.\n\nDeseja continuar?");
    if (confirmed) {
      setIsDeleting(true);
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', profile?.id);
        if (error) throw error;
        await signOut();
      } catch (err) {
        alert("Erro ao excluir. Tente novamente.");
        setIsDeleting(false);
      }
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-full pb-24 bg-midnight-950">
      {/* Header Abstrato */}
      <div className="h-40 bg-gradient-to-b from-ocean-900 to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <div className="px-5 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
           <div className="p-1.5 bg-midnight-950 rounded-full shadow-2xl shadow-black/50 border border-white/10">
              <Avatar url={profile.avatar_url} alt={profile.username} size="xl" />
           </div>
           <button onClick={() => signOut()} className="mb-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/5 transition-colors">
              Sair
           </button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{profile.full_name}</h1>
          <p className="text-slate-500 font-medium text-sm">@{profile.username}</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-sm">
            {profile.bio || "Membro do ELO."}
          </p>
        </div>

        <div className="flex gap-6 mb-8 border-t border-white/5 pt-4">
          <div className="flex gap-2 items-baseline">
             <span className="text-lg font-bold text-white">{stats.posts}</span>
             <span className="text-xs text-slate-500 font-medium">Posts</span>
          </div>
          <div className="flex gap-2 items-baseline">
             <span className="text-lg font-bold text-white">{stats.connections}</span>
             <span className="text-xs text-slate-500 font-medium">Conexões</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-white/5 mb-2 sticky top-14 bg-midnight-950 z-20">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'posts' ? 'text-white border-b-2 border-ocean' : 'text-slate-500'}`}
          >
            <Grid size={16} />
            Publicações
          </button>
          <button 
             onClick={() => setActiveTab('info')}
             className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'info' ? 'text-white border-b-2 border-ocean' : 'text-slate-500'}`}
          >
            <Activity size={16} />
            Conta
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="min-h-[300px]">
          {activeTab === 'posts' ? (
             loadingPosts ? (
               <div className="p-10 text-center text-slate-500">Carregando...</div>
             ) : myPosts.length === 0 ? (
               <div className="p-10 text-center text-slate-500 border border-dashed border-white/10 rounded-xl mt-4">
                 Nenhuma publicação ainda.
               </div>
             ) : (
               <div className="divide-y divide-white/5 border-t border-white/5">
                 {myPosts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                 ))}
               </div>
             )
          ) : (
             <div className="mt-8 space-y-4 px-2">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                   <h3 className="text-white font-bold mb-2 text-sm">Zona de Perigo</h3>
                   <p className="text-xs text-slate-400 mb-4">Ações aqui não podem ser desfeitas.</p>
                   
                   <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full text-red-400 hover:text-red-300 text-sm font-bold py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? 'Excluindo...' : (
                      <>
                        <Trash2 size={16} />
                        Excluir conta permanentemente
                      </>
                    )}
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
