
import React, { useState, useEffect, useRef } from 'react';
import { PostWithAuthor, CommentWithAuthor } from '../types';
import { Avatar } from './ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2, Eye, X } from 'lucide-react';
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
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [viewersList, setViewersList] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

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
      .select(`*, author:profiles(id, username, avatar_url)`)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      // Como não temos tabela de like de comentarios no type.ts atualizado, simplificamos
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
        .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
        .select('*, author:profiles(id, username, avatar_url)')
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
    if (!isAuthor) return;
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

  const handleDeleteComment = async (commentId: string) => {
     if (!window.confirm('Excluir comentário?')) return;
     try {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) throw error;
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(prev => prev - 1);
     } catch (err) {
        alert("Erro ao excluir comentário.");
     }
  };

  const handleViewDetails = async () => {
    if (!isAuthor) return;
    setShowViewsModal(true);
    if (viewersList.length === 0) {
      setLoadingViewers(true);
      const { data } = await supabase
        .from('post_views')
        .select('created_at, user:profiles(id, username, avatar_url, full_name)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      if (data) setViewersList(data.map((v: any) => ({ ...v.user, viewed_at: v.created_at })));
      setLoadingViewers(false);
    }
  };

  return (
    <article className="mb-4 bg-midnight-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-sm backdrop-blur-sm mx-2 mt-2">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => goToProfile(e, post.user_id)}>
            <Avatar url={post.author.avatar_url} alt={post.author.username} size="md" />
            <div>
              <h3 className="font-bold text-white text-[15px] leading-tight hover:text-ocean transition-colors">
                {post.author.username}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                 <div className="absolute right-0 top-8 bg-midnight-950 border border-white/10 rounded-xl shadow-2xl z-20 w-40 overflow-hidden animate-fade-in py-1">
                   {isAuthor && (
                     <button onClick={handleDeletePost} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/5 text-sm flex items-center gap-2">
                       {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Excluir
                     </button>
                   )}
                   <button className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 text-sm flex items-center gap-2">
                     <Share2 size={14} /> Compartilhar
                   </button>
                 </div>
               </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words mb-4 pl-1">
          {post.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-2 border-t border-white/5">
           <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-medium transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}>
              <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
              <span>{likesCount || ''}</span>
           </button>
           
           <button onClick={toggleComments} className={`flex items-center gap-2 text-sm font-medium transition-colors ${showComments ? 'text-ocean' : 'text-slate-500 hover:text-ocean'}`}>
              <MessageCircle size={20} />
              <span>{commentsCount || ''}</span>
           </button>

           {isAuthor && (
             <button onClick={handleViewDetails} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-400 ml-auto">
                <Eye size={18} />
                <span className="text-xs">{viewsCount}</span>
             </button>
           )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="bg-black/20 p-4 border-t border-white/5 animate-slide-up">
           <div className="space-y-4 mb-4">
              {comments.map(c => (
                 <div key={c.id} className="flex gap-3 group">
                    <div onClick={(e) => goToProfile(e, c.user_id)} className="cursor-pointer">
                       <Avatar url={c.author?.avatar_url} alt="" size="sm" />
                    </div>
                    <div className="flex-1">
                       <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 relative">
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="font-bold text-xs text-white cursor-pointer" onClick={(e) => goToProfile(e, c.user_id)}>{c.author?.username}</span>
                             <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(c.created_at), { locale: ptBR })}</span>
                          </div>
                          <p className="text-sm text-slate-300">{c.content}</p>
                          {(user?.id === c.user_id || isAuthor) && (
                             <button 
                               onClick={() => handleDeleteComment(c.id)}
                               className="absolute -right-2 -top-2 bg-midnight-950 text-slate-500 hover:text-red-400 p-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                             >
                                <Trash2 size={10} />
                             </button>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
           
           <form onSubmit={handleSendComment} className="flex gap-2 relative">
             <input
               type="text"
               placeholder="Escreva um comentário..."
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               className="flex-1 bg-midnight-950 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-ocean/50"
             />
             <button type="submit" disabled={!newComment.trim() || isCommenting} className="absolute right-1 top-1 p-1.5 bg-ocean text-white rounded-full disabled:opacity-0 transition-opacity">
                {isCommenting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
             </button>
           </form>
        </div>
      )}

      {/* Views Modal */}
      {showViewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowViewsModal(false)}>
           <div className="bg-midnight-900 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[50vh]" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b border-white/10 flex justify-between items-center">
               <h3 className="font-bold text-white">Visualizações</h3>
               <button onClick={() => setShowViewsModal(false)}><X size={20} className="text-slate-400"/></button>
             </div>
             <div className="overflow-y-auto p-2 space-y-1">
               {loadingViewers ? <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-ocean"/></div> : 
                 viewersList.map(v => (
                   <div key={v.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer" onClick={(e) => {setShowViewsModal(false); goToProfile(e, v.id)}}>
                      <Avatar url={v.avatar_url} alt="" size="sm" />
                      <div className="flex-1 min-w-0">
                         <div className="font-bold text-white text-sm truncate">{v.username}</div>
                         <div className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(v.viewed_at), { locale: ptBR })}</div>
                      </div>
                   </div>
                 ))
               }
             </div>
           </div>
        </div>
      )}
    </article>
  );
};
