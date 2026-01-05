import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, Shield, Zap, Layout, Users, ArrowRight, Lock } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-200 font-sans selection:bg-ocean selection:text-white pb-20">
      
      {/* Navbar Fixa */}
      <nav className="fixed top-0 w-full z-50 glass bg-midnight-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-ocean text-white p-1.5 rounded-lg shadow-lg shadow-ocean/20">
              <Waves size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ELO</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-white text-midnight-950 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors hidden sm:block"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-ocean-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-ocean-300 mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-pulse"></span>
            Versão 1.0 disponível
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-slide-up">
            Conexões reais. <br/>
            <span className="text-ocean-400">Sem ruído.</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed animate-slide-up [animation-delay:100ms] opacity-0 [animation-fill-mode:forwards]">
            Uma rede social desenhada para respeitar o seu tempo e privacidade. Sem algoritmos viciantes, apenas você e suas interações.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
            <button 
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 bg-ocean hover:bg-ocean-600 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-95 flex items-center justify-center gap-2 group"
            >
              Começar Agora
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Layout}
            title="Feed Cronológico"
            desc="Veja as postagens na ordem em que aconteceram. Você controla o que vê, não um algoritmo."
          />
          <FeatureCard 
            icon={Lock}
            title="Privacidade Primeiro"
            desc="Seus dados não são o produto. Navegue com a segurança de uma plataforma transparente."
          />
          <FeatureCard 
            icon={Zap}
            title="Design Focado"
            desc="Interface limpa e livre de distrações, pensada para destacar o conteúdo e as conversas."
          />
        </div>
      </section>

      {/* App Showcase / Detailed Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto border-t border-white/5 mt-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-white">Simplicidade é a maior sofisticação.</h2>
            <p className="text-slate-400 leading-relaxed">
              Removemos contadores de visualizações, métricas de vaidade excessivas e notificações invasivas. 
              O ELO foi construído para devolver a autonomia da sua experiência digital.
            </p>
            
            <ul className="space-y-4 mt-6">
              <li className="flex items-center gap-3 text-slate-300">
                <div className="bg-ocean/20 p-1.5 rounded-full text-ocean"><Users size={16} /></div>
                <span>Comunidades orgânicas</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <div className="bg-ocean/20 p-1.5 rounded-full text-ocean"><Shield size={16} /></div>
                <span>Moderação ativa</span>
              </li>
            </ul>
          </div>
          
          {/* Abstract UI Representation */}
          <div className="flex-1 w-full max-w-sm mx-auto">
            <div className="aspect-[9/16] bg-midnight-900 rounded-[2.5rem] border-4 border-midnight-800 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="h-full w-full bg-gradient-to-b from-midnight-900 to-midnight-950 p-6 flex flex-col gap-4 opacity-80">
                {/* Fake UI Elements */}
                <div className="h-8 w-8 bg-white/10 rounded-full mb-4"></div>
                <div className="h-4 w-3/4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded mb-8"></div>
                
                <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-ocean/20 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-1/3 bg-white/10 rounded"></div>
                      <div className="h-3 w-full bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="h-20 bg-white/5 rounded-2xl border border-white/5"></div>
              </div>
              
              {/* Overlay Glass */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-midnight-950 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-12 pb-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
          <Waves size={24} />
          <span className="font-bold text-lg">ELO</span>
        </div>
        <p className="text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} ELO Network. Feito com cuidado para humanos.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
    <div className="w-12 h-12 rounded-2xl bg-midnight-950 border border-white/10 flex items-center justify-center mb-4 text-ocean group-hover:scale-110 transition-transform">
      <Icon size={24} strokeWidth={2} />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);