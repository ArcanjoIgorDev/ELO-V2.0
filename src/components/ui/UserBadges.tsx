import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserBadge } from '../../types';
import { Award, Star, TrendingUp, Users, Fire, Sparkles, Trophy } from 'lucide-react';

interface UserBadgesProps {
  userId: string;
  compact?: boolean;
}

const BADGE_CONFIG: { [key: string]: { label: string; icon: React.ReactNode; gradient: string; emoji: string; description: string } } = {
  first_post: {
    label: 'Primeira Onda',
    icon: <Star size={16} />,
    gradient: 'from-yellow-500 to-amber-500',
    emoji: '🌟',
    description: 'Primeira publicação'
  },
  first_connection: {
    label: 'Primeira Conexão',
    icon: <Users size={16} />,
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '🤝',
    description: 'Primeira conexão estabelecida'
  },
  popular_post: {
    label: 'Onda Popular',
    icon: <Fire size={16} />,
    gradient: 'from-orange-500 to-red-500',
    emoji: '🔥',
    description: 'Post com 100+ curtidas'
  },
  active_user: {
    label: 'Usuário Ativo',
    icon: <TrendingUp size={16} />,
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '⚡',
    description: '10+ publicações'
  },
  early_adopter: {
    label: 'Early Adopter',
    icon: <Sparkles size={16} />,
    gradient: 'from-purple-500 to-pink-500',
    emoji: '✨',
    description: 'Entre os primeiros usuários'
  },
  community_builder: {
    label: 'Construtor da Comunidade',
    icon: <Trophy size={16} />,
    gradient: 'from-amber-500 to-yellow-500',
    emoji: '🏆',
    description: '20+ conexões'
  },
  thought_leader: {
    label: 'Líder de Pensamento',
    icon: <Award size={16} />,
    gradient: 'from-violet-500 to-indigo-500',
    emoji: '💡',
    description: 'Influenciador da comunidade'
  }
};

export const UserBadges: React.FC<UserBadgesProps> = ({ userId, compact = false }) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (data) {
          setBadges(data);
        }
      } catch (err) {
        console.error('Erro ao buscar badges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    // Subscription realtime
    const channel = supabase
      .channel(`badges_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchBadges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading || badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {badges.slice(0, 3).map((badge) => {
          const config = BADGE_CONFIG[badge.badge_type] || BADGE_CONFIG.first_post;
          return (
            <div
              key={badge.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg backdrop-blur-sm group relative`}
              title={config.label}
            >
              <span className="text-xs leading-none">{config.emoji}</span>
            </div>
          );
        })}
        {badges.length > 3 && (
          <div className="px-2.5 py-1 rounded-xl glass-panel border-white/10">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              +{badges.length - 3}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Award size={18} className="text-primary" />
        <span className="text-sm font-black text-white uppercase tracking-widest">Conquistas</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => {
          const config = BADGE_CONFIG[badge.badge_type] || BADGE_CONFIG.first_post;
          return (
            <div
              key={badge.id}
              className={`group relative p-4 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer`}
              title={config.description}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl leading-none transform group-hover:scale-110 transition-transform">
                  {config.emoji}
                </span>
                <div>
                  <div className="text-xs font-black text-white uppercase tracking-widest mb-0.5">
                    {config.label}
                  </div>
                  <div className="text-[9px] font-black text-white/70 uppercase tracking-widest">
                    {new Date(badge.earned_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
