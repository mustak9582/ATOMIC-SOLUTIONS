import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { AppSettings } from '../types';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>("https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png");

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
    sm: { box: 'w-8 h-8', text: 'text-base', sub: 'text-[7px]' },
    md: { box: 'w-12 h-12', text: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-[14px]' }
  };

  const floatingTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  return (
    <Link to="/" className={`block transition-opacity active:opacity-80 ${className}`}>
      <motion.div 
        className="flex items-center space-x-3"
        animate={{ y: [0, -10, 0] }}
        transition={floatingTransition}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className={`${sizes[size].box} relative flex items-center justify-center`}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Atomic Solutions" className="w-full h-full object-contain" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 10 L15 85 L35 85 L50 50 L65 85 L85 85 Z" fill="#001f3f" />
              <path d="M50 25 L30 75 L40 75 L50 50 L60 75 L70 75 Z" fill="#008080" />
              <path d="M45 55 L55 55 L50 42 Z" fill="#FFD700" />
            </svg>
          )}
        </motion.div>
        <div className="flex flex-col">
          <motion.span 
            className={`${sizes[size].text} font-black tracking-tight leading-none uppercase`} 
            style={{ color: '#001f3f', fontFamily: 'Montserrat, sans-serif' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Atomic Solutions
          </motion.span>
          <motion.span 
            className={`${sizes[size].sub} font-bold tracking-[0.05em] leading-none mt-1`} 
            style={{ color: '#008080' }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            We Bring Comfort Life
          </motion.span>
        </div>
      </motion.div>
    </Link>
  );
}
