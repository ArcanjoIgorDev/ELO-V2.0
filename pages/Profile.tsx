import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { LogOut, Edit3, Grid, Users } from 'lucide-react';

export const ProfilePage = () => {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({ posts: 0, connections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      const loadStats = async () => {
        setLoading(true);
        const postsReq = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id);
        
        const connectionsReq = await supabase
          .from('connections')
          .select('id', { count: 'exact' })
          .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .eq('status', 'accepted');

        setStats({
          posts: postsReq.count || 0,
          connections: connectionsReq.count || 0
        });
        setLoading(false);
      };
      loadStats();
    }
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="min-h-full pb-24">
      {/* Header Abstrato */}
      <div className="h-48 bg-gradient-to-b from-ocean-dark to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 80 C 30 50 70 50 100 80 L 100 100 L 0 100 Z" fill="white" />
             <circle cx="20" cy="20" r="30" fill="white" fillOpacity="0.1" />
           </svg>
        </div>
      </div>

      <div className="px-5 -mt-20 relative z-10">
        <div className="glass-card rounded-[2rem] p-6 flex flex-col items-center animate-slide-up bg-midnight-900/80">
          <div className="relative -mt-16 mb-4">
            <div className="p-1.5 bg-midnight-950 rounded-full shadow-lg border border-white/10">
              <Avatar url={profile.avatar_url} alt={profile.username} size="xl" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
          <p className="text-ocean font-medium text-sm mb-4">@{profile.username}</p>
          
          <p className="text-center text-slate-400 text-sm leading-relaxed max-w-xs mb-6 font-medium">
            {profile.bio || "Explorando as profundezas do ELO. 🌊"}
          </p>

          <div className="flex w-full border-t border-white/5 pt-6">
            <div className="flex-1 flex flex-col items-center border-r border-white/5">
              <span className="text-xl font-bold text-white">{loading ? '-' : stats.posts}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Posts</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-xl font-bold text-white">{loading ? '-' : stats.connections}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Conexões</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center space-x-6 px-4 mb-4 border-b border-white/5">
            <button className="pb-3 border-b-2 border-ocean text-ocean font-bold text-sm flex items-center gap-2">
              <Grid size={18} />
              Posts
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 font-bold text-sm flex items-center gap-2 hover:text-slate-300 transition-colors">
              <Users size={18} />
              Conexões
            </button>
          </div>

          <div className="rounded-3xl border border-white/5 p-10 text-center bg-midnight-900/30">
            <p className="text-slate-500 font-medium text-sm">O histórico está submerso...</p>
          </div>
          
          <div className="mt-8 mb-4 flex justify-center">
             <button 
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 text-sm font-bold py-3 px-6 rounded-2xl hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Desconectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};