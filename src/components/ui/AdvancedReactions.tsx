import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PostReaction } from '../../types';
import { Sparkles } from 'lucide-react';

interface AdvancedReactionsProps {
  postId: string;
  onReactionChange?: () => void;
}

type ReactionType = 'like' | 'love' | 'fire' | 'mind_blown' | 'support' | 'insightful';

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'like', emoji: '❤️', label: 'Curtir', color: 'from-rose-500 to-rose-600' },
  { type: 'love', emoji: '😍', label: 'Amar', color: 'from-pink-500 to-rose-500' },
  { type: 'fire', emoji: '🔥', label: 'Fogo', color: 'from-orange-500 to-red-500' },
  { type: 'mind_blown', emoji: '🤯', label: 'Explodir', color: 'from-yellow-500 to-orange-500' },
  { type: 'support', emoji: '🙌', label: 'Apoiar', color: 'from-blue-500 to-cyan-500' },
  { type: 'insightful', emoji: '💡', label: 'Insight', color: 'from-amber-500 to-yellow-500' }
];

export const AdvancedReactions: React.FC<AdvancedReactionsProps> = ({ postId, onReactionChange }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    if (!user || !postId) return;

    const fetchReactions = async () => {
      try {
        // Buscar todas as reações do post
        const { data: reactionsData } = await supabase
          .from('post_reactions')
          .select('reaction_type, user_id')
          .eq('post_id', postId);

        if (reactionsData) {
          // Contar reações por tipo
          const counts: { [key: string]: number } = {};
          const userReacts = new Set<ReactionType>();

          reactionsData.forEach((r) => {
            counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
            if (r.user_id === user.id) {
              userReacts.add(r.reaction_type as ReactionType);
            }
          });

          setReactions(counts);
          setUserReactions(userReacts);
        }
      } catch (err) {
        console.error('Erro ao buscar reações:', err);
      }
    };

    fetchReactions();

    // Subscription realtime
    const channel = supabase
      .channel(`reactions_${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
        filter: `post_id=eq.${postId}`
      }, () => {
        fetchReactions();
        onReactionChange?.();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user, onReactionChange]);

  const handleReaction = async (reactionType: ReactionType) => {
    if (!user || isReacting) return;

    const hasReaction = userReactions.has(reactionType);
    setIsReacting(true);

    try {
      if (hasReaction) {
        // Remover reação
        await supabase
          .from('post_reactions')
          .delete()
          .match({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      } else {
        // Adicionar reação (remove outras do mesmo usuário primeiro para manter apenas uma)
        await supabase
          .from('post_reactions')
          .delete()
          .match({ post_id: postId, user_id: user.id });

        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });

        // Criar notificação se não for próprio post
        const { data: postData } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (postData && postData.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: postData.user_id,
            actor_id: user.id,
            type: 'like_post',
            reference_id: postId
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Erro ao reagir:', err);
    } finally {
      setIsReacting(false);
      setShowPicker(false);
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const primaryReaction = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        className="relative flex items-center gap-2 h-12 px-4 rounded-2xl glass-button hover:bg-white/10 transition-all active:scale-95 group"
      >
        {primaryReaction ? (
          <>
            <span className="text-xl leading-none transform group-hover:scale-110 transition-transform">
              {REACTIONS.find(r => r.type === primaryReaction[0])?.emoji || '❤️'}
            </span>
            <span className="text-xs font-black tracking-widest text-slate-400 group-hover:text-white transition-colors">
              {totalReactions > 0 ? totalReactions : ''}
            </span>
          </>
        ) : (
          <>
            <Sparkles size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reagir</span>
          </>
        )}
      </button>

      {showPicker && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-3 glass-card rounded-[2rem] p-3 border-white/10 shadow-2xl z-50 animate-slide-up">
            <div className="flex gap-2">
              {REACTIONS.map((reaction) => {
                const count = reactions[reaction.type] || 0;
                const isActive = userReactions.has(reaction.type);

                return (
                  <button
                    key={reaction.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(reaction.type);
                    }}
                    disabled={isReacting}
                    className={`relative group flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${
                      isActive 
                        ? `bg-gradient-to-br ${reaction.color} shadow-xl scale-110` 
                        : 'hover:bg-white/5'
                    }`}
                    title={reaction.label}
                  >
                    <span className="text-2xl leading-none transform group-hover:scale-125 transition-transform">
                      {reaction.emoji}
                    </span>
                    {count > 0 && (
                      <span className={`text-[9px] font-black tracking-widest ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
