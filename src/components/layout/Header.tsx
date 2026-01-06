
import React from 'react';
import { LogOut } from 'lucide-react'; // Waves removido
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { ELOLogo } from '../ui/Logo';

export const Header = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex-none z-40 w-full pt-safe bg-midnight-950/80 backdrop-blur-md border-b border-white/5">
      <div className="h-16 w-full flex items-center justify-between px-5 max-w-lg mx-auto">

        {/* Esquerda: Avatar do Perfil */}
        <button
          onClick={() => navigate('/profile')}
          className="active:scale-95 transition-transform p-0.5 rounded-full border border-white/10 hover:border-ocean/50"
        >
          <Avatar url={profile?.avatar_url} alt="Perfil" size="sm" />
        </button>

        {/* Centro: Logo */}
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center space-x-2.5 group cursor-pointer active:scale-95 transition-transform absolute left-1/2 -translate-x-1/2"
        >
          <div className="p-1 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.15)] group-hover:shadow-[0_0_30px_rgba(14,165,233,0.25)] transition-all bg-white/5 border border-white/5">
            <ELOLogo size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans hidden sm:block">ELO</span>
        </button>

        {/* Direita: Sair */}
        <button
          onClick={() => signOut()}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 active:scale-90"
          aria-label="Sair"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
