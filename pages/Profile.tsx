
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Grid, Trash2, Activity, Camera, Loader2, UserPlus, MessageCircle, Clock, Check, ArrowLeft } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostWithAuthor } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { profile: myProfile, signOut, user, refreshProfile } = useAuth();
  const { userId } = useParams(); // Se existir, estamos vendo outro perfil
  const navigate = useNavigate();

  const [displayProfile, setDisplayProfile] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, connections: 0 });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'blocked'>('none');
  const [processingConnect, setProcessingConnect] = useState(false);
  
  // Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !userId || userId === user?.id;

  // 1. Determina qual perfil exibir (Meu ou de Outro)
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      if (isOwnProfile) {
        setDisplayProfile(myProfile);
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setDisplayProfile(data);
        
        // Se for outro usuário, verifica conexão
        if (user && userId) {
            const { data: conn } = await supabase
                .from('connections')
                .select('*')
                .or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`)
                .single();
            
            if (conn) setConnectionStatus(conn.status);
            else setConnectionStatus('none');
        }
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [userId, myProfile, user, isOwnProfile]);

  // 2. Carrega Posts e Stats quando temos o displayProfile
  useEffect(() => {
    if (displayProfile?.id) {
      loadStats(displayProfile.id);
      if (activeTab === 'posts') {
        loadPosts(displayProfile.id);
      }
    }
  }, [displayProfile, activeTab]);

  const loadStats = async (id: string) => {
    const postsReq = await supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', id);
    const connectionsReq = await supabase
      .from('connections')
      .select('id', { count: 'exact' })
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`)
      .eq('status', 'accepted');

    setStats({
      posts: postsReq.count || 0,
      connections: connectionsReq.count || 0
    });
  };

  const loadPosts = async (id: string) => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*),
        likes(user_id),
        comments(count)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: PostWithAuthor[] = data.map((post: any) => ({
        ...post,
        likes_count: post.likes ? post.likes.length : 0,
        comments_count: post.comments ? post.comments[0].count : 0,
        user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
      }));
      setPosts(formatted);
    }
    setLoadingPosts(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    
    setUploadingAvatar(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
    } catch (error: any) {
      alert('Erro ao atualizar foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleConnect = async () => {
    if (!user || !displayProfile || processingConnect) return;
    setProcessingConnect(true);

    try {
      // Mesma lógica robusta do Discover (Upsert)
      const { data: existingConn } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${displayProfile.id}),and(requester_id.eq.${displayProfile.id},receiver_id.eq.${user.id})`)
        .single();

      let connectionId = existingConn?.id;

      if (existingConn) {
         if (existingConn.status === 'blocked') {
            alert('Ação não permitida.');
            return;
         }
         await supabase
            .from('connections')
            .update({ status: 'pending', requester_id: user.id, receiver_id: displayProfile.id, updated_at: new Date().toISOString() })
            .eq('id', existingConn.id);
      } else {
         const { data: newConn } = await supabase
            .from('connections')
            .insert({ requester_id: user.id, receiver_id: displayProfile.id, status: 'pending' })
            .select()
            .single();
         connectionId = newConn?.id;
      }

      if (connectionId) {
          await supabase.from('notifications').insert({
            user_id: displayProfile.id,
            actor_id: user.id,
            type: 'request_received',
            reference_id: connectionId
          });
          setConnectionStatus('pending');
      }
    } catch (err) {
       console.error(err);
    } finally {
        setProcessingConnect(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("ATENÇÃO: Isso excluirá PERMANENTEMENTE sua conta.");
    if (confirmed) {
      setIsDeleting(true);
      try {
        await supabase.from('profiles').delete().eq('id', user?.id);
        await signOut();
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  if (loading || !displayProfile) {
    return <div className="min-h-full flex items-center justify-center bg-midnight-950"><Loader2 className="animate-spin text-ocean" /></div>;
  }

  return (
    <div className="min-h-full pb-24 bg-midnight-950">
      <div className="h-40 bg-gradient-to-b from-ocean-900 to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        {!isOwnProfile && (
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/20 rounded-full text-white backdrop-blur">
                <ArrowLeft size={20} />
            </button>
        )}
      </div>

      <div className="px-5 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
           {/* Avatar */}
           <div className="relative group">
             <div className="p-1.5 bg-midnight-950 rounded-full shadow-2xl shadow-black/50 border border-white/10">
                <Avatar url={displayProfile.avatar_url} alt={displayProfile.username} size="xl" />
             </div>
             
             {isOwnProfile && (
               <>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-2 right-2 p-2 bg-ocean text-white rounded-full shadow-lg border-2 border-midnight-950 hover:bg-ocean-600 transition-colors active:scale-95"
                 >
                    {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
               </>
             )}
           </div>

           {/* Ações (Botão Connect ou Logout) */}
           {isOwnProfile ? (
             <button onClick={() => signOut()} className="mb-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/5 transition-colors">
                Sair
             </button>
           ) : (
             <div className="mb-2">
                {connectionStatus === 'accepted' ? (
                   <button onClick={() => navigate(`/chat/${displayProfile.id}`)} className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                       <MessageCircle size={16} /> Mensagem
                   </button>
                ) : connectionStatus === 'pending' ? (
                   <button className="bg-white/5 text-slate-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 cursor-default border border-white/5">
                       <Clock size={16} /> Pendente
                   </button>
                ) : (
                   <button 
                     onClick={handleConnect}
                     disabled={processingConnect}
                     className="bg-ocean hover:bg-ocean-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-ocean/20 transition-all active:scale-95 flex items-center gap-2"
                   >
                       {processingConnect ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                       Conectar
                   </button>
                )}
             </div>
           )}
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{displayProfile.full_name}</h1>
          <p className="text-slate-500 font-medium text-sm">@{displayProfile.username}</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-sm">
            {displayProfile.bio || (isOwnProfile ? "Edite seu perfil para adicionar uma bio." : "Membro do ELO.")}
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
          {isOwnProfile && (
             <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'info' ? 'text-white border-b-2 border-ocean' : 'text-slate-500'}`}
             >
               <Activity size={16} />
               Conta
             </button>
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-h-[300px]">
          {activeTab === 'posts' ? (
             loadingPosts ? (
               <div className="p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" /></div>
             ) : posts.length === 0 ? (
               <div className="p-10 text-center text-slate-500 border border-dashed border-white/10 rounded-xl mt-4">
                 Nenhuma publicação.
               </div>
             ) : (
               <div className="divide-y divide-white/5 border-t border-white/5">
                 {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                 ))}
               </div>
             )
          ) : (
             <div className="mt-8 space-y-4 px-2">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                   <h3 className="text-white font-bold mb-2 text-sm">Zona de Perigo</h3>
                   <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full text-red-400 hover:text-red-300 text-sm font-bold py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? '...' : <><Trash2 size={16} /> Excluir conta</>}
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
