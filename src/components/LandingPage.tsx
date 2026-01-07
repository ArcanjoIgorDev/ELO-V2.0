
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
      <header className="sticky top-0 z-50 glass-panel border-b-0">
        <div className="flex items-center justify-between p-4 px-5 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <ELOLogo size={32} />
            <span className="text-xl font-bold tracking-tight text-white">ELO</span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="h-10 px-5 rounded-xl glass-button hover:bg-white/10 transition-all text-white font-bold text-sm"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-5 pt-12 pb-10 w-full max-w-6xl mx-auto relative z-10">

        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 w-full mb-16">
          {/* Left: Text Content */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm w-fit mx-auto lg:mx-0">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Versão Beta</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Conexões que <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">importam</span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
              Uma rede social focada em qualidade, não quantidade. Conecte-se com pessoas que compartilham seus valores e objetivos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
              <button
                onClick={() => navigate('/auth')}
                className="h-14 px-8 rounded-xl bg-primary hover:bg-sky-400 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Começar Agora
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="h-14 px-8 rounded-xl glass-button hover:bg-white/10 text-white font-bold text-base transition-all"
              >
                Saber Mais
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-6 justify-center lg:justify-start">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">1K+</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Usuários Ativos</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">5K+</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Conexões Feitas</span>
              </div>
            </div>
          </div>

          {/* Right: App Preview */}
          <div className="flex-1 relative max-w-md w-full">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />

              {/* Phone mockup */}
              <div className="relative glass-card rounded-[3rem] p-4 shadow-2xl border-white/10">
                <div className="bg-midnight-950 rounded-[2.5rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-12 bg-midnight-900/50 backdrop-blur-xl flex items-center justify-between px-6">
                    <span className="text-xs text-white/60">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-primary/20" />
                      <div className="w-4 h-4 rounded-full bg-primary/40" />
                      <div className="w-4 h-4 rounded-full bg-primary" />
                    </div>
                  </div>

                  {/* App content preview */}
                  <div className="p-4 space-y-4">
                    {/* Post card 1 */}
                    <div className="glass-card rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600" />
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">Ana Silva</p>
                          <p className="text-slate-500 text-xs">há 2 horas</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Acabei de lançar meu novo projeto! Muito feliz com o resultado 🚀
                      </p>
                      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs">❤️</span>
                          </div>
                          <span className="text-xs font-bold">24</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs">💬</span>
                          </div>
                          <span className="text-xs font-bold">8</span>
                        </button>
                      </div>
                    </div>

                    {/* Post card 2 */}
                    <div className="glass-card rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">Carlos Tech</p>
                          <p className="text-slate-500 text-xs">há 5 horas</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Dica do dia: sempre valide suas ideias com usuários reais!
                      </p>
                      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs">❤️</span>
                          </div>
                          <span className="text-xs font-bold">42</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs">💬</span>
                          </div>
                          <span className="text-xs font-bold">15</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">Por que escolher o ELO?</h2>
            <p className="text-slate-400 text-lg">Recursos pensados para sua experiência</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {appFeatures.map((feature, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="w-full max-w-2xl mt-20 glass-card rounded-3xl p-10 text-center">
          <Shield size={48} className="text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Pronto para começar?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
            Junte-se a milhares de profissionais que já fazem parte da nossa comunidade.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="h-14 px-10 rounded-xl bg-primary hover:bg-sky-400 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Criar Conta Grátis
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center glass-panel border-t border-white/5">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex justify-center gap-8 mb-4">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Sobre</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacidade</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Termos</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Contato</a>
          </div>
          <p className="text-slate-600 text-xs tracking-wider">© 2024 ELO Network • Desenvolvido por Igor Arcanjo</p>
        </div>
      </footer>
    </div>
  );
};
