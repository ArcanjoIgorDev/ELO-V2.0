
import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('elo_cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1500); // Delay pequeno para não impactar LCP
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('elo_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-up">
      <div className="bg-midnight-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl max-w-md mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="bg-ocean/10 p-2 rounded-full shrink-0">
           <Cookie className="text-ocean" size={24} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-slate-200 font-medium">
            Usamos cookies essenciais para manter você conectado e garantir que o app funcione perfeitamente.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-ocean hover:bg-ocean-600 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-ocean/20 active:scale-95"
          >
            Aceitar
          </button>
          <button 
             onClick={() => setIsVisible(false)}
             className="md:hidden p-2.5 text-slate-400 hover:text-white"
          >
             <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
