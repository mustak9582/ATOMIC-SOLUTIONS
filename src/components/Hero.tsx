import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  ThumbsUp, 
  ArrowRight
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
    <div className="relative min-h-[88vh] flex items-center overflow-hidden bg-navy">
      {/* Background with Professional Image and Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=1200&auto=format&fit=crop&fm=webp" 
          srcSet="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=640&auto=format&fit=crop&fm=webp 640w, https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=1200&auto=format&fit=crop&fm=webp 1200w, https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=1600&auto=format&fit=crop&fm=webp 1600w"
          sizes="100vw"
          alt="Premium finished home interior showcasing Atomic Solutions quality" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          fetchPriority="high"
          loading="eager"
          width={1200}
          height={800}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/82 to-navy/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-16 pb-24">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-7"
          >
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-100 backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-teal" />
                Verified field teams for Deoghar homes
              </motion.div>
              
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold text-white leading-[0.94] relative">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block"
                >
                  Atomic Solutions
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block text-teal-100"
                >
                  Premium home services
                </motion.span>
              </h1>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/70 text-base sm:text-xl font-medium max-w-2xl leading-relaxed pt-1"
            >
              HVAC, construction, interiors, repairs, and home planning handled with clear pricing, accountable professionals, and the finish quality customers expect from a premium service partner.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={scrollToServices}
                className="bg-teal hover:bg-[#0d9488] text-white font-bold h-14 px-9 rounded-lg text-sm shadow-[0_20px_40px_-18px_rgba(15,118,110,0.9)] transition-all duration-300 group hover:-translate-y-0.5"
              >
                Explore services
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline"
                  className="border-white/15 bg-white/10 text-white font-bold h-14 px-9 rounded-lg text-sm hover:bg-white hover:text-navy backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                  onClick={handleWhatsApp}
                >
                  Book consultation
                </Button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-[11px] font-bold text-white/55 hover:text-teal-100 uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 group"
                >
                  Professional partner? <span className="text-teal-100 group-hover:underline">Join the network</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          <FeatureItem icon={<ShieldCheck className="w-5 h-5" />} text="Quality Assured" delay={0.6} />
          <FeatureItem icon={<Users className="w-5 h-5" />} text="Expert Team" delay={0.7} />
          <FeatureItem icon={<Clock className="w-5 h-5" />} text="On-Time Delivery" delay={0.8} />
          <FeatureItem icon={<ThumbsUp className="w-5 h-5" />} text="Happy Clients" delay={0.9} />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text, delay }: { icon: React.ReactNode, text: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-4 text-white backdrop-blur-md shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)]"
    >
      <div className="icon-tile h-10 w-10 bg-teal/15 text-teal-100">
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em]">{text}</span>
    </motion.div>
  );
}
