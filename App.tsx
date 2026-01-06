
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { Feed } from './pages/Feed';
import { Auth } from './pages/Auth';
import { CreatePost } from './pages/CreatePost';
import { ProfilePage } from './pages/Profile';
import { Discover } from './pages/Discover';
import { NotificationsPage } from './pages/Notifications';
import { ChatList } from './pages/ChatList';
import { ChatPage } from './pages/Chat';
import { LandingPage } from './components/LandingPage';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { CookieConsent } from './components/ui/CookieConsent';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';

// Componente Layout que gerencia animações e estrutura protegida
const ProtectedLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [showRescue, setShowRescue] = useState(false);

  // Revalidação Silenciosa ao focar na aba/app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session) {
        // Verifica sessão em background sem setar loading global
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Se sessão morreu no background, aí sim podemos recarregar
          console.log("Sessão perdida em background, recarregando...");
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  // Timer de Resgate (Failsafe UI)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      timer = setTimeout(() => setShowRescue(true), 5000); // Aumentado para 5s
    } else {
      setShowRescue(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-midnight-950 gap-4">
        <Loader2 className="animate-spin text-ocean" size={40} />
        
        {showRescue && (
          <div className="animate-fade-in flex flex-col items-center gap-3 mt-4 px-6 text-center">
            <p className="text-slate-500 text-sm">O carregamento está demorando mais que o normal.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full text-white text-sm font-bold hover:bg-white/20 transition-colors border border-white/5"
            >
              <RefreshCw size={14} /> Tentar Novamente
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fixed inset-0 flex flex-col w-full bg-midnight-950 overflow-hidden">
      <Header />
      
      {/* Wrapper de Animação */}
      <main className="flex-1 w-full max-w-lg mx-auto bg-midnight-950 relative overflow-hidden">
        <div 
          key={location.pathname} 
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar page-enter"
        >
           <Outlet />
        </div>
      </main>
      
      <BottomNav />
      
      {/* Tutorial Overlay - Só aparece se necessário */}
      <OnboardingTutorial />
    </div>
  );
};

const RootRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return null; 
  if (session) return <Navigate to="/feed" replace />;
  return <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/feed" element={<Feed />} />
            <Route path="/create" element={<CreatePost />} />
            
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />

            <Route path="/discover" element={<Discover />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<ChatList />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <CookieConsent />
      </HashRouter>
    </AuthProvider>
  );
}
