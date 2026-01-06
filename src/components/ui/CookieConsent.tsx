
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('elo_cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('elo_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up p-4 md:p-6 pb-safe">
      <div className="bg-midnight-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-2xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-5 ring-1 ring-white/5">
        
        <div className="bg-ocean/10 p-3 rounded-xl shrink-0 hidden md:block">
           <ShieldCheck className="text-ocean" size={24} />
        </div>
        
        <div className="flex-1">
          <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
            <ShieldCheck className="text-ocean md:hidden" size={16} />
            Privacidade e Dados
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed text-justify">
            Utilizamos cookies estritamente necessários para autenticação e segurança, garantindo a integridade da sua sessão. Ao continuar a utilizar o <strong>ELO Network</strong>, você concorda com o processamento de dados essenciais para o funcionamento da plataforma, conforme nossa Política de Privacidade.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-white text-black hover:bg-slate-200 text-xs font-bold py-3 px-6 rounded-lg transition-all active:scale-95 shadow-lg"
          >
            Concordar e Continuar
          </button>
          <button 
             onClick={() => setIsVisible(false)}
             className="md:hidden p-3 text-slate-500 hover:text-white"
          >
             <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
