
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Mail, Radio } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col ocean-bg overflow-x-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" />
      <div className="fixed bottom-0 right-[-10%] w-[60vw] h-[50vh] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b-0">
        <div className="flex items-center justify-between p-4 px-5 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[20px]">all_inclusive</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ELO</span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center justify-center h-10 px-4 rounded-xl hover:bg-white/5 transition-colors text-white font-bold text-sm"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center px-5 pt-8 pb-10 gap-10 w-full max-w-md mx-auto relative z-10">

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 w-full py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-[0_0_15px_rgba(13,162,231,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Acesso Antecipado</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 text-glow">
              Conecte-se<br />com propósito
            </h1>
            <p className="text-slate-400 text-base font-medium leading-relaxed max-w-[280px] mx-auto">
              A rede exclusiva para líderes que moldam o futuro dos negócios.
            </p>
          </div>

          <div className="flex flex-col w-full gap-3 mt-4">
            <button
              onClick={() => navigate('/auth')}
              className="relative w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-500 hover:to-blue-400 text-white font-bold text-lg shadow-[0_4px_20px_rgba(13,162,231,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out skew-y-12"></div>
              <span className="relative flex items-center justify-center gap-2">
                Criar conta
                <ArrowRight size={20} />
              </span>
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-lg backdrop-blur-md transition-all"
            >
              Entrar
            </button>
          </div>
        </section>

        {/* Visual Anchor: Floating 3D Mockup */}
        <section className="w-full animate-float mt-4">
          <div className="glass-card rounded-2xl p-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90" />

              <div className="absolute top-4 right-4 glass-panel rounded-full px-3 py-1 flex items-center gap-1.5 border-white/10">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-white/80">AO VIVO</span>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <div className="glass-panel p-3 rounded-xl border-white/10 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <span className="material-symbols-outlined text-[20px]">auto_graph</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-white text-sm font-bold leading-tight">Tendências Globais</p>
                    <p className="text-white/60 text-[11px] leading-tight text-left">Atualizado agora</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full flex flex-col gap-4 mt-6 text-left">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Recursos Exclusivos</h2>
            <button className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 rounded-2xl flex flex-col gap-3 group hover:bg-white/10 transition-colors">
              <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">group_add</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Conexão</h3>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">Networking de alto nível</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex flex-col gap-3 group hover:bg-white/10 transition-colors">
              <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">forum</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Feed</h3>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">Conteúdo curado</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl col-span-2 flex items-center gap-4 group hover:bg-white/10 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-sm">Chat Seguro</h3>
                <p className="text-slate-400 text-xs mt-0.5">Criptografia de ponta a ponta</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center glass-panel border-t border-white/5 backdrop-blur-xl rounded-t-3xl">
        <div className="max-w-md mx-auto px-5">
          <div className="flex justify-center gap-6 mb-6">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Sobre</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Carreira</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Legal</a>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-center gap-4 text-white/40">
              <Globe className="hover:text-white cursor-pointer transition-colors" size={20} />
              <Mail className="hover:text-white cursor-pointer transition-colors" size={20} />
              <Radio className="hover:text-white cursor-pointer transition-colors" size={20} />
            </div>
            <p className="text-slate-600 text-[10px] mt-4 tracking-widest uppercase">© 2024 ELO NETWORK INC.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
