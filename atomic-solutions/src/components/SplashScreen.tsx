import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

const SplashScreen: React.FC = () => {
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
        <Logo size="lg" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2 uppercase">ATOMIC SOLUTIONS</h1>
          <p className="text-teal font-medium italic tracking-widest text-sm">"We Bring Comfort Life"</p>
        </motion.div>
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
