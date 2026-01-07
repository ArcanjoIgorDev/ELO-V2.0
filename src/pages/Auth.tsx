
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, UserCircle, KeyRound } from 'lucide-react';
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
    <div className="relative min-h-screen w-full flex flex-col ocean-bg overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Animated Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Back Button */}
      <div className="absolute top-0 left-0 p-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full glass-button group-hover:bg-white/10 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold">Início</span>
        </button>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        <div className="w-full flex flex-col gap-8 animate-slide-up">

          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all"></div>
                <div className="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl shadow-primary/20 border border-white/10">
                  <ShieldCheck size={36} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Acesso Corporativo</h2>
                <h1 className="text-3xl font-black text-white tracking-tight">Verificação de Identidade</h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px]">
              {isLogin
                ? "Insira suas credenciais para acessar o terminal de rede segura."
                : "Configure seu identificador único para ingressar na rede."}
            </p>
          </div>

          {/* Glass Card Form */}
          <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
            {/* Toggle Mechanism */}
            <div className="flex p-1.5 bg-background-dark/50 rounded-2xl mb-8 border border-white/5 relative isolate">
              <div
                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-primary rounded-xl shadow-lg shadow-primary/20 transition-all duration-500 ease-out ${isLogin ? 'left-1.5' : 'left-[calc(50%-0px)]'}`}
              />
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 ${isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Ingresso
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-100 font-semibold leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identificador Único</label>
                <div className="relative group overflow-hidden rounded-2xl">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <UserCircle size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                    className="w-full input-glass pl-12 pr-12 py-4 text-white font-bold placeholder:text-slate-700 outline-none"
                    placeholder="ex: smith_dev"
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

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Chave de Acesso</label>
                <div className="relative group overflow-hidden rounded-2xl">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <KeyRound size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-glass pl-12 pr-4 py-4 text-white font-bold placeholder:text-slate-700 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <button
                  type="submit"
                  disabled={loading || (!isLogin && isUserAvailable === false)}
                  className="relative w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-500 hover:to-blue-400 text-white font-bold text-lg shadow-[0_4px_20px_rgba(13,162,231,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out skew-y-12"></div>
                  <span className="relative flex items-center gap-3">
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        {isLogin ? 'Autorizar Acesso' : 'Efetuar Registro'}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </span>
                </button>

                {isLogin && (
                  <button type="button" className="text-[10px] font-black text-slate-500 hover:text-primary transition-colors uppercase tracking-[0.2em] py-2">
                    Recuperar credenciais de acesso
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center">
        <p className="text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
          ELO SECURE NETWORK PROTOCOL © 2024
        </p>
      </footer>
    </div>
  );
};
