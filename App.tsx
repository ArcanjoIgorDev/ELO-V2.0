
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
  
  // Timer de segurança interno: Se o AuthContext disser que está carregando por mais de 2s,
  // nós ignoramos e mostramos a UI (ou redirecionamos) para evitar tela branca eterna.
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    let timer: any;
    if (loading) {
       timer = setTimeout(() => {
         setForceShow(true);
       }, 2000); // 2 segundos max de espera visual
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Se estiver carregando E não passamos do tempo limite, mostra spinner
  if (loading && !forceShow) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-midnight-950">
        <Loader2 className="animate-spin text-ocean" size={40} />
      </div>
    );
  }

  // Se não tem sessão (e parou de carregar ou forçamos), manda pra home
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
  
  // Mesma lógica de bypass do loading aqui para a Home
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !forceShow) return null; 
  
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
