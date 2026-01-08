import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para rastrear e atualizar status de atividade do usuário
 * Atualiza automaticamente o status para online quando o componente monta
 * e marca como offline quando desmonta ou após inatividade
 */
export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let activityInterval: NodeJS.Timeout;
    let isActive = true;

    const updateActivity = async () => {
      if (!user || !isActive) return;

      try {
        await supabase
          .from('user_activity')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (err) {
        console.error('Erro ao atualizar atividade:', err);
      }
    };

    // Atualizar imediatamente ao montar
    updateActivity();

    // Atualizar a cada 30 segundos
    activityInterval = setInterval(updateActivity, 30000);

    // Atualizar em eventos de interação do usuário
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (isActive) {
        updateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Marcar como offline quando desmontar ou quando a página ficar invisível
    const handleVisibilityChange = () => {
      if (document.hidden) {
        supabase
          .from('user_activity')
          .update({
            is_online: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .then(() => {});
      } else {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      isActive = false;
      clearInterval(activityInterval);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Marcar como offline ao desmontar
      supabase
        .from('user_activity')
        .update({
          is_online: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .then(() => {});
    };
  }, [user]);
};
