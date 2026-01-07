
import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';

export const Header = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b-0">
      <div className="flex items-center justify-between p-4 px-5 max-w-lg mx-auto w-full">
        {/* Perfil / Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="relative group flex items-center gap-2"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100"></div>
            <Avatar url={profile?.avatar_url} alt="Perfil" size="sm" />
          </div>
        </button>

        {/* Logo / Home */}
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 group transform transition-all active:scale-95"
        >
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10">
            <span className="material-symbols-outlined text-white text-[18px]">all_inclusive</span>
          </div>
          <span className="text-xl font-black text-white tracking-tighter hidden sm:block">ELO</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all transform active:scale-90"
          aria-label="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
