import React, { createContext, useContext, useEffect } from 'react';

export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (en: string, hi?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always lock application language to English
  useEffect(() => {
    try {
      localStorage.setItem('atomic_app_language', 'en');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const language: Language = 'en';

  const setLanguage = (_lang: Language) => {
    // English only across entire portal
  };

  const toggleLanguage = () => {
    // English only across entire portal
  };

  // Strictly return the English string at all times
  const t = (en: string, _hi?: string): string => {
    return en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (en: string, _hi?: string) => en
    };
  }
  return context;
};
