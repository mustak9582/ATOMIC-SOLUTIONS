import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart, LayoutGrid, Globe, PhoneCall, Facebook, Instagram, Youtube, Phone, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { WHATSAPP_NUMBER, INSTAGRAM_URL, YOUTUBE_URL, PHONE_NUMBER, FACEBOOK_URL } from '../constants';
import { formatWhatsAppLink } from '../lib/utils';

export default function Footer() {
  return (
    <footer id="contact" className="bg-navy pt-20 pb-10 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-4 space-y-8"
          >
            <Logo size="lg" variant="light" />
            <p className="text-slate-300 font-medium leading-relaxed max-w-sm">
              Atomic Solutions is your premium partner for HVAC, construction, interiors, and essential home services.
            </p>
            <div className="flex space-x-4">
              <SocialLink href={FACEBOOK_URL} icon={<Facebook size={22} />} label="Facebook" />
              <SocialLink href={INSTAGRAM_URL} icon={<Instagram size={22} />} label="Instagram" />
              <SocialLink href={YOUTUBE_URL} icon={<Youtube size={22} />} label="YouTube" />
              <SocialLink href={formatWhatsAppLink(WHATSAPP_NUMBER)} icon={<Phone size={22} />} label="WhatsApp" />
              <SocialLink href={`tel:${PHONE_NUMBER.replace(/\s+/g, '')}`} icon={<PhoneCall size={22} />} label="Call us" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-4 grid grid-cols-2 gap-8"
          >
            <div>
              <h4 className="text-sm font-black mb-8 uppercase tracking-[0.2em] text-teal">Founder</h4>
              <p className="text-xl font-black text-white uppercase tracking-tighter mb-2">Mustak Ansari</p>
              <p className="text-silver text-xs font-bold uppercase tracking-widest leading-relaxed">Binjha, Sonraithari, Deoghar, Jharkhand 814149</p>
            </div>
            <div>
              <h4 className="text-sm font-black mb-8 uppercase tracking-[0.2em] text-teal">Explore</h4>
              <ul className="space-y-4">
                <FooterLink href="#" label="Home" />
                <FooterLink href="#services" label="Services" />
                <FooterLink href="/dashboard/reports" label="Report a Problem" />
                <FooterLink href="/admin" label="Admin Portal" />
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4"
          >
            <div className="bg-white p-8 rounded-lg flex flex-col items-center text-center shadow-[0_24px_55px_-24px_rgba(0,0,0,0.42)] relative">
              <div className="absolute -top-5 bg-teal text-white font-bold text-[10px] uppercase tracking-[0.2em] px-6 py-2 rounded-full">Scan contact</div>
              <div className="w-48 h-48 bg-white rounded-lg mb-6 flex items-center justify-center p-4 overflow-hidden border border-slate-100">
                <img 
                  src="/qr-code_small.jpeg" 
                  alt="Scan to save Atomic Solutions contact details" 
                  className="w-full h-full object-contain"
                  width={192}
                  height={192}
                  loading="lazy"
                />
              </div>
              <p className="text-navy font-extrabold text-xs uppercase tracking-widest leading-tight">
                Scan to Save<br />Contact Details
              </p>
            </div>
          </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="pt-12 border-t border-white/10 flex flex-col md:grid md:grid-cols-3 gap-8 items-center"
        >
          <div className="flex items-center gap-3 text-silver">
             <ShieldCheck className="text-teal" size={24} />
             <span className="text-[10px] font-bold uppercase tracking-widest">100% Quality Guaranteed</span>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
              © {new Date().getFullYear()} Atomic Solutions. All Rights Reserved.
            </p>
          </div>
          <div className="md:justify-self-end">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
              Built with <Heart size={12} className="text-teal fill-teal" /> for Atomic Solutions
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label={label}
      className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-white hover:bg-teal hover:text-white transition-all border border-white/10 active:scale-[0.98]"
    >
      {icon}
    </a>
  );
}

function FooterLink({ href, label, isExternal }: { href: string, label: string, isExternal?: boolean }) {
  if (isExternal) {
    return (
      <li>
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-silver text-xs font-black uppercase tracking-widest hover:text-teal transition-colors"
        >
          {label}
        </a>
      </li>
    );
  }
  
  if (href.startsWith('/')) {
    return (
      <li>
        <Link 
          to={href} 
          className="text-silver text-xs font-black uppercase tracking-widest hover:text-teal transition-colors"
        >
          {label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a href={href} className="text-silver text-xs font-black uppercase tracking-widest hover:text-teal transition-colors">
        {label}
      </a>
    </li>
  );
}
