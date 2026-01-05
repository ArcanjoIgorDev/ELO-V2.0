import React from 'react';
import { LogOut, Waves } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex-none z-40 w-full pt-safe bg-midnight-950/50">
      <div className="glass h-14 w-full">
        <div className="max-w-lg mx-auto h-full flex items-center justify-between px-5">
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="bg-ocean text-white p-1.5 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Waves size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">ELO</span>
          </button>

          <button 
            onClick={() => signOut()}
            className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 active:scale-90"
            aria-label="Sair"
          >
            <LogOut size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};