import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Sparkles } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';
import { motion, AnimatePresence } from 'motion/react';

interface InstallAppButtonProps {
  variant?: 'navbar' | 'drawer' | 'banner' | 'footer' | 'pill';
  className?: string;
  onInstalledAction?: () => void;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'navbar',
  className = '',
  onInstalledAction,
}) => {
  const { promptInstall, isInstalled, isStandalone } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed and running as standalone app, don't show the banner or install prompt
  if (isStandalone && (variant === 'banner' || variant === 'navbar')) {
    return null;
  }

  const handleClick = async () => {
    await promptInstall();
    if (onInstalledAction) {
      onInstalledAction();
    }
  };

  // 1. NAVBAR VARIANT (Desktop & Mobile header)
  if (variant === 'navbar') {
    if (isInstalled || isStandalone) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-[10px] font-black uppercase tracking-wider ${className}`}>
          <Check size={12} className="stroke-[3]" />
          <span>App Installed</span>
        </span>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-teal to-[#0d9488] text-white shadow-md shadow-teal/20 hover:shadow-lg hover:shadow-teal/30 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
        title="Install Atomic Solutions App on your device"
        aria-label="Install Atomic Solutions App"
      >
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
        />
        <Download size={13} className="text-white group-hover:translate-y-0.5 transition-transform" />
        <span className="whitespace-nowrap">Install App</span>
      </motion.button>
    );
  }

  // 2. DRAWER VARIANT (In Mobile Navigation Drawer Menu)
  if (variant === 'drawer') {
    return (
      <div className={`bg-gradient-to-br from-navy via-slate-900 to-navy text-white p-5 rounded-[28px] border border-teal/30 shadow-xl relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-teal text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            <span>ATOMIC APP</span>
          </div>
          {isInstalled || isStandalone ? (
            <span className="text-[8px] bg-teal/20 text-teal font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Check size={10} /> Installed
            </span>
          ) : (
            <span className="text-[8px] bg-teal/20 text-teal font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Free Download
            </span>
          )}
        </div>

        <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 relative z-10">
          Atomic Solutions App
        </h4>
        <p className="text-[11px] text-slate-300 font-medium mb-4 leading-relaxed relative z-10">
          Instant 1-tap bookings, service tracking &amp; full offline rate list.
        </p>

        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal hover:bg-white text-navy font-black text-xs uppercase tracking-wider shadow-lg shadow-teal/30 hover:text-navy transition-all active:scale-95 cursor-pointer relative z-10"
        >
          <Download size={15} />
          <span>{isInstalled || isStandalone ? 'App Already Installed' : 'Install App / ऐप इंस्टॉल करें'}</span>
        </button>
      </div>
    );
  }

  // 3. BANNER VARIANT (Dismissible floating banner at bottom of screen)
  if (variant === 'banner') {
    if (isDismissed || isInstalled || isStandalone) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-navy/95 backdrop-blur-md text-white p-4 rounded-3xl border border-teal/40 shadow-2xl ${className}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal/20 flex items-center justify-center text-teal shrink-0 mt-0.5">
              <Smartphone size={20} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                Install Atomic App <Sparkles size={12} className="text-teal" />
              </h5>
              <p className="text-[11px] text-slate-300 font-medium leading-snug mt-0.5">
                Fast booking, direct offline access &amp; instant notifications.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleClick}
                  className="px-4 py-2 rounded-xl bg-teal hover:bg-teal/80 text-navy font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  Install Now
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 4. FOOTER VARIANT
  if (variant === 'footer') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 text-silver hover:text-teal text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${className}`}
        title="Install Atomic Solutions Web App"
      >
        <Download size={14} className="text-teal" />
        <span>{isInstalled || isStandalone ? 'App Installed' : 'Install App'}</span>
      </button>
    );
  }

  return null;
};

export default InstallAppButton;
