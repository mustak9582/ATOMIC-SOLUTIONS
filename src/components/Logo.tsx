import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { AppSettings } from '../types';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>("/logo_small.png");

  useEffect(() => {
    const unsub = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) {
        const settings = data[0] as AppSettings;
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base', sub: 'text-[7px]', imgSize: 32 },
    md: { box: 'w-12 h-12', text: 'text-xl', sub: 'text-[10px]', imgSize: 48 },
    lg: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-[14px]', imgSize: 80 }
  };

  return (
    <Link to="/" className={`block transition-opacity active:opacity-80 ${className}`}>
      <motion.div 
        className="flex items-center space-x-3"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className={`${sizes[size].box} relative flex items-center justify-center`}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Atomic Solutions" className="w-full h-full object-contain" width={sizes[size].imgSize} height={sizes[size].imgSize} />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 10 L15 85 L35 85 L50 50 L65 85 L85 85 Z" fill="#0f172a" />
              <path d="M50 25 L30 75 L40 75 L50 50 L60 75 L70 75 Z" fill="#0f766e" />
              <path d="M45 55 L55 55 L50 42 Z" fill="#d4af37" />
            </svg>
          )}
        </motion.div>
        <div className="flex flex-col">
          <motion.span 
            className={`${sizes[size].text} font-extrabold leading-none`} 
            style={{ 
              color: variant === 'light' ? '#ffffff' : '#0f172a', 
              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
              textShadow: 'none'
            }} 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            Atomic Solutions
          </motion.span>
          <motion.span 
            className={`${sizes[size].sub} font-semibold leading-none mt-1 uppercase tracking-[0.08em]`} 
            style={{ color: variant === 'light' ? '#5eead4' : '#0f766e' }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.22 }}
          >
            WE BRING COMFORT LIFE
          </motion.span>
        </div>
      </motion.div>
    </Link>
  );
}
