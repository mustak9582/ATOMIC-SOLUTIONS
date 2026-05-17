import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

const SplashScreen: React.FC = () => {
  useEffect(() => {
    // Proactively request location on splash screen to get permissions early
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => console.log('Location access granted on splash'),
        (err) => console.log('Location access denied or unavailable on splash:', err.message),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-navy z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decorative Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1.2 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute w-[500px] h-[500px] rounded-full border border-teal blur-3xl"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Logo size="lg" variant="light" />
      </motion.div>

      {/* Progress Line */}
      <div className="absolute bottom-20 w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-teal w-full"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
