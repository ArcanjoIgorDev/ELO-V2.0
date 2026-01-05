import React, { useState } from 'react';
import { PostWithAuthor, CommentWithAuthor } from '../types';
import { Avatar } from './ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PostCardProps {
  post: PostWithAuthor;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  
  // Safety check: Se o post ou autor vierem quebrados do backend
  if (!post || !post.author) {
    return null; // Ou um placeholder, mas melhor esconder dados corrompidos
  }

  // Estados de Likes
  const [hasLiked, setHasLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  // Estados de Comentários
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Estados de Menu e Ações
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isAuthor = user?.id === post.user_id;

  // --- LÓGICA DE LIKE ---
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

  // --- LÓGICA DE COMENTÁRIOS ---
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

  // --- AÇÕES DO POST ---
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

  const handleShare = async () => {
    setIsSharing(true);
    const shareUrl = window.location.href; // Idealmente seria /post/:id
    const shareData = {
      title: 'ELO',
      text: `Post de @${post.author.username} no ELO`,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Link copiado!');
      }
    } catch (err) {
      console.log('Share falhou:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <article className="bg-midnight-900/40 backdrop-blur-md border border-white/5 mb-4 rounded-3xl p-5 transition-colors duration-300 hover:bg-midnight-900/60 hover:border-white/10 relative group">
      <div className="flex space-x-3.5">
        <div className="flex-shrink-0 pt-1">
          <Avatar url={post.author.avatar_url} alt={post.author.username} size="md" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-slate-100 text-[15px] truncate cursor-pointer hover:underline decoration-white/30">
                {post.author.full_name || post.author.username}
              </span>
              <div className="flex items-center text-slate-500 text-xs mt-0.5 gap-1 font-medium">
                <span>@{post.author.username}</span>
                <span className="text-slate-700">•</span>
                <time dateTime={post.created_at} className="hover:text-slate-400">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </time>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-500 hover:text-white transition-colors p-2 -mr-2 rounded-full hover:bg-white/5 active:bg-white/10"
              >
                <MoreHorizontal size={18} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-midnight-950 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-fade-in ring-1 ring-white/5">
                    {isAuthor && (
                      <button 
                        onClick={handleDeletePost}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Excluir
                      </button>
                    )}
                    <button className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5">
                      Copiar link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="mt-3 text-[15px] leading-relaxed text-slate-200 break-words whitespace-pre-wrap font-normal">
            {post.content}
          </div>

          {/* Ações */}
          <div className="mt-4 flex items-center justify-between max-w-[280px]">
            <button 
              onClick={handleLike}
              className={`group flex items-center gap-2 p-2 -ml-2 rounded-full transition-all duration-200 ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10'}`}
            >
              <Heart 
                size={20} 
                className={`transition-transform duration-300 ${hasLiked ? 'fill-current scale-110' : 'group-active:scale-90'}`} 
              />
              <span className="text-sm font-medium tabular-nums min-w-[1ch]">
                {likesCount > 0 ? likesCount : ''}
              </span>
            </button>

            <button 
              onClick={toggleComments}
              className={`group flex items-center gap-2 p-2 rounded-full transition-all duration-200 ${showComments ? 'text-ocean' : 'text-slate-500 hover:text-ocean hover:bg-ocean/10'}`}
            >
              <MessageCircle size={20} className="transition-transform group-active:scale-90" />
              <span className="text-sm font-medium tabular-nums min-w-[1ch]">
                {commentsCount > 0 ? commentsCount : ''}
              </span>
            </button>

            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="group flex items-center gap-2 p-2 rounded-full text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200 disabled:opacity-50"
            >
              <Share2 size={20} className={`transition-transform group-active:scale-90 ${isSharing ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Comentários */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
              <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {comments.length === 0 && commentsLoaded ? (
                  <p className="text-xs text-slate-600 text-center py-4">Seja o primeiro a comentar.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group/comment">
                       <Avatar url={comment.author?.avatar_url} alt={comment.author?.username || '?'} size="sm" />
                       <div className="flex-1">
                         <div className="bg-white/5 rounded-2xl rounded-tl-none p-3">
                            <span className="text-xs font-bold text-slate-300 mb-0.5 block">{comment.author?.username}</span>
                            <p className="text-sm text-slate-200 leading-snug">{comment.content}</p>
                         </div>
                         <div className="flex items-center gap-4 mt-1 ml-2">
                           <span className="text-[10px] text-slate-600">
                             {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                           </span>
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendComment} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  placeholder="Escreva sua resposta..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-midnight-950 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-ocean/50 transition-colors placeholder:text-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isCommenting}
                  className="absolute right-1.5 p-2 bg-ocean text-white rounded-full disabled:opacity-50 disabled:bg-slate-700 transition-all hover:bg-ocean-600 active:scale-90"
                >
                  {isCommenting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};