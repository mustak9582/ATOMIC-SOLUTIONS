import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useViewMode } from '../contexts/ViewModeContext';
import { toast } from 'sonner';

interface ViewModeToggleProps {
  variant?: 'floating' | 'inline' | 'compact';
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  variant = 'floating',
  className = '',
}) => {
  const { viewMode, toggleViewMode, isMobileDevice } = useViewMode();

  // If user is on a large desktop monitor (>= 1200px screen), the floating toggle isn't needed
  if (variant === 'floating' && !isMobileDevice && typeof window !== 'undefined' && window.screen.width >= 1200) {
    return null;
  }

  const handleToggle = () => {
    const nextMode = viewMode === 'desktop' ? 'mobile' : 'desktop';
    toggleViewMode();
    toast.info(
      nextMode === 'desktop'
        ? '🖥️ Desktop View enabled (1200px full view)'
        : '📱 Mobile View enabled (responsive mode)',
      { duration: 2500 }
    );
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
          viewMode === 'desktop'
            ? 'bg-navy/10 text-navy hover:bg-navy/20'
            : 'bg-teal/10 text-teal hover:bg-teal/20'
        } ${className}`}
        title={`Current view: ${viewMode}. Click to switch.`}
      >
        {viewMode === 'desktop' ? (
          <>
            <Monitor size={14} className="text-teal" />
            <span className="uppercase tracking-wider">Desktop Mode</span>
          </>
        ) : (
          <>
            <Smartphone size={14} className="text-navy" />
            <span className="uppercase tracking-wider">Mobile Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
          viewMode === 'desktop'
            ? 'bg-navy text-white border-teal/40'
            : 'bg-white text-navy border-slate-200'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {viewMode === 'desktop' ? (
            <Monitor size={16} className="text-teal" />
          ) : (
            <Smartphone size={16} className="text-navy" />
          )}
          <span>{viewMode === 'desktop' ? 'Desktop View (Active)' : 'Mobile View (Active)'}</span>
        </div>
        <span className="text-[9px] text-teal font-extrabold px-2 py-0.5 rounded-full bg-teal/10">
          Tap to switch
        </span>
      </button>
    );
  }

  // Floating pill variant - positioned at bottom right, just above bottom bar or offset from bots
  return (
    <div
      className={`fixed bottom-20 right-4 z-[9995] pointer-events-auto transition-transform ${className}`}
      style={{ filter: 'drop-shadow(0 8px 20px rgba(15, 23, 42, 0.25))' }}
    >
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-navy/95 text-white border border-teal/40 hover:bg-teal hover:text-navy transition-all active:scale-95 text-[11px] font-black uppercase tracking-wider backdrop-blur-md cursor-pointer"
        title="Toggle between Desktop Mode and Mobile Mode"
        aria-label="Toggle Desktop or Mobile View"
      >
        {viewMode === 'desktop' ? (
          <>
            <Monitor size={14} className="text-teal" />
            <span>Desktop View</span>
          </>
        ) : (
          <>
            <Smartphone size={14} className="text-teal" />
            <span>Mobile View</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ViewModeToggle;
