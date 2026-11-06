import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'dropdown' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className, 
  variant = 'pill',
  theme = 'auto'
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black transition-all border shadow-sm",
          theme === 'dark'
            ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
            : "bg-slate-100 text-navy border-gray-200 hover:bg-slate-200",
          className
        )}
        title={language === 'en' ? 'Switch to Hindi (हिंदी)' : 'Switch to English'}
        aria-label="Toggle language"
      >
        <Globe size={13} className="text-teal" />
        <span className="font-extrabold">{language === 'en' ? 'EN' : 'हिन्दी'}</span>
      </button>
    );
  }

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-2xl border transition-colors shadow-sm",
        isDark 
          ? "bg-white/10 backdrop-blur-md border-white/20 text-white" 
          : isLight
          ? "bg-slate-100 border-gray-200 text-navy"
          : "bg-slate-100/90 border-gray-200/90 text-navy",
        className
      )}
      role="group"
      aria-label="Language Selector"
    >
      <div className="pl-2 pr-0.5 text-teal flex items-center">
        <Globe size={14} />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          "px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
          language === 'en'
            ? isDark
              ? "bg-teal text-navy shadow-md shadow-teal/20 font-black"
              : "bg-[#001f3f] text-teal shadow-md shadow-navy/20 font-black"
            : isDark
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-gray-600 hover:text-navy hover:bg-white font-bold"
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={cn(
          "px-2.5 py-1 rounded-xl text-[11px] font-black transition-all",
          language === 'hi'
            ? isDark
              ? "bg-teal text-navy shadow-md shadow-teal/20 font-black"
              : "bg-[#001f3f] text-teal shadow-md shadow-navy/20 font-black"
            : isDark
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-gray-600 hover:text-navy hover:bg-white font-bold"
        )}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageToggle;
