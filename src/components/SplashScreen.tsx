import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';

const SplashScreen: React.FC<{ isLeaving?: boolean }> = ({ isLeaving = false }) => {

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-navy"
      aria-label="Loading Atomic Solutions"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.25 }}
        animate={{ opacity: isLeaving ? 0 : 0.16, scale: isLeaving ? 1.08 : 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute h-[28rem] w-[28rem] rounded-full bg-teal blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={isLeaving ? { opacity: 0, y: -10, scale: 1.02 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: isLeaving ? 0.34 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <Logo size="lg" variant="light" />
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={isLeaving ? { opacity: 0 } : { opacity: 0.58, y: 0 }}
          transition={{ delay: isLeaving ? 0 : 0.38, duration: 0.4 }}
          className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-teal-100"
        >
          Home services, made simple
        </motion.p>
      </motion.div>

      <div className="absolute bottom-16 h-px w-40 overflow-hidden rounded-full bg-white/15">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: isLeaving ? '0%' : '0%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-full bg-teal"
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;
