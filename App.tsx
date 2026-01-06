
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

// Componente de Loading Centralizado
const FullScreenLoader = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-midnight-950">
    <Loader2 className="animate-spin text-ocean mb-4" size={48} />
    <p className="text-slate-500 text-sm font-medium animate-pulse">Conectando...</p>
  </div>
);

// Layout Protegido
const ProtectedLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

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

// Rota Raiz (Landing ou Feed)
const RootRoute = () => {
  const { session, loading } = useAuth();
  
  if (loading) return <FullScreenLoader />;
  
  if (session) return <Navigate to="/feed" replace />;
  return <LandingPage />;
};

// Rota de Auth (Login/Register)
const AuthRoute = () => {
    const { session, loading } = useAuth();
    if (loading) return <FullScreenLoader />;
    if (session) return <Navigate to="/feed" replace />;
    return <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<AuthRoute />} />
          
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
