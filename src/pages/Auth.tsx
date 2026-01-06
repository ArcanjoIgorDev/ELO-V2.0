import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ELOLogo } from '../components/ui/Logo';

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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Back Button */}
      <div className="absolute top-0 left-0 p-6 z-20 w-full">
        <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white flex items-center gap-2 transition-colors group">
          <div className="p-2 rounded-full glass-button group-hover:bg-white/10 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold">Voltar</span>
        </button>
      </div>

      <div className="w-full max-w-sm z-10 animate-slide-up flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-ocean-500/30 blur-xl rounded-full"></div>
            <ELOLogo size={72} className="relative drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Entre para continuar conectado.' : 'Comece a compartilhar suas ideias.'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden backdrop-blur-2xl">

          {/* Toggle */}
          <div className="flex p-1 bg-black/20 rounded-xl mb-8 border border-white/5 relative isolate">
            <div
              className={`absolute inset-y-1 w-[calc(50%-4px)] bg-primary rounded-lg shadow-lg shadow-primary/20 transition-all duration-300 ease-spring ${isLogin ? 'left-1' : 'left-[calc(50%+0px)]'}`}
            />
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Cadastro
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-widest">Usuário</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  className={`w-full bg-black/20 border rounded-xl px-4 py-3.5 text-white outline-none transition-all font-medium placeholder:text-slate-600 ${error ? 'border-red-500/30 focus:border-red-500/50 focus:bg-red-500/5' : 'border-white/10 focus:border-primary/50 focus:bg-white/5 hover:border-white/20'}`}
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
                      <CheckCircle2 size={20} className="text-emerald-500 drop-shadow-lg" />
                    ) : (
                      <XCircle size={20} className="text-red-500 drop-shadow-lg" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-widest">Senha</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-black/20 border rounded-xl px-4 py-3.5 text-white outline-none transition-all font-medium placeholder:text-slate-600 ${error ? 'border-red-500/30 focus:border-red-500/50 focus:bg-red-500/5' : 'border-white/10 focus:border-primary/50 focus:bg-white/5 hover:border-white/20'}`}
                  placeholder="••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!isLogin && !isUserAvailable)}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(13,162,231,0.3)] hover:shadow-[0_0_30px_rgba(13,162,231,0.5)] flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isLogin ? 'Entrar no ELO' : 'Criar Conta'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};