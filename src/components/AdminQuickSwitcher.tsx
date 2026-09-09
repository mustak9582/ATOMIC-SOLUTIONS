import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const AdminQuickSwitcher: React.FC = () => {
  const { hasAdminPrivilege, switchToAdmin, viewAsCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show ONLY to administrators when they are viewing customer-facing pages
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/billing';
  const isLoginRoute = location.pathname === '/login';

  if (!hasAdminPrivilege || isAdminRoute || isLoginRoute) {
    return null;
  }

  const handleSwitchToAdmin = () => {
    switchToAdmin();
    toast.success('Switched to Admin Panel');
    navigate('/admin');
  };

  return (
    <div 
      className="fixed bottom-6 left-4 sm:left-6 z-[9990] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      style={{ filter: 'drop-shadow(0 12px 24px rgba(10, 25, 47, 0.35))' }}
    >
      <button
        onClick={handleSwitchToAdmin}
        className="group flex items-center gap-2.5 sm:gap-3 bg-navy/95 hover:bg-teal text-white hover:text-navy px-3.5 sm:px-4 py-2.5 rounded-full border-2 border-teal/70 hover:border-navy shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md"
        title="Switch to Admin Panel"
        aria-label="Switch to Admin Panel"
      >
        {/* Pulsing Admin Indicator */}
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-75 animate-ping group-hover:bg-navy" />
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal/20 group-hover:bg-navy flex items-center justify-center text-teal group-hover:text-teal transition-colors">
            <ShieldCheck size={17} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white group-hover:text-navy transition-colors whitespace-nowrap">
              Switch to Admin Panel
            </span>
            <ArrowRight size={13} className="text-teal group-hover:text-navy group-hover:translate-x-1 transition-all" />
          </div>
          <span className="block text-[8px] font-bold text-teal/80 group-hover:text-navy/70 uppercase tracking-widest leading-tight">
            {viewAsCustomer ? 'Admin Mode (Customer View)' : 'Admin Session Active'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default AdminQuickSwitcher;
