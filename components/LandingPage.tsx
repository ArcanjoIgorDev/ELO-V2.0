import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, ArrowRight, ShieldCheck, Clock, Zap, Globe, Smartphone } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-200 font-sans selection:bg-ocean selection:text-white overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-midnight-900 to-midnight-950 -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-ocean-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-midnight-950/80 backdrop-blur-xl transition-all duration-300 animate-fade">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
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
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ocean-300 mb-8 hover:bg-white/10 transition-colors cursor-default animate-enter">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocean-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ocean-500"></span>
            </span>
            Disponível para todos
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-enter" style={{ animationDelay: '100ms' }}>
            Rede social, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 to-ocean-500">não mídia social.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-enter" style={{ animationDelay: '200ms' }}>
            Recupere sua autonomia digital. Um feed puramente cronológico, sem algoritmos de retenção, sem anúncios invasivos. Apenas as conexões que você escolheu.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-enter" style={{ animationDelay: '300ms' }}>
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

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-enter" style={{ animationDelay: '400ms' }}>
          {/* Card 1 */}
          <div className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
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

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors relative overflow-hidden group">
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
             <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                <ShieldCheck size={24} />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Privacidade Real</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Sem rastreadores de terceiros. Seus dados não são nosso produto.
             </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors relative overflow-hidden group">
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors"></div>
             <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-6">
                <Zap size={24} />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Instantâneo</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Interações via WebSockets. Chats e notificações voam, sem refresh.
             </p>
          </div>

          {/* Card 4 */}
          <div className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-midnight-900/40 border border-white/5 backdrop-blur-sm hover:border-ocean/20 transition-colors group relative overflow-hidden flex items-center">
             <div className="flex-1 relative z-10">
               <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                 <Smartphone size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">App-Like Experience</h3>
               <p className="text-slate-400 leading-relaxed max-w-sm">
                 Instalável como aplicativo nativo (PWA). Fluido, responsivo e desenhado para o toque. Funciona em iOS e Android.
               </p>
             </div>
             <div className="hidden md:block w-48 h-full bg-midnight-950/50 rounded-2xl border border-white/5 relative translate-x-12 translate-y-8 rotate-[-6deg] shadow-2xl">
                {/* Abstract Phone UI */}
                <div className="p-4 space-y-3 opacity-50">
                  <div className="w-full h-32 bg-white/10 rounded-xl"></div>
                  <div className="w-3/4 h-4 bg-white/10 rounded-full"></div>
                  <div className="w-1/2 h-4 bg-white/10 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 px-6 mt-12 bg-midnight-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Waves size={16} />
            <span className="font-bold text-sm tracking-wide">ELO NETWORK</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Elo. Construído para humanos, não usuários.
          </p>
        </div>
      </footer>
    </div>
  );
};