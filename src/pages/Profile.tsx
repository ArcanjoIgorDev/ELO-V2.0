
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Grid, Trash2, Activity, Camera, Loader2, UserPlus, MessageCircle, Clock, Check, ArrowLeft, MoreHorizontal, Ban, X, UserMinus, Edit3, LogOut } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostWithAuthor } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { EditProfileModal } from '../components/profile/EditProfileModal';

type ConnectionState = 'none' | 'sent_pending' | 'received_pending' | 'accepted' | 'blocked';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  cover_url?: string;
}

export const ProfilePage = () => {
  const { profile: myProfile, signOut, user, refreshProfile } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [displayProfile, setDisplayProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ posts: 0, connections: 0 });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');

  const [connectionState, setConnectionState] = useState<ConnectionState>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [processingConnect, setProcessingConnect] = useState(false);
  const [showUnfriendMenu, setShowUnfriendMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnProfile = !userId || (user && userId === user.id);
  const targetId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    if (!targetId) return;

    const loadProfileData = async () => {
      // Se já temos dados exibidos e o ID é o mesmo, não mostra loading global
      if (!displayProfile || displayProfile.id !== targetId) {
        setLoadingProfile(true);
      }

      try {
        let profileData = null;
        if (isOwnProfile && myProfile) {
          profileData = myProfile as Profile;
        } else {
          const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
          profileData = data as Profile;
        }

        if (profileData) {
          setDisplayProfile(profileData);
          await Promise.all([loadStats(targetId), loadPosts(targetId), checkConnectionStatus(targetId)]);
        }
      } catch (err) {
        console.error("Erro carregando perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [targetId, isOwnProfile, myProfile, user]);

  const checkConnectionStatus = async (otherId: string) => {
    if (!user || isOwnProfile) return;

    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${otherId}),and(requester_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .maybeSingle();

    if (!data) {
      setConnectionState('none');
      setConnectionId(null);
    } else {
      setConnectionId(data.id);
      if (data.status === 'accepted') {
        setConnectionState('accepted');
      } else if (data.status === 'blocked') {
        setConnectionState('blocked');
      } else if (data.status === 'pending') {
        setConnectionState(data.requester_id === user.id ? 'sent_pending' : 'received_pending');
      }
    }
  };

  const loadStats = async (id: string) => {
    const postsReq = await supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', id);
    const connReq = await supabase
      .from('connections')
      .select('id', { count: 'exact' })
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`)
      .eq('status', 'accepted');

    setStats({
      posts: postsReq.count || 0,
      connections: connReq.count || 0
    });
  };

  const loadPosts = async (id: string) => {
    setLoadingPosts(true);
    // REMOVIDO: post_views(count)
    const { data } = await supabase
      .from('posts')
      .select(`*, author:profiles(*), likes(user_id), comments(count)`)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: PostWithAuthor[] = data.map((post: any) => ({
        ...post,
        likes_count: post.likes ? post.likes.length : 0,
        comments_count: post.comments && post.comments[0] ? post.comments[0].count : 0,
        views_count: 0,
        user_has_liked: post.likes ? post.likes.some((like: any) => like.user_id === user?.id) : false,
      }));
      setPosts(formatted);
    }
    setLoadingPosts(false);
  };

  // --- ACTIONS (Mantidas) ---
  const sendFriendRequest = async () => {
    if (!user || !targetId || processingConnect) return;
    setProcessingConnect(true);
    try {
      if (connectionId) await supabase.from('connections').delete().eq('id', connectionId);
      const { data, error } = await supabase.from('connections').insert({ requester_id: user.id, receiver_id: targetId, status: 'pending' }).select().single();
      if (error) throw error;
      setConnectionState('sent_pending');
      setConnectionId(data.id);
      supabase.from('notifications').insert({ user_id: targetId, actor_id: user.id, type: 'request_received', reference_id: data.id }).then(() => { });
    } catch (err: any) {
      alert("Erro ao conectar.");
    } finally {
      setProcessingConnect(false);
    }
  };

  const acceptRequest = async () => {
    if (!connectionId || processingConnect) return;
    setProcessingConnect(true);
    try {
      await supabase.from('connections').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', connectionId);
      setConnectionState('accepted');
      supabase.from('notifications').insert({ user_id: targetId!, actor_id: user!.id, type: 'request_accepted', reference_id: connectionId }).then(() => { });
    } finally {
      setProcessingConnect(false);
    }
  };

  const removeConnection = async () => {
    if (processingConnect) return;
    if (!window.confirm("Remover conexão?")) return;
    setProcessingConnect(true);
    try {
      if (connectionId) {
        await supabase.from('connections').delete().eq('id', connectionId);
      } else {
        await supabase.from('connections').delete().match({ requester_id: user?.id, receiver_id: targetId });
        await supabase.from('connections').delete().match({ requester_id: targetId, receiver_id: user?.id });
      }
      setConnectionState('none');
      setConnectionId(null);
      setShowUnfriendMenu(false);
    } finally {
      setProcessingConnect(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    setUploadingAvatar(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    try {
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
      setDisplayProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      alert('Erro no upload.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Isso apagará sua conta para sempre. Continuar?")) {
      setIsDeleting(true);
      await supabase.from('profiles').delete().eq('id', user?.id);
      await signOut();
    }
  };

  if (loadingProfile || !displayProfile) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-slate-500 text-sm animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 animate-fade-in" onClick={() => setShowUnfriendMenu(false)}>
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          currentName={displayProfile.full_name}
          currentBio={displayProfile.bio}
        />
      )}

      {/* Header Cover Area */}
      <div className="h-48 bg-gradient-to-b from-primary/30 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-ocean-gradient opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>

        {/* Back Button for other users */}
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 p-2.5 glass-button rounded-full text-white backdrop-blur-md active:scale-95 transition-transform z-20"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      <div className="px-5 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div className="relative group">
            <div className="p-1.5 glass-panel rounded-full shadow-2xl relative z-10 bg-background-dark/80">
              <Avatar url={displayProfile.avatar_url} alt={displayProfile.username} size="xl" />
            </div>
            {isOwnProfile && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 p-2.5 bg-primary text-white rounded-full shadow-lg border-2 border-background-dark hover:bg-sky-400 transition-all active:scale-95 disabled:opacity-50 z-20"
                >
                  {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          <div className="mb-2 flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="glass-button text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/10 active:scale-95"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  onClick={() => signOut()}
                  className="glass-button text-slate-300 p-2.5 rounded-xl transition-all hover:text-red-400 hover:bg-red-500/10 active:scale-90"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex gap-2 relative">
                {connectionState === 'accepted' ? (
                  <>
                    <button
                      onClick={() => navigate(`/chat/${displayProfile.id}`)}
                      className="bg-primary hover:bg-sky-400 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(13,162,231,0.3)] transition-all active:scale-95"
                    >
                      <MessageCircle size={18} /> Mensagem
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUnfriendMenu(!showUnfriendMenu); }}
                      className="glass-button text-white p-2.5 rounded-full hover:bg-white/10"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {showUnfriendMenu && (
                      <div className="absolute right-0 top-14 glass-panel rounded-2xl shadow-2xl z-20 w-52 overflow-hidden animate-fade-in border-white/10">
                        <button
                          onClick={removeConnection}
                          className="w-full text-left px-5 py-4 text-red-400 hover:bg-red-500/10 text-sm font-bold flex items-center gap-3 transition-colors"
                        >
                          <UserMinus size={18} /> Desfazer amizade
                        </button>
                      </div>
                    )}
                  </>
                ) : connectionState === 'sent_pending' ? (
                  <button
                    onClick={removeConnection}
                    disabled={processingConnect}
                    className="glass-button text-slate-300 px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 border-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all group active:scale-95"
                  >
                    {processingConnect ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Cancelar
                  </button>
                ) : connectionState === 'received_pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={acceptRequest}
                      disabled={processingConnect}
                      className="bg-primary hover:bg-sky-400 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(13,162,231,0.3)] transition-all active:scale-95"
                    >
                      <Check size={18} /> Aceitar
                    </button>
                    <button
                      onClick={removeConnection}
                      disabled={processingConnect}
                      className="glass-button text-white px-3.5 py-2.5 rounded-full hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={sendFriendRequest}
                    disabled={processingConnect}
                    className="bg-white text-background-dark hover:bg-slate-200 px-8 py-2.5 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {processingConnect ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Conectar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">{displayProfile.full_name || displayProfile.username}</h1>
          <p className="text-primary font-medium text-sm">@{displayProfile.username}</p>
          <p className="text-slate-300 text-[15px] mt-4 leading-relaxed max-w-md whitespace-pre-line">
            {displayProfile.bio || (isOwnProfile ? "Escreva algo sobre você..." : "Membro do ELO.")}
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 glass-panel py-3 px-4 rounded-2xl flex flex-col items-center">
            <span className="text-xl font-bold text-white">{stats.posts}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Publicações</span>
          </div>
          <div className="flex-1 glass-panel py-3 px-4 rounded-2xl flex flex-col items-center">
            <span className="text-xl font-bold text-white">{stats.connections}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conexões</span>
          </div>
        </div>

        <div className="flex items-center glass-panel p-1 mb-6 sticky top-20 z-20 rounded-2xl mx-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all rounded-xl ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Grid size={16} /> Posts
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all rounded-xl ${activeTab === 'info' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Activity size={16} /> Conta
            </button>
          )}
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'posts' ? (
            loadingPosts ? (
              <div className="py-20 text-center text-slate-500">
                <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                <p className="animate-pulse">Sintonizando frequências...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-20 text-center glass-panel rounded-[2rem] mx-1 border-dashed">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 border border-white/5">
                  <Grid size={32} />
                </div>
                <h3 className="text-white font-bold mb-1">Sem ondas por aqui</h3>
                <p className="text-slate-500 text-sm">Este perfil ainda não criou publicações.</p>
              </div>
            ) : (
              <div className="space-y-4 px-1 pb-10">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onDelete={(pid) => setPosts(p => p.filter(x => x.id !== pid))} />
                ))}
              </div>
            )
          ) : (
            <div className="mt-2 space-y-4 px-1">
              <div className="p-6 glass-panel rounded-[2rem] border-red-500/20 bg-red-500/5">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Trash2 size={18} className="text-red-400" /> Zona Crítica
                </h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  A exclusão da conta é permanente e removerá todos os seus dados do oceano ELO.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full text-white font-bold py-4 px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} Excluir Permanentemente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
