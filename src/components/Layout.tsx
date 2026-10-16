import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'sonner';

export const Layout: React.FC = () => {
  const { pathname } = useLocation();

  // Scroll to top on navigation per spec §9.6
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased transition-colors">
      <Header />
      <main className="flex-1 w-full pt-20">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
};
