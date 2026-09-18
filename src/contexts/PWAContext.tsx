import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
  isIOSModalOpen: boolean;
  openIOSModal: () => void;
  closeIOSModal: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredPWAInstallPrompt) {
      return (window as any).deferredPWAInstallPrompt;
    }
    return null;
  });

  const [canInstall, setCanInstall] = useState(() => {
    return typeof window !== 'undefined' && !!(window as any).deferredPWAInstallPrompt;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  // Check standalone mode (already running as installed app)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  // Check iOS device
  const isIOS = typeof window !== 'undefined' && (
    /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
  );

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check if early capture in index.html already got the prompt
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      setCanInstall(true);
    }

    const handlePromptAvailable = (e: any) => {
      const prompt = e.detail || (window as any).deferredPWAInstallPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        setCanInstall(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
      toast.success('🎉 Atomic Solutions app installed successfully!');
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = async () => {
    if (isInstalled || isStandalone) {
      toast.success('Atomic Solutions App is already installed on your device!');
      return;
    }

    // Get prompt either from state or window global
    let prompt = deferredPrompt || (window as any).deferredPWAInstallPrompt;

    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          toast.success('Installing Atomic Solutions App...');
          setIsInstalled(true);
          setCanInstall(false);
        }
        setDeferredPrompt(null);
        (window as any).deferredPWAInstallPrompt = null;
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
      return;
    }

    if (isIOS) {
      setIsIOSModalOpen(true);
      return;
    }

    // Wait briefly in case the prompt arrives right after click
    toast.loading('Starting installation...', { id: 'pwa-install', duration: 1500 });

    setTimeout(async () => {
      const delayedPrompt = deferredPrompt || (window as any).deferredPWAInstallPrompt;
      toast.dismiss('pwa-install');
      if (delayedPrompt) {
        try {
          await delayedPrompt.prompt();
          const choice = await delayedPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            setIsInstalled(true);
            setCanInstall(false);
          }
          setDeferredPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
        } catch (e) {
          console.error(e);
        }
      } else {
        toast.info('Look for the install icon in your address bar or confirm the prompt.', { duration: 3000 });
      }
    }, 500);
  };

  const openIOSModal = () => setIsIOSModalOpen(true);
  const closeIOSModal = () => setIsIOSModalOpen(false);

  return (
    <PWAContext.Provider
      value={{
        canInstall,
        isInstalled,
        isStandalone,
        isIOS,
        promptInstall,
        isIOSModalOpen,
        openIOSModal,
        closeIOSModal,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
