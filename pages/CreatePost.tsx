
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Image, X, Loader2, Sparkles } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';

export const CreatePost = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
      navigate('/feed');
    } catch (err) {
      console.error(err);
      alert('Não foi possível enviar sua publicação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-midnight-950 text-slate-200">
      {/* Header */}
      <div className="flex-none h-16 px-4 flex items-center justify-between border-b border-white/5 bg-midnight-950/80 backdrop-blur z-20">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={24} />
        </button>
        
        <span className="font-bold text-white text-[15px]">Nova Publicação</span>
        
        <button 
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="bg-ocean hover:bg-ocean-600 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          Publicar
        </button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex gap-4">
          <div className="shrink-0 pt-1">
             <Avatar url={profile?.avatar_url} alt={profile?.username || ''} size="md" />
          </div>
          
          <div className="flex-1 min-h-[200px]">
            <textarea
              autoFocus
              className="w-full h-full min-h-[300px] bg-transparent text-lg text-white placeholder:text-slate-500/80 border-none focus:ring-0 resize-none p-0 leading-relaxed scrollbar-hide"
              placeholder="O que está acontecendo?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Toolbar Inferior */}
      <div className="flex-none p-4 pb-safe border-t border-white/5 bg-midnight-900/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <button className="text-ocean p-3 rounded-2xl bg-ocean/10 hover:bg-ocean/20 transition-colors flex items-center gap-2 group">
            <Image size={20} className="group-active:scale-90 transition-transform" />
          </button>
          
          <button className="text-slate-400 p-3 rounded-2xl hover:bg-white/5 transition-colors flex items-center gap-2 group">
            <Sparkles size={20} className="group-active:scale-90 transition-transform" />
          </button>
          
          <div className="ml-auto text-xs font-medium text-slate-600">
            {content.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};
