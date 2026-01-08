
import React, { useState, useEffect, useRef } from 'react';
import { PostWithAuthor, CommentWithAuthor } from '../types';
import { Avatar } from './ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2, X, Command, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { AdvancedReactions } from './ui/AdvancedReactions';
import { PostVibe } from './ui/PostVibe';
import { ActivityStatus } from './ui/ActivityStatus';

interface PostCardProps {
  post: PostWithAuthor;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!post) return null;

  const author = post.author || {
    id: 'unknown',
    username: 'Usuário',
    avatar_url: null,
    full_name: 'Desconhecido'
  };

  const [hasLiked, setHasLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postVibe, setPostVibe] = useState<any>(post.vibe || null);

  const isAuthor = user?.id === post.user_id;
  const viewRegistered = useRef(false);

  // Buscar vibe do post
  useEffect(() => {
    const fetchVibe = async () => {
      try {
        const { data } = await supabase
          .from('post_vibes')
          .select('*')
          .eq('post_id', post.id)
          .maybeSingle();

        if (data) {
          setPostVibe(data);
        }
      } catch (err) {
        console.error('Erro ao buscar vibe:', err);
      }
    };

    if (!postVibe) {
      fetchVibe();
    }
  }, [post.id, postVibe]);

  useEffect(() => {
    if (user && !viewRegistered.current) {
      viewRegistered.current = true;
      const registerView = async () => {
        try {
          await supabase.from('post_views').insert({ post_id: post.id, user_id: user.id });
        } catch (e) { }
      };
      registerView();
    }
  }, [post.id, user]);

  // Subscription em tempo real para curtidas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`post_likes_${post.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `post_id=eq.${post.id}`
      }, async () => {
        // Atualiza contagem de curtidas em tempo real
        const { data: likesData } = await supabase
          .from('likes')
          .select('user_id')
          .eq('post_id', post.id);

        if (likesData) {
          setLikesCount(likesData.length);
          setHasLiked(likesData.some(l => l.user_id === user.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, user]);

  // Subscription em tempo real para comentários
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`post_comments_${post.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${post.id}`
      }, async () => {
        // Atualiza contagem de comentários em tempo real
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (count !== null) {
          setCommentsCount(count);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, user]);

  const goToProfile = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (targetId === 'unknown') return;
    navigate(targetId === user?.id ? '/profile' : `/profile/${targetId}`);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    const originalLikedState = hasLiked;
    const originalCount = likesCount;

    setHasLiked(!hasLiked);
    setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
      if (originalLikedState) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
        
        // Criar notificação de curtida (apenas se não for o próprio post)
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'like_post',
            reference_id: post.id
          }).catch(err => console.error('Erro ao criar notificação:', err));
        }
      }
    } catch (error) {
      setHasLiked(originalLikedState);
      setLikesCount(originalCount);
    } finally {
      setIsLiking(false);
    }
  };

  const fetchComments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('comments')
      .select(`*, author:profiles(id, username, avatar_url)`)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      const formattedComments = data.map((c: any) => ({
        ...c,
        author: c.author || { username: 'Usuário', avatar_url: null },
        likes_count: 0,
        user_has_liked: false
      }));
      setComments(formattedComments);
      setCommentsLoaded(true);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!commentsLoaded && !showComments) fetchComments();
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isCommenting) return;

    // Validação de conteúdo
    const trimmedComment = newComment.trim();
    if (trimmedComment.length === 0) {
      showToast('O comentário não pode estar vazio.', 'error');
      return;
    }

    if (trimmedComment.length > 500) {
      showToast('O comentário excede o limite de 500 caracteres.', 'error');
      return;
    }

    // Sanitização básica
    const sanitizedComment = trimmedComment
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');

    setIsCommenting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ 
          post_id: post.id, 
          user_id: user.id, 
          content: sanitizedComment 
        })
        .select('*, author:profiles(id, username, avatar_url)')
        .single();

      if (error) throw error;
      if (data) {
        const newCommentObj: CommentWithAuthor = {
          ...data,
          author: data.author || { username: 'Eu', avatar_url: user.user_metadata?.avatar_url } as any,
          likes_count: 0,
          user_has_liked: false
        };
        setComments([...comments, newCommentObj]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');
        
        // Criar notificação de comentário (apenas se não for o próprio post)
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'comment',
            reference_id: post.id
          }).catch(err => console.error('Erro ao criar notificação:', err));
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao enviar comentário.', 'error');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isAuthor) return;
    setIsDeleting(true);
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      if (onDelete) onDelete(post.id);
      showToast('Onda removida com sucesso', 'success');
    } catch (err) {
      setIsDeleting(false);
      showToast('Erro ao remover onda', 'error');
    }
  };

  return (
    <article className="glass-card rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:translate-y-[-6px] animate-fade-in relative group border-white/5">
      {/* Dynamic Glow */}
      <div className="absolute -top-24 -left-24 size-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      <div className="p-7 flex flex-col gap-5 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer group/author"
            onClick={(e) => goToProfile(e, post.user_id)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-2xl opacity-0 group-hover/author:opacity-100 transition-all duration-500" />
              <div className="p-[2px] glass-panel rounded-2xl border-white/10 group-hover/author:border-primary/40 transition-colors">
                <Avatar url={author.avatar_url} alt={author.username} size="md" className="relative rounded-[0.9rem]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-[15px] tracking-tight leading-none group-hover/author:text-primary transition-colors">
                  {author.full_name || author.username}
                </h3>
                <span className="material-symbols-outlined text-primary text-[14px] font-black">verified</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.1em]">@{author.username}</span>
                <span className="text-white/10">•</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR }) : 'agora'}
                </span>
                {post.user_id !== user?.id && (
                  <>
                    <span className="text-white/10">•</span>
                    <ActivityStatus userId={post.user_id} size="sm" />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="size-10 rounded-2xl glass-button flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-12 glass-panel p-2 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 w-52 animate-fade-in border-white/10 backdrop-blur-3xl">
                  {isAuthor && (
                    <button
                      onClick={handleDeletePost}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                      Apagar Onda
                    </button>
                  )}
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">
                    <Share2 size={16} /> Compartilhar
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">
                    <Bookmark size={16} /> Salvar Radar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vibe Indicator */}
        {postVibe && (
          <div className="flex items-start">
            <PostVibe vibe={postVibe} compact />
          </div>
        )}

        {/* Content */}
        <div className="text-[16px] text-slate-100 leading-relaxed font-bold tracking-tight whitespace-pre-wrap break-words">
          {post.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line || <br />}
              {i < post.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 pt-2">
          <AdvancedReactions postId={post.id} />

          <button
            onClick={toggleComments}
            className={`flex items-center gap-2.5 h-12 px-5 rounded-2xl transition-all active:scale-95 border ${showComments ? 'bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
          >
            <span className={`material-symbols-outlined text-[22px] transition-transform ${showComments ? 'fill-1' : ''}`}>
              forum
            </span>
            <span className="text-xs font-black tracking-widest">{commentsCount}</span>
          </button>

          <button className="ml-auto size-12 rounded-2xl glass-button flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="border-t border-white/5 bg-midnight-950/40 backdrop-blur-2xl p-7 animate-slide-up flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Respostas da Rede</h4>
            <div className="h-px flex-1 mx-4 bg-white/5" />
          </div>

          <div className="flex flex-col gap-6 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
            {comments.length === 0 && !isCommenting ? (
              <div className="py-12 text-center flex flex-col items-center gap-4 opacity-30">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">stream</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[150px] leading-relaxed">Nenhuma frequência detectada ainda</p>
              </div>
            ) : (
              comments.map((c, idx) => (
                <div key={c.id} className={`flex gap-4 group/comment animate-fade-in`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div
                    onClick={(e) => goToProfile(e, c.user_id)}
                    className="cursor-pointer shrink-0"
                  >
                    <div className="p-[1.5px] glass-panel rounded-xl group-hover/comment:border-primary/40 transition-colors">
                      <Avatar url={c.author?.avatar_url} alt="" size="sm" className="rounded-[0.6rem]" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-black text-white hover:text-primary cursor-pointer transition-colors"
                        onClick={(e) => goToProfile(e, c.user_id)}
                      >
                        {c.author?.username}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(c.created_at), { locale: ptBR })}
                      </span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl rounded-tl-none border-white/5 text-sm text-slate-300 leading-relaxed font-medium break-words">
                      {c.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line || <br />}
                          {i < c.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="flex items-end gap-3 relative z-10">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
              <input
                type="text"
                placeholder="Adicionar sua frequência..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full input-glass rounded-[1.8rem] pl-6 pr-14 py-5 text-sm font-bold text-white focus:outline-none relative z-10"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                className="absolute right-2.5 top-2.5 size-11 flex items-center justify-center rounded-[1.2rem] bg-primary text-white disabled:opacity-0 transition-all hover:bg-sky-400 active:scale-90 shadow-xl shadow-primary/20 z-20"
              >
                {isCommenting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
};

