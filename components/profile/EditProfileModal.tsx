import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Loader2, User, FileText } from 'lucide-react';

interface EditProfileModalProps {
  onClose: () => void;
  currentName: string;
  currentBio: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, currentName, currentBio }) => {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(currentName || '');
  const [bio, setBio] = useState(currentBio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      onClose();
    } catch (err: any) {
      alert("Erro ao atualizar perfil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-midnight-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-midnight-900/50">
          <h2 className="text-lg font-bold text-white">Editar Perfil</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Nome de Exibição
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-midnight-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean/50 focus:ring-1 focus:ring-ocean/50 transition-all placeholder:text-slate-700"
              placeholder="Como você quer ser chamado?"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-midnight-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean/50 focus:ring-1 focus:ring-ocean/50 transition-all placeholder:text-slate-700 min-h-[100px] resize-none leading-relaxed"
              placeholder="Conte um pouco sobre você..."
              maxLength={160}
            />
            <div className="text-right text-[10px] text-slate-600 font-medium">
              {bio.length}/160
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ocean hover:bg-ocean-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-ocean/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Salvar Alterações
          </button>

        </form>
      </div>
    </div>
  );
};