import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';

export const IOSInstallModal: React.FC = () => {
  const { isIOSModalOpen, closeIOSModal } = usePWA();

  if (!isIOSModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-2xl border border-teal/20 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={closeIOSModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center text-teal">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-navy uppercase tracking-tight">
                Install Atomic App
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                For iPhone & iPad
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-5">
            Install this web app to your home screen for quick 1-tap bookings and full offline support.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-navy font-semibold">
                Tap the <strong className="text-teal font-black inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm"><Share size={12} /> Share</strong> button in Safari's bottom toolbar.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-navy font-semibold">
                Scroll down and tap <strong className="text-teal font-black inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm"><PlusSquare size={12} /> Add to Home Screen</strong>.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs text-navy font-semibold">
                Tap <strong className="text-teal font-black inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm"><CheckCircle size={12} /> Add</strong> in the top right corner.
              </div>
            </div>
          </div>

          <button
            onClick={closeIOSModal}
            className="w-full h-12 rounded-xl bg-navy text-white text-xs font-black uppercase tracking-wider hover:bg-teal transition-colors shadow-lg cursor-pointer"
          >
            Got It
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IOSInstallModal;
