
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

// Componente Layout que gerencia animações e estrutura protegida
const ProtectedLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [showRescue, setShowRescue] = useState(false);

  // Timer para mostrar botão de resgate se o loading demorar muito
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      timer = setTimeout(() => setShowRescue(true), 4000); // 4 segundos
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
          <div className="animate-fade-in flex flex-col items-center gap-2 mt-4">
            <p className="text-slate-500 text-sm">A conexão está lenta...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-bold hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={14} /> Recarregar App
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
  if (loading) return null; // Deixa o ProtectedLayout lidar com o loading UI global se necessário, ou retorna null rápido
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
            
            {/* Rotas de Perfil */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />

            <Route path="/discover" element={<Discover />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<ChatList />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Cookie Consent Global */}
        <CookieConsent />
      </HashRouter>
    </AuthProvider>
  );
}
