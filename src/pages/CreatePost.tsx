import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2, Image, Globe, X } from 'lucide-react';

export const CreatePost = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Validação de conteúdo no frontend (também validado no backend via RLS)
      if (content.trim().length === 0) {
        showToast('O conteúdo não pode estar vazio.', 'error');
        return;
      }

      if (content.trim().length > 500) {
        showToast('O conteúdo excede o limite de 500 caracteres.', 'error');
        return;
      }

      // Sanitização básica - remove tags HTML perigosas
      const sanitizedContent = content.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: sanitizedContent
            // likes_count e comments_count são calculados automaticamente pelo banco
          }
        ]);

      if (error) throw error;

      showToast('Onda publicada com sucesso!', 'success');
      navigate('/feed');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      showToast('Erro ao publicar. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-lg mx-auto">
      {/* Header Sticky Glass */}
      <header className="flex items-center justify-between px-5 h-20 relative z-50">
        <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-xl border-b border-white/5" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-xl glass-button text-slate-400 hover:text-white transition-all transform active:scale-95"
          >
            <X size={20} />
          </button>

          <h2 className="text-white text-lg font-bold tracking-tight">Nova Onda</h2>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-sky-400 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Publicar'}
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 p-6 overflow-y-auto bg-transparent scrollbar-hide">
        <textarea
          autoFocus
          className="w-full h-full bg-transparent text-xl text-white placeholder:text-slate-600 border-none focus:ring-0 resize-none p-0 leading-relaxed"
          placeholder="O que está acontecendo no seu oceano?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
        />
      </main>

      {/* Toolbar Bottom Area */}
      <footer className="p-4 relative">
        <div className="glass-panel rounded-3xl p-3 flex items-center justify-between shadow-2xl border-white/10">
          <div className="flex items-center gap-1">
            <button className="p-3 rounded-2xl text-primary hover:bg-primary/10 transition-colors">
              <Image size={22} />
            </button>
            <button className="p-3 rounded-2xl text-primary hover:bg-primary/10 transition-colors">
              <Globe size={22} />
            </button>
          </div>

          <div className="pr-4">
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-bold tracking-widest uppercase ${content.length > 450 ? 'text-rose-500' : 'text-slate-500'}`}>
                {content.length}/500
              </span>
              <div className="w-1.5 h-8 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`w-full transition-all duration-300 ${content.length > 450 ? 'bg-rose-500' : 'bg-primary'}`}
                  style={{ height: `${(content.length / 500) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="h-4" />
      </footer>
    </div>
  );
};

