import React from 'react';
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
import { Loader2 } from 'lucide-react';

// Layout Protegido Limpo
const ProtectedLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // O AuthContext agora garante que loading se torna false em max 2s.
  if (loading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-midnight-950">
        <Loader2 className="animate-spin text-ocean" size={40} />
      </div>
    );
  }

  // Se terminou de carregar e não tem sessão, expulsa
  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fixed inset-0 flex flex-col w-full bg-midnight-950 overflow-hidden">
      <Header />
      
      <main className="flex-1 w-full max-w-lg mx-auto bg-midnight-950 relative overflow-hidden">
        <div 
          key={location.pathname} 
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar page-enter"
        >
           <Outlet />
        </div>
      </main>
      
      <BottomNav />
      <OnboardingTutorial />
    </div>
  );
};

// Rota Raiz
const RootRoute = () => {
  const { session, loading } = useAuth();
  
  // CORREÇÃO CRÍTICA: Nunca retorne null aqui.
  // Em produção, a latência de rede causa uma tela preta de 2-4 segundos.
  // Mostramos o Loader para indicar que o app está inicializando.
  if (loading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-midnight-950">
        <Loader2 className="animate-spin text-ocean" size={40} />
      </div>
    );
  }
  
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