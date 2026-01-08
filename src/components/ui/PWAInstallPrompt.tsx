import React, { useEffect, useState } from 'react';
import { X, Download, Sparkles } from 'lucide-react';
import { ELOLogo } from './Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Verifica se já foi rejeitado antes
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedDate = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Mostra novamente após 7 dias
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Escuta o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostra o prompt após 3 segundos
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Prompt Card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-[3rem] p-8 border-white/10 shadow-2xl animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 size-10 rounded-2xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-60 animate-pulse" />
            <div className="relative p-4 glass-panel rounded-[2rem] border-primary/20">
              <ELOLogo size={64} className="drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-black text-white tracking-tight">
              Instale o ELO
            </h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-[280px] mx-auto">
              Tenha uma experiência ainda melhor! Instale o app e tenha acesso rápido, notificações e muito mais.
            </p>
          </div>

          {/* Benefits */}
          <div className="w-full flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">Experiência Premium</p>
                <p className="text-xs text-slate-500 font-bold">Interface otimizada e fluida</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Download size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">Acesso Rápido</p>
                <p className="text-xs text-slate-500 font-bold">Abra direto da tela inicial</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={handleInstall}
              className="w-full h-14 rounded-[2rem] bg-gradient-to-r from-primary to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Download size={18} />
              Instalar Agora
            </button>
            <button
              onClick={handleDismiss}
              className="w-full h-12 rounded-[2rem] glass-button text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Agora Não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
