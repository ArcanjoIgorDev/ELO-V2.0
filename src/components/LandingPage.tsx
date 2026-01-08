
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, MessageCircle, TrendingUp, Shield } from 'lucide-react';
import { ELOLogo } from './ui/Logo';

export const LandingPage = () => {
  const navigate = useNavigate();

  const appFeatures = [
    {
      title: "Feed Inteligente",
      description: "Conteúdo relevante e personalizado",
      icon: <TrendingUp size={20} className="text-primary" />
    },
    {
      title: "Conexões Reais",
      description: "Networking de alto valor",
      icon: <Users size={20} className="text-violet-400" />
    },
    {
      title: "Chat Seguro",
      description: "Conversas privadas e protegidas",
      icon: <MessageCircle size={20} className="text-emerald-400" />
    }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col ocean-bg overflow-x-hidden">
      {/* Blobs de fundo mais sutis */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between p-5 px-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ELOLogo size={36} className="relative transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">ELO</span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-blue-500 hover:from-sky-400 hover:to-blue-400 transition-all text-white font-black text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 sm:px-5 pt-8 sm:pt-12 pb-10 w-full max-w-6xl mx-auto relative z-10">

        {/* Hero Section - Mobile First */}
        <section className="flex flex-col items-center gap-8 sm:gap-12 w-full mb-12 sm:mb-16">
          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-5 sm:gap-6 text-center max-w-xl w-full">

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white mb-3 sm:mb-4 px-2">
              Conexões que{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400 animate-gradient">
                  importam
                </span>
                <span className="absolute inset-0 bg-primary/20 blur-2xl -z-0 opacity-60" />
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg mx-auto font-medium px-4">
              Uma rede social focada em qualidade, não quantidade. Conecte-se com pessoas que compartilham seus valores e objetivos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto px-4 sm:px-0">
              <button
                onClick={() => navigate('/auth')}
                className="group relative h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-gradient-to-r from-primary to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black text-sm sm:text-base shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-3">
                  Começar Agora
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="h-14 sm:h-16 px-6 sm:px-8 rounded-2xl glass-button hover:bg-white/10 text-white font-bold text-sm sm:text-base transition-all border-white/10 hover:border-white/20 active:scale-95"
              >
                Saber Mais
              </button>
            </div>

            {/* Stats - Mobile Optimized */}
            <div className="flex items-center gap-6 sm:gap-8 mt-8 sm:mt-10 justify-center">
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">1K+</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">Usuários Ativos</span>
              </div>
              <div className="w-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">5K+</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">Conexões Feitas</span>
              </div>
            </div>
          </div>

          {/* App Preview - Screenshots Reais do App */}
          <div className="flex-1 relative max-w-md w-full hidden md:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse-slow" />

              {/* Phone mockup com design real do app */}
              <div className="relative glass-card rounded-[3rem] p-3 sm:p-4 shadow-2xl border-white/10 overflow-hidden">
                {/* Phone frame */}
                <div className="bg-midnight-950 rounded-[2.5rem] overflow-hidden relative">
                  {/* Status bar realista */}
                  <div className="h-10 sm:h-12 bg-midnight-900/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 border-b border-white/5">
                    <span className="text-[10px] sm:text-xs text-white/60 font-bold">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary/20" />
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary/40" />
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary" />
                    </div>
                  </div>

                  {/* Header do app */}
                  <div className="px-4 sm:px-5 pt-6 pb-4 border-b border-white/5">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter">Feed Principal</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        <TrendingUp size={10} className="text-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.1em]">Explorar</span>
                      </div>
                    </div>
                  </div>

                  {/* App content preview - igual ao app real */}
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-midnight-950">
                    {/* Post card 1 - estilo real do app */}
                    <div className="glass-card rounded-[2.5rem] p-5 sm:p-6 space-y-4 border-white/5 relative overflow-hidden">
                      <div className="absolute -top-24 -left-24 size-48 bg-primary/10 blur-[80px] rounded-full opacity-30" />
                      
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="p-[2px] glass-panel rounded-2xl border-white/10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-white text-sm sm:text-base">Ana Silva</h3>
                              <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-primary uppercase">@ana_silva</span>
                              <span className="text-white/10">•</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase">há 2h</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-bold relative z-10">
                        Acabei de lançar meu novo projeto! Muito feliz com o resultado 🚀
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 relative z-10">
                        <button className="flex items-center gap-2.5 h-12 px-5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                          <span className="material-symbols-outlined text-[22px] fill-1">favorite</span>
                          <span className="text-xs font-black tracking-widest">24</span>
                        </button>
                        <button className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-slate-500 hover:bg-white/5">
                          <span className="material-symbols-outlined text-[22px]">forum</span>
                          <span className="text-xs font-black tracking-widest">8</span>
                        </button>
                      </div>
                    </div>

                    {/* Post card 2 - estilo real do app */}
                    <div className="glass-card rounded-[2.5rem] p-5 sm:p-6 space-y-4 border-white/5 relative overflow-hidden">
                      <div className="absolute -top-24 -left-24 size-48 bg-violet-500/10 blur-[80px] rounded-full opacity-30" />
                      
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="p-[2px] glass-panel rounded-2xl border-white/10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-white text-sm sm:text-base">Carlos Tech</h3>
                              <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-primary uppercase">@carlos_tech</span>
                              <span className="text-white/10">•</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase">há 5h</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-bold relative z-10">
                        Dica do dia: sempre valide suas ideias com usuários reais antes de lançar! 💡
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 relative z-10">
                        <button className="flex items-center gap-2.5 h-12 px-5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                          <span className="material-symbols-outlined text-[22px] fill-1">favorite</span>
                          <span className="text-xs font-black tracking-widest">42</span>
                        </button>
                        <button className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-slate-500 hover:bg-white/5">
                          <span className="material-symbols-outlined text-[22px]">forum</span>
                          <span className="text-xs font-black tracking-widest">15</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom navigation preview */}
                  <div className="h-16 bg-midnight-900/30 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2">
                    <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">home</span>
                    </div>
                    <div className="size-10 rounded-2xl flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">explore</span>
                    </div>
                    <div className="size-10 rounded-2xl flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </div>
                    <div className="size-10 rounded-2xl flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Mobile Optimized */}
        <section className="w-full max-w-4xl px-4 sm:px-0">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3">Por que escolher o ELO?</h2>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg">Recursos pensados para sua experiência</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {appFeatures.map((feature, idx) => (
              <div key={idx} className="glass-card p-5 sm:p-6 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final - Mobile Optimized */}
        <section className="relative w-full max-w-3xl mt-16 sm:mt-24 glass-card rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 md:p-12 text-center overflow-hidden mx-4 sm:mx-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-600/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-60 animate-pulse" />
              <Shield size={48} className="sm:w-14 sm:h-14 text-primary mx-auto relative z-10 drop-shadow-lg" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 tracking-tight px-2">
              Pronto para começar?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-lg mx-auto font-medium leading-relaxed px-4">
              Junte-se a milhares de profissionais que já fazem parte da nossa comunidade exclusiva.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="group relative h-14 sm:h-16 px-8 sm:px-10 md:px-12 rounded-2xl bg-gradient-to-r from-primary to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black text-sm sm:text-base shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">Criar Conta Grátis</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="mt-auto py-6 sm:py-8 text-center glass-panel border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-5">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mb-3 sm:mb-4">
            <a href="#" className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors">Sobre</a>
            <a href="#" className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors">Privacidade</a>
            <a href="#" className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors">Termos</a>
            <a href="#" className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors">Contato</a>
          </div>
          <p className="text-slate-600 text-[10px] sm:text-xs tracking-wider">© 2024 ELO Network • Desenvolvido por Igor Arcanjo</p>
        </div>
      </footer>
    </div>
  );
};
