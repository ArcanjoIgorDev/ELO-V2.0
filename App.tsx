
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
import { Loader2 } from 'lucide-react';

// Componente Layout Protegido com Safety Valve
const ProtectedLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    // 1. Se o loading do context terminar, removemos o spinner.
    if (!loading) {
      setShowSpinner(false);
      return;
    }

    // 2. SAFETY VALVE: Se o loading do context demorar mais de 1s, forçamos a remoção do spinner.
    // Isso garante que a UI apareça mesmo se o AuthContext tiver algum soluço.
    const timer = setTimeout(() => {
      setShowSpinner(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (showSpinner) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-midnight-950">
        <Loader2 className="animate-spin text-ocean" size={40} />
      </div>
    );
  }

  // Se parou de carregar e não tem sessão, manda pra home
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

const RootRoute = () => {
  const { session, loading } = useAuth();
  const [forceRender, setForceRender] = useState(false);

  // Safety Valve para a Home também
  useEffect(() => {
    const timer = setTimeout(() => setForceRender(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !forceRender) return null; 
  
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
