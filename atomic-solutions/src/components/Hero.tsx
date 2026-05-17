import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  Banknote, 
  ThumbsUp, 
  ArrowRight,
  Play
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';
import { formatWhatsAppLink } from '../lib/utils';

export default function Hero() {
  const handleWhatsApp = () => {
    window.open(formatWhatsAppLink(WHATSAPP_NUMBER, "Hi Mustak, I want to book a consultation for Atomic Solutions services."), '_blank');
  };

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0A192F]">
      {/* Background with Professional Image and Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop" 
          alt="Modern Interior" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20 pb-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div />
              
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase relative">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block"
                >
                  RESIDENTIAL & <span className="text-teal drop-shadow-[0_0_15px_rgba(0,128,128,0.3)]">COMMERCIAL</span>
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block text-white"
                >
                  CONSTRUCTION <span className="text-white/40">MASTERY</span>
                </motion.span>
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 py-1 px-3 bg-teal/10 rounded-full border border-teal/20 w-fit"
              >
                <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                <span className="text-teal font-black text-[10px] uppercase tracking-[0.3em]">
                  EXCELLENCE IN EVERY DIMENSION
                </span>
              </motion.div>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/60 text-base sm:text-lg font-medium max-w-lg leading-relaxed pt-2"
            >
              Delivering modern construction and premium solutions for high-end residential and commercial projects. Professional execution and unmatched craftsmanship.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-5 pt-8">
              <Button 
                onClick={scrollToServices}
                className="bg-teal hover:bg-teal/90 text-white font-black h-16 px-12 rounded-2xl text-xs tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(0,128,128,0.3)] transition-all duration-300 group hover:-translate-y-1"
              >
                EXPLORE SERVICES
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline"
                  className="border-white/10 text-white/80 font-black h-16 px-12 rounded-2xl text-xs tracking-[0.2em] hover:bg-white/5 hover:text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
                  onClick={handleWhatsApp}
                >
                  BOOK CONSULTATION
                </Button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-[10px] font-black text-white/40 hover:text-teal uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-2 group"
                >
                  Are you a Professional? <span className="text-teal group-hover:underline">Join our team</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          <FeatureItem icon={<ShieldCheck className="w-5 h-5" />} text="Quality Assured" />
          <FeatureItem icon={<Users className="w-5 h-5" />} text="Expert Team" />
          <FeatureItem icon={<Clock className="w-5 h-5" />} text="On-Time Delivery" />
          <FeatureItem icon={<ThumbsUp className="w-5 h-5" />} text="Happy Clients" />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5"
    >
      <div className="p-2 bg-teal/10 rounded-xl text-teal">
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">{text}</span>
    </motion.div>
  );
}

function LogoIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M50 10 L15 85 L85 85 Z" fill="none" stroke="currentColor" strokeWidth="8" />
      <path d="M50 30 L30 75 L70 75 Z" fill="currentColor" />
    </svg>
  );
}
