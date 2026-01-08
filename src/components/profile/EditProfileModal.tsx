
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Loader2, User, FileText, Camera } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface EditProfileModalProps {
  onClose: () => void;
  currentName: string;
  currentBio: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, currentName, currentBio }) => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(currentName || '');
  const [bio, setBio] = useState(currentBio || '');
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

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
      showToast('Perfil atualizado com sucesso!');
      onClose();
    } catch (err: any) {
      showToast("Erro ao atualizar perfil", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    
    const file = event.target.files[0];
    
    // Validação de tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Apenas imagens (JPG, PNG, WEBP) são permitidas.', 'error');
      return;
    }
    
    // Validação de tamanho (10MB máximo para capas)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('Imagem muito grande. Máximo de 10MB.', 'error');
      return;
    }
    
    setUploadingCover(true);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
    try {
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
      showToast('Capa atualizada com sucesso!');
    } catch (error) {
      showToast('Erro no upload da capa.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-midnight-950/90 backdrop-blur-3xl animate-fade-in">
      <div className="glass-card border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 relative z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Editar Perfil</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Configurações da Conta</p>
          </div>
          <button
            onClick={onClose}
            className="size-10 glass-button rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto relative z-10">

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Camera size={14} className="text-primary" />
              Imagem de Capa
            </label>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full h-24 glass-card rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all group overflow-hidden relative"
            >
              {uploadingCover ? (
                <Loader2 size={24} className="animate-spin text-primary" />
              ) : (
                <>
                  <Camera size={24} className="text-slate-500 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alterar Capa</span>
                </>
              )}
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Nome de Exibição
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full input-glass rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none relative z-10"
                placeholder="Como quer ser chamado?"
                maxLength={30}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-[16px] text-primary">description</span>
              Bio
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full input-glass rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none relative z-10 min-h-[120px] resize-none leading-relaxed"
                placeholder="Conte sua história no ELO..."
                maxLength={160}
              />
            </div>
            <div className="flex justify-end px-1">
              <div className="px-3 py-1 rounded-full glass-panel border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                {bio.length} / 160
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-primary text-white font-black text-sm rounded-[2rem] shadow-xl shadow-primary/20 hover:bg-sky-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Salvar Perfil
          </button>

        </form>
      </div>
    </div>
  );
};
