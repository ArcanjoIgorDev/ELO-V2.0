
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, ArrowRight, ShieldCheck, Clock, Zap, Globe, Smartphone } from 'lucide-react';

// Hook para detectar quando elemento entra na tela (Intersection Observer)
const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element); // Para de observar assim que ficar visível
      }
    }, options);

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options]);

  return [ref, isVisible] as const;
};

// Componente Wrapper para animação no scroll
interface RevealOnScrollProps {
  children?: React.ReactNode;
  delay?: number;
  className?: string;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ children, delay = 0, className = "" }) => {
  const options = useMemo(() => ({ threshold: 0.1 }), []); 
  const [ref, isVisible] = useOnScreen(options);

  return (
    <div 
      ref={ref} 
      className={`reveal-hidden ${isVisible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-200 font-sans selection:bg-ocean selection:text-white relative">
      
      {/* Background Ambience FIXO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-midnight-900 to-midnight-950" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-ocean-600/10 rounded-full blur-[120px] animate-float opacity-70" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] opacity-60" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-midnight-950/80 backdrop-blur-xl lp-fade-in">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-ocean text-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Waves size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ELO</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Entrar
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-white text-midnight-950 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Começar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          
          {/* Badge "Disponível para todos" */}
          <div className="lp-slide-up w-full flex justify-center mb-8" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ocean-300 hover:bg-white/10 transition-colors cursor-default backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocean-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ocean-500"></span>
              </span>
              Disponível para todos
            </div>
          </div>
          
          {/* Título Principal */}
          <div className="lp-slide-up w-full mb-6" style={{ animationDelay: '100ms' }}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Rede social, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 to-ocean-500 inline-block pb-1">
                não mídia social.
              </span>
            </h1>
          </div>
          
          {/* Descrição */}
          <div className="lp-slide-up w-full mb-10" style={{ animationDelay: '200ms' }}>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Recupere sua autonomia digital. Um feed puramente cronológico, sem algoritmos de retenção, sem anúncios invasivos. Apenas as conexões que você escolheu.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="lp-slide-up w-full flex justify-center" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-8 py-4 bg-ocean hover:bg-ocean-600 text-white font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] hover:shadow-[0_0_35px_rgba(14,165,233,0.4)] active:scale-95 flex items-center justify-center gap-3 group"
              >
                Criar conta gratuita
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-8 py-4 bg-midnight-800/50 hover:bg-midnight-800 text-slate-200 font-semibold rounded-2xl transition-all border border-white/5 hover:border-white/10 flex items-center justify-center backdrop-blur-sm"
              >
                Acessar existente
              </button>
            </div>
          </div>
        </div>

        {/* Bento Grid Features - Mantendo o efeito de scroll reveal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RevealOnScroll className="col-span-1 md:col-span-2">
            <div className="h-full p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Globe size={120} strokeWidth={1} />
               </div>
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                   <Clock size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">Tempo Real Cronológico</h3>
                 <p className="text-slate-400 leading-relaxed max-w-md">
                   Você vê o que acontece agora. Não o que um algoritmo acha que vai te viciar. O controle do seu feed volta para as suas mãos.
                 </p>
               </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="h-full p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors relative overflow-hidden group">
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
               <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                  <ShieldCheck size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Privacidade Real</h3>
               <p className="text-slate-400 text-sm leading-relaxed">
                 Sem rastreadores de terceiros. Seus dados não são nosso produto.
               </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div className="h-full p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors relative overflow-hidden group">
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors pointer-events-none"></div>
               <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-6">
                  <Zap size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Instantâneo</h3>
               <p className="text-slate-400 text-sm leading-relaxed">
                 Interações via WebSockets. Chats e notificações voam, sem refresh.
               </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="col-span-1 md:col-span-2" delay={300}>
            <div className="h-full p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors group relative overflow-hidden flex items-center">
               <div className="flex-1 relative z-10">
                 <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                   <Smartphone size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">App-Like Experience</h3>
                 <p className="text-slate-400 leading-relaxed max-w-sm">
                   Instalável como aplicativo nativo (PWA). Fluido, responsivo e desenhado para o toque. Funciona em iOS e Android.
                 </p>
               </div>
               <div className="hidden md:block w-48 h-full bg-midnight-950/50 rounded-2xl border border-white/5 relative translate-x-12 translate-y-8 rotate-[-6deg] shadow-2xl pointer-events-none">
                  <div className="p-4 space-y-3 opacity-50">
                    <div className="w-full h-32 bg-white/10 rounded-xl"></div>
                    <div className="w-3/4 h-4 bg-white/10 rounded-full"></div>
                    <div className="w-1/2 h-4 bg-white/10 rounded-full"></div>
                  </div>
               </div>
            </div>
          </RevealOnScroll>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 px-6 mt-12 bg-midnight-950 relative z-10">
        <RevealOnScroll delay={500}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Waves size={16} />
              <span className="font-bold text-sm tracking-wide">ELO NETWORK</span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Elo. Construído para humanos, não usuários.
            </p>
          </div>
        </RevealOnScroll>
      </footer>
    </div>
  );
};
