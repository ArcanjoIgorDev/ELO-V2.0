
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Image, X, Loader2, Globe, ChevronDown } from 'lucide-react';
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
      {/* Top Bar */}
      <div className="flex-none px-4 py-3 flex items-center justify-between bg-midnight-950">
        <button 
          onClick={() => navigate(-1)} 
          className="text-slate-200 font-medium text-[15px] hover:text-white"
        >
          Cancelar
        </button>
        
        <button 
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="bg-ocean hover:bg-ocean-600 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Postar
        </button>
      </div>

      {/* Composer Area */}
      <div className="flex-1 flex gap-3 p-4">
        <div className="shrink-0 pt-1">
           <Avatar url={profile?.avatar_url} alt={profile?.username || ''} size="md" />
        </div>
        
        <div className="flex-1 h-full flex flex-col">
          {/* Privacy Selector Placeholder (Visual only) */}
          <button className="flex items-center gap-1 text-ocean text-xs font-bold border border-ocean/30 rounded-full px-3 py-1 w-fit mb-3 hover:bg-ocean/10 transition-colors">
            Público <ChevronDown size={12} />
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
      </div>

      {/* Bottom Toolbar */}
      <div className="flex-none p-4 pb-safe border-t border-white/5 bg-midnight-950 sticky bottom-0">
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
                   <div className="w-full h-full bg-current opacity-20 rounded-full" style={{ clipPath: `inset(${100 - (content.length/500)*100}% 0 0 0)`}}></div>
                 </div>
               </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
