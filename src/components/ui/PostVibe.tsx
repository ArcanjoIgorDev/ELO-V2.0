import React from 'react';
import { PostVibe as PostVibeType } from '../../types';
import { Sparkles, Heart, Zap, TrendingUp, Waves, Brain, HelpCircle } from 'lucide-react';

interface PostVibeProps {
  vibe: PostVibeType;
  compact?: boolean;
}

const VIBE_CONFIG: { [key: string]: { label: string; Icon: React.ComponentType<{ size?: number }>; gradient: string; emoji: string } } = {
  positive: {
    label: 'Positivo',
    Icon: Heart,
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '✨'
  },
  neutral: {
    label: 'Neutro',
    Icon: Waves,
    gradient: 'from-slate-500 to-slate-600',
    emoji: '💭'
  },
  contemplative: {
    label: 'Contemplativo',
    Icon: Brain,
    gradient: 'from-indigo-500 to-purple-500',
    emoji: '🤔'
  },
  energetic: {
    label: 'Energético',
    Icon: Zap,
    gradient: 'from-orange-500 to-red-500',
    emoji: '⚡'
  },
  calm: {
    label: 'Calmo',
    Icon: Waves,
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '🌊'
  },
  excited: {
    label: 'Empolgado',
    Icon: TrendingUp,
    gradient: 'from-yellow-500 to-orange-500',
    emoji: '🎉'
  },
  motivational: {
    label: 'Motivacional',
    Icon: Sparkles,
    gradient: 'from-amber-500 to-yellow-500',
    emoji: '💪'
  },
  curious: {
    label: 'Curioso',
    Icon: HelpCircle,
    gradient: 'from-violet-500 to-purple-500',
    emoji: '🔍'
  }
};

export const PostVibe: React.FC<PostVibeProps> = ({ vibe, compact = false }) => {
  const config = VIBE_CONFIG[vibe.vibe_type] || VIBE_CONFIG.neutral;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg backdrop-blur-sm`}>
        <span className="text-sm leading-none">{config.emoji}</span>
        <span className="text-[9px] font-black text-white uppercase tracking-widest">
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl border border-white/20 backdrop-blur-sm`}>
        <div className="flex items-center justify-center size-10 rounded-xl bg-white/20 backdrop-blur-sm">
          <span className="text-xl leading-none">{config.emoji}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-white uppercase tracking-widest">
              {config.label}
            </span>
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
              {Math.round(vibe.confidence * 100)}% confiança
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-white rounded-full transition-all duration-500`}
              style={{ width: `${vibe.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
