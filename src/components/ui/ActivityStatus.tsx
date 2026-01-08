import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserActivity } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityStatusProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ActivityStatus: React.FC<ActivityStatusProps> = ({ userId, size = 'md', showText = false }) => {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: 'size-2',
    md: 'size-2.5',
    lg: 'size-3'
  };

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          setActivity(data);
        } else {
          // Se não existe, criar registro inicial
          setActivity({
            user_id: userId,
            is_online: false,
            last_seen: new Date().toISOString(),
            status_message: null,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Erro ao buscar atividade:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();

    // Subscription realtime para mudanças de status
    const channel = supabase
      .channel(`activity_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activity',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setActivity(payload.new as UserActivity);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return null;

  const isOnline = activity?.is_online || false;
  const lastSeen = activity?.last_seen ? new Date(activity.last_seen) : null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full ${
          isOnline 
            ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse' 
            : 'bg-slate-600'
        } border-2 border-midnight-950`} />
        {isOnline && (
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-emerald-500 animate-ping opacity-75`} />
        )}
      </div>
      {showText && (
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {isOnline 
            ? 'Online' 
            : lastSeen 
              ? `Visto ${formatDistanceToNow(lastSeen, { addSuffix: true, locale: ptBR })}`
              : 'Offline'
          }
        </span>
      )}
    </div>
  );
};
