
import React, { useState, useEffect, useRef } from 'react';
import { PostWithAuthor, CommentWithAuthor } from '../types';
import { Avatar } from './ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2, Repeat2, Eye, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: PostWithAuthor;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  if (!post || !post.author) return null;

  const [hasLiked, setHasLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [viewsCount, setViewsCount] = useState(post.views_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comments Logic
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Menu & Modals
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [viewersList, setViewersList] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const isAuthor = user?.id === post.user_id;
  const viewRegistered = useRef(false);

  // Registrar View (Uma vez por montagem/sessão)
  useEffect(() => {
    if (user && !viewRegistered.current) {
      viewRegistered.current = true;
      const registerView = async () => {
        try {
          // Tenta inserir view. Se já existir (pela constraint UNIQUE), o Supabase ignora ou retorna erro que ignoramos.
          // Não usamos 'upsert' para não atualizar o timestamp se já viu.
          await supabase.from('post_views').insert({
            post_id: post.id,
            user_id: user.id
          });
        } catch (e) {
          // Ignora erro de duplicidade
        }
      };
      registerView();
    }
  }, [post.id, user]);

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${post.user_id}`);
    }
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
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'like_post',
            reference_id: post.id
          });
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
      .select(`
        *,
        author:profiles(username, avatar_url),
        likes:comment_likes(user_id)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      const formattedComments = data.map((c: any) => ({
        ...c,
        likes_count: c.likes ? c.likes.length : 0,
        user_has_liked: c.likes ? c.likes.some((l: any) => l.user_id === user.id) : false
      }));
      setComments(formattedComments);
      setCommentsLoaded(true);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!commentsLoaded && !showComments) {
      fetchComments();
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isCommenting) return;

    setIsCommenting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select('*, author:profiles(username, avatar_url)')
        .single();

      if (error) throw error;
      if (data) {
        const newCommentObj: CommentWithAuthor = { 
          ...data, 
          author: data.author as any,
          likes_count: 0, 
          user_has_liked: false 
        };
        setComments([...comments, newCommentObj]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');

        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'comment',
            reference_id: post.id
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Excluir esta publicação permanentemente?')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      if (onDelete) onDelete(post.id);
    } catch (err: any) {
      alert('Erro ao excluir: ' + (err.message || 'Tente novamente.'));
      setIsDeleting(false);
    }
  };

  const handleViewDetails = async () => {
    if (!isAuthor) return; // Só autor vê lista
    setShowViewsModal(true);
    if (viewersList.length === 0) {
      setLoadingViewers(true);
      const { data } = await supabase
        .from('post_views')
        .select('created_at, user:profiles(id, username, avatar_url, full_name)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        // Remove duplicates visualmente caso existam e formata
        setViewersList(data.map((v: any) => ({ ...v.user, viewed_at: v.created_at })));
      }
      setLoadingViewers(false);
    }
  };

  return (
    <>
      <article className="border-b border-white/5 bg-midnight-950/40 backdrop-blur-sm py-5 px-5 hover:bg-white/[0.02] transition-colors relative">
        <div className="flex space-x-4">
          {/* Avatar Col */}
          <div className="flex-shrink-0 cursor-pointer" onClick={goToProfile}>
            <Avatar url={post.author.avatar_url} alt={post.author.username} size="md" />
          </div>
          
          {/* Content Col */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 overflow-hidden">
                <span 
                  onClick={goToProfile}
                  className="font-bold text-slate-100 text-[15px] truncate hover:text-ocean transition-colors cursor-pointer"
                >
                  {post.author.username}
                </span>
                <span className="text-slate-600 text-[10px]">•</span>
                <time className="text-slate-500 text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: false, locale: ptBR })} atrás
                </time>
              </div>
              
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="text-slate-500 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-6 mt-1 w-40 bg-midnight-900 border border-white/10 rounded-xl shadow-2xl z-20 py-1 animate-fade-in overflow-hidden">
                      {isAuthor && (
                        <button 
                          onClick={handleDeletePost}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 font-medium"
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Excluir post
                        </button>
                      )}
                      <button className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 font-medium flex items-center gap-2">
                        <Share2 size={14} /> Compartilhar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap font-normal break-words">
              {post.content}
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between max-w-[340px] text-slate-500">
              <button 
                onClick={handleLike}
                className={`group flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
              >
                <div className={`p-2 rounded-full transition-all active:scale-90 ${hasLiked ? '' : 'group-hover:bg-rose-500/10'}`}>
                  <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                </div>
                <span className="text-xs font-medium tabular-nums">{likesCount || ''}</span>
              </button>

              <button 
                onClick={toggleComments}
                className={`group flex items-center gap-1.5 transition-colors ${showComments ? 'text-ocean' : 'hover:text-ocean'}`}
              >
                 <div className={`p-2 rounded-full transition-all active:scale-90 ${showComments ? '' : 'group-hover:bg-ocean/10'}`}>
                  <MessageCircle size={18} />
                </div>
                <span className="text-xs font-medium tabular-nums">{commentsCount || ''}</span>
              </button>

              <button 
                onClick={handleViewDetails}
                className={`group flex items-center gap-1.5 transition-colors ${isAuthor ? 'hover:text-emerald-400 cursor-pointer' : 'cursor-default'}`}
              >
                 <div className={`p-2 rounded-full transition-all ${isAuthor ? 'group-hover:bg-emerald-400/10 active:scale-90' : ''}`}>
                   <Eye size={18} />
                 </div>
                 <span className="text-xs font-medium tabular-nums">{viewsCount}</span>
              </button>

              <button className="group flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                 <div className="p-2 rounded-full group-hover:bg-sky-400/10 transition-all active:scale-90">
                  <Share2 size={18} />
                 </div>
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in bg-midnight-950/30 -mx-5 px-5 pb-2">
                <div className="space-y-4 mb-4">
                  {comments.length === 0 && commentsLoaded && (
                    <p className="text-xs text-slate-500 italic text-center py-2">Nenhum comentário ainda.</p>
                  )}
                  {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                         <div className="shrink-0">
                           <Avatar url={comment.author?.avatar_url} alt={comment.author?.username || '?'} size="sm" />
                         </div>
                         <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-3 px-4">
                            <div className="flex items-baseline justify-between mb-1">
                               <span className="text-xs font-bold text-slate-100">{comment.author?.username}</span>
                               <span className="text-[10px] text-slate-500">
                                 {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR })}
                               </span>
                            </div>
                            <p className="text-sm text-slate-300 leading-normal">{comment.content}</p>
                         </div>
                      </div>
                  ))}
                </div>

                <form onSubmit={handleSendComment} className="flex gap-3 items-center sticky bottom-0">
                  <Avatar url={user?.user_metadata?.avatar_url || profile?.avatar_url} alt="Eu" size="sm" />
                  <div className="flex-1 relative bg-midnight-900 rounded-full border border-white/10 focus-within:border-ocean/50 transition-colors">
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 px-4 py-2.5 text-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={!newComment.trim() || isCommenting}
                      className="absolute right-1.5 top-1.5 p-1.5 bg-ocean text-white rounded-full disabled:opacity-0 transition-all hover:bg-ocean-600"
                    >
                      {isCommenting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Views List Modal */}
      {showViewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-midnight-900 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-midnight-950">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Eye size={18} className="text-emerald-400" />
                Visualizações
              </h3>
              <button onClick={() => setShowViewsModal(false)} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-2 flex-1 space-y-1">
              {loadingViewers ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-ocean" /></div>
              ) : viewersList.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Ninguém viu ainda... ou será que viram?</p>
              ) : (
                viewersList.map((viewer) => (
                  <div key={viewer.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors">
                    <Avatar url={viewer.avatar_url} alt={viewer.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{viewer.username}</p>
                      <p className="text-xs text-slate-500 truncate">{viewer.full_name}</p>
                    </div>
                    <span className="text-[10px] text-slate-600">
                      {formatDistanceToNow(new Date(viewer.viewed_at), { locale: ptBR })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
