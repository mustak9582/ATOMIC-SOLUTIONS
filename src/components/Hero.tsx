import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  ArrowRight,
  Award,
  Phone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';
import { formatWhatsAppLink } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1600&auto=format&fit=crop',
];

const STATS = [
  { value: '500+', label: 'Satisfied Clients' },
  { value: '11', label: 'Core Services' },
  { value: '100%', label: 'Work Guarantee' },
  { value: '2 hrs', label: 'Avg. Response' },
];

export default function Hero() {
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleWhatsApp = () => {
    window.open(formatWhatsAppLink(WHATSAPP_NUMBER, "Hi Atomic Team, I want to book a consultation for Atomic Solutions services."), '_blank');
  };

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[92vh] sm:min-h-[88vh] flex flex-col justify-between overflow-hidden bg-navy text-white">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentImg}
            src={HERO_IMAGES[currentImg]}
            alt="Atomic Solutions Services"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/30" />
      </div>

      {/* Decorative Glow Orb */}
      <div className="absolute top-1/3 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-teal/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-28 pb-16 sm:py-24 my-auto">
        <div className="max-w-3xl space-y-7">
          
          {/* Verified Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-teal/30 bg-teal/15 px-4 py-2 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-100">
              #1 Engineering &amp; Home Maintenance Partner · Deoghar
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-2"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              We Bring Comfort <br />
              <span style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                To Your Home Life
              </span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/75 text-base sm:text-xl font-medium leading-relaxed max-w-2xl"
          >
            All home services in one place — HVAC, Electrical, Civil Construction, Plumbing, False Ceiling, Tiles, Carpentry, Painting &amp; Architecture Planning. Verified rates, fast booking, guaranteed quality.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
          >
            <Button
              onClick={scrollToServices}
              className="bg-teal hover:bg-[#0d9488] text-white font-bold h-14 px-8 rounded-2xl text-sm sm:text-base shadow-[0_20px_40px_-16px_rgba(15,118,110,0.8)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] group flex items-center justify-center gap-2"
            >
              Browse All Services
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-navy font-bold h-14 px-8 rounded-2xl text-sm sm:text-base backdrop-blur-md transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-teal" />
              Book on WhatsApp
            </Button>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-white/60 text-xs font-semibold"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              <span>Transparent Rates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              <span>Verified Technicians</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              <span>Digital Invoices &amp; Warranty</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Stats Bar at Bottom */}
      <div className="relative z-10 border-t border-white/10 bg-navy/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-x divide-white/5">
            {STATS.map((stat, i) => (
              <div key={i} className={`text-center ${i !== 0 ? 'pl-4 sm:pl-6' : ''}`}>
                <div className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
