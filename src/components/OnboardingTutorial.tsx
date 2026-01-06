
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, ArrowRight, Check, Sparkles, Home, UserPlus, MessageCircle, Heart } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: TutorialStep[] = [
  {
    title: "Bem-vindo ao ELO",
    description: "Uma rede social desenhada para clareza e conexões reais. Vamos dar uma volta rápida?",
    icon: Sparkles
  },
  {
    title: "Feed Cronológico",
    description: "Sua Home mostra tudo em tempo real. Sem algoritmos ocultos. Você vê o que as pessoas postam, na hora que postam.",
    icon: Home
  },
  {
    title: "Conexões e Mensagens",
    description: "Adicione amigos na aba de Busca. Converse em tempo real e troque Ecos (mensagens rápidas de 24h).",
    icon: MessageCircle
  },
  {
    title: "Tudo Pronto",
    description: "Seu perfil é seu espaço. Personalize-o e comece a compartilhar momentos.",
    icon: UserPlus
  }
];

export const OnboardingTutorial = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Não mostrar se não houver perfil ou se já tiver visto
  if (!profile || profile.has_seen_tutorial || !isVisible) return null;

  const completeTutorial = async () => {
    setIsCompleting(true);
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ has_seen_tutorial: true })
          .eq('id', user.id);
        
        if (!error) {
          await refreshProfile(); // Atualiza contexto global
          setIsVisible(false);
        }
      } catch (err) {
        console.error("Erro ao salvar tutorial:", err);
        setIsVisible(false); // Fecha localmente em caso de erro para não bloquear
      }
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-midnight-950/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-midnight-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-ocean transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Botão Fechar/Pular */}
        <button 
          onClick={skipTutorial}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Conteúdo */}
        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center text-ocean mb-6 ring-1 ring-ocean/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] animate-float">
            <StepIcon size={32} strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 transition-all duration-300">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-8 h-12 transition-all duration-300">
            {steps[currentStep].description}
          </p>

          <button 
            onClick={nextStep}
            disabled={isCompleting}
            className="w-full bg-ocean hover:bg-ocean-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-ocean/20 active:scale-95 flex items-center justify-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Começar
                <Check size={20} />
              </>
            ) : (
              <>
                Próximo
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-white w-4' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
