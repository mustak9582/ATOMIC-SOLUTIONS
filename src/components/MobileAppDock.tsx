import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Wrench, ShoppingBag, User, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../contexts/PWAContext';

export const MobileAppDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isStaff } = useAuth();
  const { isInstalled, isStandalone, promptInstall } = usePWA();

  const currentPath = location.pathname;

  // Hide on admin routes, staff portal, or login page
  const shouldHide = 
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/professional') ||
    currentPath === '/login' ||
    currentPath === '/billing';

  if (shouldHide) return null;

  const handleServicesClick = () => {
    if (currentPath === '/') {
      const el = document.getElementById('services');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleAccountClick = () => {
    if (user) {
      if (isAdmin) navigate('/admin');
      else if (isStaff) navigate('/professional');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const isInstalledApp = isInstalled || isStandalone;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5 transition-transform duration-300 pointer-events-auto"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {/* 1. Home */}
        <button
          onClick={() => {
            if (currentPath === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
            currentPath === '/' ? 'text-teal font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Home size={20} className={currentPath === '/' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
            {currentPath === '/' && (
              <motion.span 
                layoutId="dock-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" 
              />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </button>

        {/* 2. Services */}
        <button
          onClick={handleServicesClick}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
            currentPath.startsWith('/service') ? 'text-teal font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Wrench size={20} className={currentPath.startsWith('/service') ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
            {currentPath.startsWith('/service') && (
              <motion.span 
                layoutId="dock-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" 
              />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Services</span>
        </button>

        {/* 3. Center CTA: Install App (if web) or Bookings (if installed/user) */}
        {!isInstalledApp ? (
          <button
            onClick={() => promptInstall()}
            className="flex flex-col items-center justify-center -mt-4 py-1 px-3 group cursor-pointer"
            title="Install Mobile App"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal to-[#14b8a6] text-white flex items-center justify-center shadow-lg shadow-teal/30 group-active:scale-95 transition-transform border-2 border-navy">
              <Download size={22} className="animate-bounce" />
            </div>
            <span className="text-[9px] font-black uppercase text-teal mt-0.5 tracking-wider">Install</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (user) navigate('/my-account/bookings');
              else handleServicesClick();
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentPath.includes('bookings') ? 'text-teal font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Calendar size={20} className={currentPath.includes('bookings') ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              {currentPath.includes('bookings') && (
                <motion.span 
                  layoutId="dock-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" 
                />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Bookings</span>
          </button>
        )}

        {/* 4. Store */}
        <button
          onClick={() => navigate('/store')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
            currentPath === '/store' ? 'text-teal font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={20} className={currentPath === '/store' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
            {currentPath === '/store' && (
              <motion.span 
                layoutId="dock-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" 
              />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Store</span>
        </button>

        {/* 5. Account */}
        <button
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
            currentPath.startsWith('/dashboard') || currentPath.startsWith('/my-account') ? 'text-teal font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <User size={20} className={currentPath.startsWith('/dashboard') ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
            {(currentPath.startsWith('/dashboard') || currentPath.startsWith('/my-account')) && (
              <motion.span 
                layoutId="dock-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal rounded-full" 
              />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{user ? 'Account' : 'Login'}</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileAppDock;
