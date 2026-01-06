import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

export const CreatePost = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            likes_count: 0,
            comments_count: 0
          }
        ]);

      if (error) throw error;

      showToast('Post publicado com sucesso!', 'success');
      navigate('/feed');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      showToast('Erro ao publicar post. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header / Top App Bar */}
      <header className="flex items-center justify-between px-4 py-2 pt-4 pb-4 glass-panel sticky top-0 z-50 rounded-b-2xl mb-4 mx-4 mt-2">
        <button
          onClick={() => navigate('/feed')}
          className="flex size-10 items-center justify-center rounded-full glass-button text-slate-300 hover:text-white"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <h2 className="text-white text-lg font-bold tracking-wide">Novo Post</h2>
        <button
          onClick={handleSubmit}
          </button>

      <textarea
        autoFocus
        className="w-full flex-1 bg-transparent text-lg text-white placeholder:text-slate-500 border-none focus:ring-0 resize-none p-0 leading-relaxed scrollbar-hide"
        placeholder="O que está acontecendo?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Image Preview Placeholder could go here */}
    </div>
      </div >

  {/* Bottom Toolbar */ }
  < div className = "flex-none p-4 pb-safe border-t border-white/5 bg-midnight-950 sticky bottom-0" >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-full text-ocean hover:bg-ocean/10 transition-colors">
          <Image size={22} />
        </button>
        <button className="p-2.5 rounded-full text-ocean hover:bg-ocean/10 transition-colors">
          <Globe size={22} />
        </button>
      </div>

      <div className={`text-xs font-medium transition-colors ${content.length > 480 ? 'text-red-400' : 'text-slate-600'}`}>
        {content.length > 0 && (
          <span className="flex items-center gap-2">
            {content.length}/500
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${content.length > 480 ? 'border-red-500' : 'border-ocean'}`}>
              <div className="w-full h-full bg-current opacity-20 rounded-full" style={{ clipPath: `inset(${100 - (content.length / 500) * 100}% 0 0 0)` }}></div>
            </div>
          </span>
        )}
      </div>
    </div>
      </div >
    </div >
  );
};
