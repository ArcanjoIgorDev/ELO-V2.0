import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Waves, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Auth = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isUserAvailable, setIsUserAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (session) {
      navigate('/feed', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    setError(null);
    setIsUserAvailable(null);
  }, [isLogin]);

  useEffect(() => {
    if (isLogin || username.length < 3) {
      setIsUserAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUser(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();
        
        if (data) setIsUserAvailable(false);
        else setIsUserAvailable(true);
      } catch (err) {
        setIsUserAvailable(true);
      } finally {
        setIsCheckingUser(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.toLowerCase().trim();
    const internalEmail = `${cleanUsername}@elo.network`;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });
        if (error) throw error;
        navigate('/feed', { replace: true });
      } else {
        if (cleanUsername.length < 3) throw new Error("Usuário deve ter pelo menos 3 caracteres.");
        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) throw new Error("Use apenas letras, números e underline.");
        if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");
        if (isUserAvailable === false) throw new Error("Este nome de usuário já está em uso.");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: internalEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanUsername,
              avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data?.session) {
           navigate('/feed', { replace: true });
        } else if (data?.user && !data.session) {
           const { error: signInError } = await supabase.auth.signInWithPassword({
             email: internalEmail,
             password,
           });
           
           if (signInError) {
             if (signInError.message.includes("Email not confirmed")) {
               throw new Error("Conta criada, mas login falhou. Verifique o Supabase.");
             }
             throw signInError;
           } else {
             navigate('/feed', { replace: true });
           }
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message;
      if (msg.includes("Invalid login credentials")) msg = "Credenciais inválidas.";
      if (msg.includes("User already registered")) msg = "Nome de usuário indisponível.";
      if (msg.includes("weak_password")) msg = "Senha muito fraca.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-midnight-950 flex flex-col relative overflow-hidden items-center justify-center">
      <div className="absolute top-0 left-0 p-6 z-20 w-full">
         <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
         </button>
      </div>

      <div className="w-full max-w-md px-6 z-10 animate-slide-up">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl shadow-[0_0_30px_rgba(14,165,233,0.2)] mb-6 text-ocean ring-1 ring-white/10">
            <Waves size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Acesse sua conta</h1>
          <p className="text-slate-400 mt-2 text-sm">Conecte-se ao que importa.</p>
        </div>

        <div className="bg-midnight-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
          
          <div className="flex p-1 bg-midnight-950/80 rounded-xl mb-8 relative z-10 border border-white/5">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? 'bg-ocean text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-ocean text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cadastro
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 animate-fade-in">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Usuário</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  className={`w-full bg-midnight-950/50 border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-slate-700 ${error ? 'border-red-900/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-ocean/50 focus:border-ocean/50'}`}
                  placeholder="Seu nome de usuário"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                />
                
                {!isLogin && username.length >= 3 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-300">
                    {isCheckingUser ? (
                      <Loader2 size={18} className="animate-spin text-slate-500" />
                    ) : isUserAvailable ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-midnight-950/50 border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-slate-700 ${error ? 'border-red-900/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-ocean/50 focus:border-ocean/50'}`}
                placeholder="••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!isLogin && !isUserAvailable)}
              className="w-full bg-ocean text-white font-bold py-4 rounded-xl hover:bg-ocean-600 active:scale-[0.98] transition-all shadow-lg shadow-ocean/20 flex items-center justify-center space-x-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Confirmar Cadastro'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};