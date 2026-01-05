
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, ArrowRight, Heart, MessageCircle, Send, Plus, Search, Bell, User, LogIn } from 'lucide-react';

// --- UTILITÁRIOS DE ANIMAÇÃO ---
const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, options);

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options]);

  return [ref, isVisible] as const;
};

const RevealOnScroll: React.FC<{ children?: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
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

// --- MOCK COMPONENTS (UI VISUALMENTE IDÊNTICA AO APP) ---

const MockPostCard = () => (
  <div className="bg-midnight-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 w-full max-w-sm shadow-[0_0_40px_rgba(14,165,233,0.05)]">
    <div className="flex space-x-3.5">
      <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 overflow-hidden border border-slate-700">
        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Sarah" alt="Sarah" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-slate-100 text-[15px]">Sarah Miller</span>
          <div className="flex items-center text-slate-500 text-xs mt-0.5 gap-1 font-medium">
            <span>@sarah_m</span>
            <span className="text-slate-700">•</span>
            <span>há 2 min</span>
          </div>
        </div>
        <div className="mt-3 text-[15px] leading-relaxed text-slate-200 font-normal">
          Finalmente encontrei um lugar onde o feed é real. Sem algoritmos decidindo meu dia. 🌊 #ELO
        </div>
        <div className="mt-4 flex items-center gap-6 text-slate-500">
          <div className="flex items-center gap-2 text-rose-500">
            <Heart size={20} className="fill-current" />
            <span className="text-sm font-medium">24</span>
          </div>
          <div className="flex items-center gap-2 hover:text-ocean transition-colors">
            <MessageCircle size={20} />
            <span className="text-sm font-medium">5</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MockChat = () => (
  <div className="bg-midnight-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 w-full max-w-sm shadow-[0_0_40px_rgba(14,165,233,0.05)] flex flex-col gap-3">
    {/* Header Fake */}
    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
       <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Dav" alt="David" />
       </div>
       <span className="text-sm font-bold text-white">David</span>
    </div>
    
    {/* Mensagens */}
    <div className="space-y-3 py-2">
      <div className="flex justify-start">
        <div className="bg-white/10 text-slate-200 px-4 py-2 rounded-2xl rounded-tl-none text-xs max-w-[80%]">
          Viu a nova feature de Ecos?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-ocean text-white px-4 py-2 rounded-2xl rounded-tr-none text-xs max-w-[80%]">
          Sim! Muito fluido, adorei.
        </div>
      </div>
    </div>

    {/* Input Fake */}
    <div className="flex gap-2 mt-1">
      <div className="flex-1 bg-midnight-950 border border-white/10 rounded-full h-8"></div>
      <div className="w-8 h-8 bg-ocean rounded-full flex items-center justify-center">
        <Send size={14} className="text-white" />
      </div>
    </div>
  </div>
);

const MockNotification = () => (
  <div className="bg-midnight-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 w-full max-w-sm shadow-[0_0_40px_rgba(14,165,233,0.05)] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Bell size={16} className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Atividade Recente</span>
      </div>
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10">
               <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Julia" alt="" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-midnight-950 rounded-full p-0.5 border border-white/10">
               <Heart size={10} className="text-rose-500 fill-current" />
            </div>
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">Julia</span> curtiu sua publicação.
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10">
               <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Marc" alt="" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-midnight-950 rounded-full p-0.5 border border-white/10">
               <MessageCircle size={10} className="text-ocean fill-current" />
            </div>
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">Marcos</span> comentou: "Exatamente isso!"
          </div>
        </div>
      </div>
  </div>
);

// --- MAIN LANDING PAGE ---

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-200 font-sans selection:bg-ocean selection:text-white relative overflow-x-hidden">
      
      {/* Ambience Global */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-midnight-900 to-midnight-950" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-ocean-600/5 rounded-full blur-[120px] animate-float opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[100px] opacity-40" />
      </div>

      {/* Navbar Fixa e Consolidada */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-midnight-950/90 backdrop-blur-xl transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 bg-ocean text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all">
              <Waves size={20} strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-ocean-300 transition-colors">ELO</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => navigate('/auth')}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 py-2"
            >
              <LogIn size={16} className="hidden sm:block" />
              Entrar
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-ocean hover:bg-ocean-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg shadow-ocean/20 hover:shadow-ocean/30 flex items-center gap-2"
            >
              Começar
              <ArrowRight size={16} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          
          <div className="lp-slide-up w-full flex justify-center mb-8" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ocean-300 hover:bg-white/10 transition-colors cursor-default backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocean-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ocean-500"></span>
              </span>
              Acesso liberado
            </div>
          </div>
          
          <div className="lp-slide-up w-full mb-6" style={{ animationDelay: '100ms' }}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Conexões reais, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 to-ocean-500 inline-block pb-1">
                ordem natural.
              </span>
            </h1>
          </div>
          
          <div className="lp-slide-up w-full mb-10" style={{ animationDelay: '200ms' }}>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Uma rede social desenhada para a clareza. Sem algoritmos viciantes, apenas o que você escolhe ver, quando acontece.
            </p>
          </div>

          <div className="lp-slide-up w-full flex justify-center" style={{ animationDelay: '300ms' }}>
             <button 
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-ocean hover:bg-ocean-600 text-white font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] hover:shadow-[0_0_35px_rgba(14,165,233,0.4)] active:scale-95 flex items-center gap-3 group"
            >
              Criar minha conta
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* SHOWCASE SECTION - MOCKUPS REAIS */}
        <div className="space-y-24 mt-20">
          
          {/* Feature 1: The Feed */}
          <RevealOnScroll className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 text-center md:text-left order-2 md:order-1">
               <h3 className="text-3xl font-bold text-white mb-4">Feed Cronológico Puro</h3>
               <p className="text-slate-400 text-lg leading-relaxed mb-6">
                 Veja as publicações na ordem exata em que aconteceram. Sem manipulação, sem "sugeridos para você". O controle do seu tempo volta para suas mãos.
               </p>
               <div className="flex items-center gap-4 justify-center md:justify-start text-ocean-300 text-sm font-medium">
                 <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-ocean"></div>Tempo real</div>
                 <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-ocean"></div>Sem anúncios</div>
               </div>
            </div>
            <div className="flex-1 order-1 md:order-2 flex justify-center relative">
               <div className="absolute inset-0 bg-ocean-500/10 blur-[80px] rounded-full pointer-events-none"></div>
               <div className="relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                 <MockPostCard />
               </div>
            </div>
          </RevealOnScroll>

          {/* Feature 2: Realtime Chat */}
          <RevealOnScroll className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 flex justify-center relative">
               <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
               <div className="relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                 <MockChat />
               </div>
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-3xl font-bold text-white mb-4">Conversas Instantâneas</h3>
               <p className="text-slate-400 text-lg leading-relaxed mb-6">
                 Mensagens diretas criptografadas e instantâneas. A interface é limpa, focada apenas na conversa, sem distrações visuais desnecessárias.
               </p>
            </div>
          </RevealOnScroll>

          {/* Feature 3: Activity & Identity */}
          <RevealOnScroll className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
             <div className="flex-1 text-center md:text-left order-2 md:order-1">
               <h3 className="text-3xl font-bold text-white mb-4">Você no Controle</h3>
               <p className="text-slate-400 text-lg leading-relaxed mb-6">
                 Personalize seu perfil, gerencie suas conexões e acompanhe suas notificações de forma intuitiva. Tudo desenhado para ser fluido e responsivo.
               </p>
            </div>
            <div className="flex-1 order-1 md:order-2 flex justify-center relative">
               <div className="absolute inset-0 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
               <div className="relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                 <MockNotification />
               </div>
            </div>
          </RevealOnScroll>
        
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 px-6 mt-12 bg-midnight-950 relative z-10">
        <RevealOnScroll delay={100}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Waves size={16} />
              <span className="font-bold text-sm tracking-wide">ELO NETWORK</span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Elo. Construído para humanos.
            </p>
          </div>
        </RevealOnScroll>
      </footer>
    </div>
  );
};
