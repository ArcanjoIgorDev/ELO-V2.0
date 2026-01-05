
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Grid, Trash2, Activity, Camera, Loader2, UserPlus, MessageCircle, Clock, Check, ArrowLeft, MoreHorizontal, Ban } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostWithAuthor } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { profile: myProfile, signOut, user, refreshProfile } = useAuth();
  const { userId } = useParams(); 
  const navigate = useNavigate();

  // Estados
  const [displayProfile, setDisplayProfile] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, connections: 0 });
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  
  // Estados de Ação
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'blocked'>('none');
  const [isMyRequest, setIsMyRequest] = useState(false);
  const [processingConnect, setProcessingConnect] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lógica: Se userId na URL existir e for diferente do meu ID -> É Perfil de Outro
  const isOwnProfile = !userId || (user && userId === user.id);

  // 1. CARREGAR DADOS DO PERFIL
  useEffect(() => {
    const loadProfileData = async () => {
      setLoadingProfile(true);
      
      try {
        if (isOwnProfile) {
          // MEU PERFIL
          if (myProfile) {
            setDisplayProfile(myProfile);
            await loadStats(myProfile.id);
            await loadPosts(myProfile.id);
          }
        } else {
          // PERFIL DE OUTRO
          if (!userId) return;

          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (error || !data) {
             console.error(error);
             alert("Usuário não encontrado.");
             navigate('/feed');
             return;
          }
          setDisplayProfile(data);
          await loadStats(userId);
          await loadPosts(userId);

          // Checar Conexão
          if (user) {
             const { data: conn } = await supabase
              .from('connections')
              .select('*')
              .or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`)
              .maybeSingle();

             if (conn) {
               setConnectionStatus(conn.status);
               setIsMyRequest(conn.requester_id === user.id);
             } else {
               setConnectionStatus('none');
             }
          }
        }
      } catch (err) {
        console.error("Erro carregando perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [userId, isOwnProfile, myProfile, user]); 

  const loadStats = async (targetId: string) => {
    const postsReq = await supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', targetId);
    const connReq = await supabase
      .from('connections')
      .select('id', { count: 'exact' })
      .or(`requester_id.eq.${targetId},receiver_id.eq.${targetId}`)
      .eq('status', 'accepted');

    setStats({
      posts: postsReq.count || 0,
      connections: connReq.count || 0
    });
  };

  const loadPosts = async (targetId: string) => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*),
        likes(user_id),
        comments(count)
      `)
      .eq('user_id', targetId)
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

  // 2. AÇÕES DE CONEXÃO (ROBUSTAS)
  const handleConnect = async () => {
    if (!user || !displayProfile || processingConnect) return;
    setProcessingConnect(true);

    try {
      // Verifica conexão existente
      const { data: existingConn } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${displayProfile.id}),and(requester_id.eq.${displayProfile.id},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConn) {
         // Se já for amigo ou bloqueado, para.
         if (existingConn.status === 'accepted') return;
         if (existingConn.status === 'blocked') { alert('Não permitido'); return; }
         if (existingConn.status === 'pending' && existingConn.requester_id === user.id) return;

         // HARD DELETE para limpar qualquer estado 'declined' ou confuso
         await supabase.from('connections').delete().eq('id', existingConn.id);
      }

      // INSERT FRESH
      const { data: newConn, error: insertError } = await supabase
        .from('connections')
        .insert({
           requester_id: user.id,
           receiver_id: displayProfile.id,
           status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      if (newConn) {
          // Tenta criar notificação, ignora erro se RLS bloquear
          await supabase.from('notifications').insert({
            user_id: displayProfile.id,
            actor_id: user.id,
            type: 'request_received',
            reference_id: newConn.id
          });
          
          setConnectionStatus('pending');
          setIsMyRequest(true);
      }

    } catch (err: any) {
      console.error(err);
      alert("Erro ao conectar: " + err.message);
    } finally {
      setProcessingConnect(false);
    }
  };

  // 3. UPLOAD DE FOTO
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    
    setUploadingAvatar(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile(); // Atualiza contexto
      setDisplayProfile((prev: any) => ({ ...prev, avatar_url: publicUrl })); // Atualiza local
      
    } catch (error: any) {
      console.error(error);
      alert('Erro no upload. Tente uma imagem menor.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Isso apagará sua conta e dados para sempre. Continuar?")) {
      setIsDeleting(true);
      try {
        await supabase.from('profiles').delete().eq('id', user?.id);
        await signOut();
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  if (loadingProfile || !displayProfile) {
    return <div className="h-screen w-full flex items-center justify-center bg-midnight-950"><Loader2 className="animate-spin text-ocean" size={32} /></div>;
  }

  return (
    <div className="min-h-full pb-24 bg-midnight-950 animate-fade-in">
      {/* Header Visual */}
      <div className="h-40 bg-gradient-to-b from-ocean-900 to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        {!isOwnProfile && (
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-safe left-4 mt-4 p-2.5 bg-black/20 rounded-full text-white backdrop-blur border border-white/5 active:scale-95 transition-transform"
            >
                <ArrowLeft size={20} />
            </button>
        )}
      </div>

      <div className="px-5 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
           {/* Avatar Area */}
           <div className="relative group">
             <div className="p-1.5 bg-midnight-950 rounded-full shadow-2xl shadow-black/50 border border-white/10">
                <Avatar url={displayProfile.avatar_url} alt={displayProfile.username} size="xl" />
             </div>
             
             {isOwnProfile && (
               <>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-2 right-2 p-2 bg-ocean text-white rounded-full shadow-lg border-2 border-midnight-950 hover:bg-ocean-600 transition-colors active:scale-95 disabled:opacity-50"
                 >
                    {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
               </>
             )}
           </div>

           {/* Action Buttons */}
           <div className="mb-2">
             {isOwnProfile ? (
               <button 
                 onClick={() => signOut()} 
                 className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-full text-xs font-bold border border-white/5 transition-colors"
               >
                  Sair
               </button>
             ) : (
                <>
                  {connectionStatus === 'accepted' ? (
                     <button 
                        onClick={() => navigate(`/chat/${displayProfile.id}`)} 
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 border border-white/10 transition-colors"
                     >
                         <MessageCircle size={18} /> Mensagem
                     </button>
                  ) : connectionStatus === 'pending' ? (
                     <button className="bg-white/5 text-slate-400 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 cursor-default border border-white/5">
                         <Clock size={18} /> {isMyRequest ? 'Enviado' : 'Pendente'}
                     </button>
                  ) : connectionStatus === 'blocked' ? (
                     <button className="bg-red-500/10 text-red-400 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 cursor-not-allowed border border-red-500/20">
                         <Ban size={18} /> Bloqueado
                     </button>
                  ) : (
                     <button 
                       onClick={handleConnect}
                       disabled={processingConnect}
                       className="bg-ocean hover:bg-ocean-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                     >
                         {processingConnect ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                         Conectar
                     </button>
                  )}
                </>
             )}
           </div>
        </div>
        
        {/* Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{displayProfile.full_name || displayProfile.username}</h1>
          <p className="text-slate-500 font-medium text-sm">@{displayProfile.username}</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-sm">
            {displayProfile.bio || (isOwnProfile ? "Toque em Editar para adicionar uma bio." : "Membro do ELO.")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8 border-t border-white/5 pt-4">
          <div className="flex flex-col">
             <span className="text-lg font-bold text-white leading-none">{stats.posts}</span>
             <span className="text-xs text-slate-500 font-medium mt-1">Publicações</span>
          </div>
          <div className="flex flex-col">
             <span className="text-lg font-bold text-white leading-none">{stats.connections}</span>
             <span className="text-xs text-slate-500 font-medium mt-1">Conexões</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-white/5 mb-2 sticky top-14 bg-midnight-950 z-20">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'posts' ? 'text-white' : 'text-slate-500'}`}
          >
            <Grid size={16} />
            Publicações
            {activeTab === 'posts' && <div className="absolute bottom-0 w-full h-0.5 bg-ocean rounded-t-full"></div>}
          </button>
          
          {isOwnProfile && (
             <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'info' ? 'text-white' : 'text-slate-500'}`}
             >
               <Activity size={16} />
               Conta
               {activeTab === 'info' && <div className="absolute bottom-0 w-full h-0.5 bg-ocean rounded-t-full"></div>}
             </button>
          )}
        </div>

        {/* Content Area */}
        <div className="min-h-[300px]">
          {activeTab === 'posts' ? (
             loadingPosts ? (
               <div className="py-20 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" />Carregando posts...</div>
             ) : posts.length === 0 ? (
               <div className="py-20 text-center">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <Grid size={24} />
                 </div>
                 <p className="text-slate-500 text-sm">Nenhuma publicação ainda.</p>
               </div>
             ) : (
               <div className="divide-y divide-white/5 border-t border-white/5">
                 {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                 ))}
               </div>
             )
          ) : (
             <div className="mt-8 space-y-4 px-1">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                   <h3 className="text-white font-bold mb-1 text-sm">Zona de Perigo</h3>
                   <p className="text-xs text-slate-400 mb-4">Ações irreversíveis.</p>
                   
                   <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full text-red-400 hover:text-red-300 text-sm font-bold py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Excluir conta permanentemente
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
