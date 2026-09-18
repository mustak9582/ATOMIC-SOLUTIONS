import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ViewMode = 'desktop' | 'mobile';

interface ViewModeContextType {
  viewMode: ViewMode;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  isMobileDevice: boolean;
  isStandaloneApp: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'atomic_view_mode';
const DESKTOP_WIDTH = 1200;

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if opened as standalone PWA
  const isStandaloneApp = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  // Detect physical mobile/tablet device
  const checkIsMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    return isMobileUA || window.screen.width < 1024;
  };

  const [isMobileDevice, setIsMobileDevice] = useState(checkIsMobileDevice);

  // User requested: mobile app jab open karte hai to desktop version me open hona chahiye.
  // Default to 'desktop' unless explicitly toggled by user.
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mobile' || saved === 'desktop') {
      return saved;
    }
    return 'desktop';
  });

  const applyViewport = useCallback((mode: ViewMode) => {
    if (typeof document === 'undefined') return;

    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }

    if (mode === 'desktop') {
      // Calculate scale to fit 1200px into mobile device screen width cleanly
      const screenWidth = typeof window !== 'undefined' ? (window.screen.width || 390) : 390;
      const initialScale = Math.min(1, Number((screenWidth / DESKTOP_WIDTH).toFixed(3)));

      viewportMeta.setAttribute(
        'content',
        `width=${DESKTOP_WIDTH}, initial-scale=${initialScale}, minimum-scale=0.2, maximum-scale=5.0, user-scalable=yes`
      );

      document.documentElement.classList.add('desktop-mode-active');
      document.body.classList.add('desktop-mode-active');
    } else {
      // Standard responsive mobile viewport
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, viewport-fit=cover'
      );

      document.documentElement.classList.remove('desktop-mode-active');
      document.body.classList.remove('desktop-mode-active');
    }
  }, []);

  useEffect(() => {
    applyViewport(viewMode);
  }, [viewMode, applyViewport]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(checkIsMobileDevice());
      if (viewMode === 'desktop') {
        applyViewport('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [viewMode, applyViewport]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors in private browsing
    }
    applyViewport(mode);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop');
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        toggleViewMode,
        setViewMode,
        isMobileDevice,
        isStandaloneApp,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};
