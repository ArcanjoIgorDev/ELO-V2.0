
import React, { useState, useEffect, useRef } from 'react';
import { PostWithAuthor, CommentWithAuthor } from '../types';
import { Avatar } from './ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2, X } from 'lucide-react';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!post || !post.author) return null;

  const [hasLiked, setHasLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // UI States
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.id === post.user_id;
  const viewRegistered = useRef(false);

  useEffect(() => {
    if (user && !viewRegistered.current) {
      viewRegistered.current = true;
      const registerView = async () => {
        try {
          await supabase.from('post_views').insert({ post_id: post.id, user_id: user.id });
        } catch (e) {}
      };
      registerView();
    }
  }, [post.id, user]);

  const goToProfile = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    navigate(targetId === user?.id ? '/profile' : `/profile/${targetId}`);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    // Optimistic UI
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
          await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'like_post', reference_id: post.id });
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

    setIsCommenting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
        .select('*, author:profiles(id, username, avatar_url)')
        .single();

      if (error) throw error;
      if (data) {
        const newCommentObj: CommentWithAuthor = { ...data, author: data.author as any, likes_count: 0, user_has_liked: false };
        setComments([...comments, newCommentObj]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');
        
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'comment', reference_id: post.id });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isAuthor || !window.confirm('Excluir esta publicação permanentemente?')) return;
    setIsDeleting(true);
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      setIsDeleting(false);
    }
  };

  return (
    <article className="mb-4 bg-gradient-to-br from-midnight-900/40 to-midnight-950/60 border-b border-white/5 sm:border sm:rounded-3xl sm:shadow-lg backdrop-blur-md overflow-hidden animate-fade-in relative z-10">
      <div className="p-5">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={(e) => goToProfile(e, post.user_id)}>
            <div className="ring-2 ring-transparent group-hover:ring-ocean/50 rounded-full transition-all">
               <Avatar url={post.author.avatar_url} alt={post.author.username} size="md" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-[15px] leading-tight group-hover:text-ocean transition-colors">
                {post.author.username}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                 <div className="absolute right-0 top-8 bg-midnight-950 border border-white/10 rounded-xl shadow-2xl z-20 w-40 overflow-hidden py-1">
                   {isAuthor && (
                     <button onClick={handleDeletePost} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/5 text-sm flex items-center gap-2 font-medium">
                       {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Excluir
                     </button>
                   )}
                   <button className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 text-sm flex items-center gap-2 font-medium">
                     <Share2 size={14} /> Compartilhar
                   </button>
                 </div>
               </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words mb-4">
          {post.content}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-6 pt-1">
           <button 
              onClick={handleLike} 
              className={`flex items-center gap-2 text-sm font-semibold transition-all active:scale-90 p-2 -ml-2 rounded-full hover:bg-white/5
                ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}
           >
              <Heart size={20} className={hasLiked ? 'fill-current' : ''} strokeWidth={2.5} />
              <span>{likesCount || ''}</span>
           </button>
           
           <button 
              onClick={toggleComments} 
              className={`flex items-center gap-2 text-sm font-semibold transition-all active:scale-90 p-2 rounded-full hover:bg-white/5
                ${showComments ? 'text-ocean' : 'text-slate-500 hover:text-ocean'}`}
           >
              <MessageCircle size={20} strokeWidth={2.5} />
              <span>{commentsCount || ''}</span>
           </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-black/20 p-4 border-t border-white/5 animate-slide-up">
           <div className="space-y-4 mb-5">
              {comments.map(c => (
                 <div key={c.id} className="flex gap-3 group">
                    <div onClick={(e) => goToProfile(e, c.user_id)} className="cursor-pointer shrink-0 mt-0.5">
                       <Avatar url={c.author?.avatar_url} alt="" size="sm" />
                    </div>
                    <div className="flex-1">
                       <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 relative hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="font-bold text-xs text-slate-200 cursor-pointer" onClick={(e) => goToProfile(e, c.user_id)}>{c.author?.username}</span>
                             <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(c.created_at), { locale: ptBR })}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-snug">{c.content}</p>
                          {(user?.id === c.user_id || isAuthor) && (
                             <button 
                               onClick={() => {/* handleDelete */}}
                               className="absolute right-2 top-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                <X size={12} />
                             </button>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
           
           <form onSubmit={handleSendComment} className="flex gap-2 relative items-end">
             <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-white/10 overflow-hidden">
                <img src={user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-midnight-950 border border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-ocean/50 focus:ring-1 focus:ring-ocean/50 transition-all placeholder:text-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isCommenting} 
                  className="absolute right-1 top-1 p-1.5 bg-ocean text-white rounded-xl disabled:opacity-0 transition-all hover:bg-ocean-600 shadow-lg shadow-ocean/20"
                >
                   {isCommenting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
             </div>
           </form>
        </div>
      )}
    </article>
  );
};
