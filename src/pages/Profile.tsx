
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Grid, Trash2, Activity, Camera, Loader2, UserPlus, MessageCircle, Clock, Check, ArrowLeft, MoreHorizontal, Ban, X, UserMinus, Edit3, LogOut, Share2, Award, Zap } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostWithAuthor } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();

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
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnProfile = !userId || (user && userId === user.id);
  const targetId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    if (!targetId) return;

    const loadProfileData = async () => {
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
      showToast('Solicitação enviada!');
    } catch (err: any) {
      showToast('Erro ao conectar.', 'error');
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
      showToast('Conexão estabelecida!');
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
      showToast('Conexão removida');
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
      showToast('Avatar atualizado!');
    } catch (error) {
      showToast('Erro no upload.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    setUploadingCover(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
    try {
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
      setDisplayProfile((prev: any) => ({ ...prev, cover_url: publicUrl }));
      showToast('Capa atualizada!');
    } catch (error) {
      showToast('Erro no upload da capa.', 'error');
    } finally {
      setUploadingCover(false);
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
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="size-20 glass-card rounded-[2.5rem] flex items-center justify-center border-primary/20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-white font-black text-lg tracking-tight">Carregando Perfil</p>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Sincronizando com o Oceano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-32 animate-fade-in" onClick={() => setShowUnfriendMenu(false)}>
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          currentName={displayProfile.full_name || ''}
          currentBio={displayProfile.bio || ''}
        />
      )}

      {/* Cover Area */}
      <div className="h-64 bg-midnight-900 relative overflow-hidden">
        {displayProfile.cover_url ? (
          <img src={displayProfile.cover_url} className="w-full h-full object-cover" alt="Cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-blue-600/20 to-transparent">
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-midnight-950 to-transparent" />
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-midnight-950/50 to-transparent" />
            {/* Animated Bubbles */}
            <div className="absolute top-1/4 left-1/4 size-32 bg-primary/20 blur-[100px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 size-40 bg-blue-500/10 blur-[120px] rounded-full animate-float" />
          </div>
        )}

        <div className="absolute top-8 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="size-12 glass-button rounded-2xl flex items-center justify-center text-white backdrop-blur-3xl border-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
        </div>

        {isOwnProfile && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
              disabled={uploadingCover}
              className="absolute bottom-6 right-6 size-10 glass-button rounded-xl flex items-center justify-center text-white backdrop-blur-3xl border-white/10 opacity-70 hover:opacity-100 transition-all active:scale-90"
            >
              {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <Camera size={18} />}
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
          </>
        )}
      </div>

      <div className="px-5 -mt-20 relative z-10 max-w-lg mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div className="relative group">
            <div className="p-1 glass-panel rounded-[2.5rem] bg-midnight-950 p-[3px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <Avatar url={displayProfile.avatar_url} alt={displayProfile.username} size="xl" className="rounded-[2.3rem] border-white/10" />
            </div>
            {isOwnProfile && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 size-10 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 border-4 border-midnight-950 hover:bg-sky-400 transition-all active:scale-90 disabled:opacity-50 z-20 flex items-center justify-center"
                >
                  {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <span className="material-symbols-outlined text-[18px]">photo_camera</span>}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="h-12 px-6 glass-button rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 active:scale-95"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  onClick={() => signOut()}
                  className="size-12 rounded-2xl glass-button text-red-400 flex items-center justify-center hover:bg-red-500/10 active:scale-90"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex gap-3 relative">
                {connectionState === 'accepted' ? (
                  <>
                    <button
                      onClick={() => navigate(`/chat/${displayProfile.id}`)}
                      className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 active:scale-95"
                    >
                      <MessageCircle size={16} /> Mensagem
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUnfriendMenu(!showUnfriendMenu); }}
                      className="size-12 glass-button rounded-2xl flex items-center justify-center text-white"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {showUnfriendMenu && (
                      <div className="absolute right-0 top-14 glass-panel rounded-[2rem] shadow-2xl z-20 w-52 overflow-hidden animate-fade-in border-white/10 p-1.5 backdrop-blur-3xl">
                        <button
                          onClick={removeConnection}
                          className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors"
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
                    className="h-12 px-6 glass-button rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-red-400 active:scale-95"
                  >
                    {processingConnect ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Aguardando
                  </button>
                ) : connectionState === 'received_pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={acceptRequest}
                      disabled={processingConnect}
                      className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 active:scale-95"
                    >
                      <Check size={16} /> Aceitar
                    </button>
                    <button
                      onClick={removeConnection}
                      disabled={processingConnect}
                      className="size-12 glass-button rounded-2xl text-red-400 flex items-center justify-center hover:bg-red-500/10"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={sendFriendRequest}
                    disabled={processingConnect}
                    className="h-12 px-10 bg-white text-midnight-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-white/5 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                  >
                    {processingConnect ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={3} />} Conectar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">{displayProfile.full_name || displayProfile.username}</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">@{displayProfile.username}</p>
              <span className="material-symbols-outlined text-primary text-[14px] font-black">verified</span>
            </div>
          </div>

          <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-md whitespace-pre-line bg-white/5 p-5 rounded-3xl border border-white/5">
            {displayProfile.bio || (isOwnProfile ? "Escreva algo sobre você..." : "Este membro prefere manter o mistério.")}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Award size={12} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Fundador ELO</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Zap size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.1em]">Elite Member</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-10">
          <div className="flex-1 glass-card py-5 px-4 rounded-[2rem] flex flex-col items-center gap-1 border-white/10 shadow-xl">
            <span className="text-2xl font-black text-white tracking-tighter">{stats.posts}</span>
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Ondas</span>
          </div>
          <div className="flex-1 glass-card py-5 px-4 rounded-[2rem] flex flex-col items-center gap-1 border-white/10 shadow-xl">
            <span className="text-2xl font-black text-white tracking-tighter">{stats.connections}</span>
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Elo Connects</span>
          </div>
        </div>

        <div className="flex items-center glass-panel p-1.5 mb-8 sticky top-24 z-20 rounded-[1.8rem]">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all rounded-[1.4rem] ${activeTab === 'posts' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            <Grid size={14} /> Publicações
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all rounded-[1.4rem] ${activeTab === 'info' ? 'bg-midnight-900 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
              <Activity size={14} /> Definições
            </button>
          )}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'posts' ? (
            loadingPosts ? (
              <div className="py-20 text-center flex flex-col items-center gap-6">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sintonizando frequências...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-24 text-center glass-card rounded-[3rem] p-10 flex flex-col items-center gap-6 border-dashed border-white/10">
                <div className="size-20 rounded-[2.5rem] bg-midnight-900 flex items-center justify-center text-slate-800 rotate-6">
                  <Grid size={32} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-white tracking-tight">Vazio Absoluto</h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-[220px]">Ainda não há ondas emitidas neste canal.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 px-1 pb-20">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onDelete={(pid) => setPosts(p => p.filter(x => x.id !== pid))} />
                ))}
              </div>
            )
          ) : (
            <div className="mt-2 space-y-6 px-1">
              <div className="p-8 glass-card rounded-[3rem] border-red-500/10 bg-red-500/5 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined text-[32px]">warning</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white font-black text-lg tracking-tight">Zona de Exclusão</h3>
                    <p className="text-red-400/60 text-[10px] font-black uppercase tracking-[0.2em]">Atenção: Ação Irreversível</p>
                  </div>
                </div>

                <p className="text-slate-500 text-sm font-bold leading-relaxed">
                  A exclusão da conta removerá permanentemente todos os seus dados, conexões e publicações do ecossistema ELO.
                </p>

                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full h-16 rounded-[2rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />} Excluir Perfil ELO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
