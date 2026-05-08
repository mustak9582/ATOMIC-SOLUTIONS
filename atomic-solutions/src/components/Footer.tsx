import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin, ShieldCheck, Heart, LayoutGrid, Globe, PhoneCall } from 'lucide-react';
import Logo from './Logo';
import { WHATSAPP_NUMBER, INSTAGRAM_URL, YOUTUBE_URL, PHONE_NUMBER, FACEBOOK_URL } from '../constants';

export default function Footer() {
  return (
    <footer className="bg-navy pt-24 pb-12 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-[100px] -mr-48 -mt-48" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          
          <div className="md:col-span-4 space-y-8">
            <Logo size="lg" />
            <p className="text-silver font-medium leading-relaxed max-w-sm italic">
              "We Bring Comfort Life - Atomic Solutions is your premier partner for construction, interior, and essential home services."
            </p>
            <div className="flex space-x-4">
              <SocialLink href={FACEBOOK_URL} icon={<Facebook size={22} />} />
              <SocialLink href={INSTAGRAM_URL} icon={<Instagram size={22} />} />
              <SocialLink href={YOUTUBE_URL} icon={<Youtube size={22} />} />
              <SocialLink href={`https://wa.me/${WHATSAPP_NUMBER}`} icon={<Phone size={22} />} />
              <SocialLink href={`tel:${PHONE_NUMBER.replace(/\s+/g, '')}`} icon={<PhoneCall size={22} />} />
            </div>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-black mb-8 uppercase tracking-[0.2em] text-teal">Founder</h4>
              <p className="text-xl font-black text-white uppercase tracking-tighter mb-2">Mustak Ansari</p>
              <p className="text-silver text-xs font-bold uppercase tracking-widest leading-relaxed">Binjha, Sonraithari, Deoghar, Jharkhand 814149</p>
            </div>
            <div>
              <h4 className="text-sm font-black mb-8 uppercase tracking-[0.2em] text-teal">Explore</h4>
              <ul className="space-y-4">
                <FooterLink href="#" label="Home" />
                <FooterLink href="https://atomicsolutions.in" label="Website" isExternal />
                <FooterLink href="#services" label="Services" />
                <FooterLink href="/reviews" label="Rate & Review" />
                <FooterLink href="/dashboard/reports" label="Report a Problem" />
                <FooterLink href="/#reviews" label="Testimonials" />
                <FooterLink href="/admin" label="Admin Portal" />
              </ul>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="bg-white p-8 rounded-[40px] flex flex-col items-center text-center shadow-2xl relative">
              <div className="absolute -top-6 bg-gold text-navy font-black text-[10px] uppercase tracking-[0.2em] px-6 py-2 rounded-full">SCAN ME!</div>
              <div className="w-48 h-48 bg-white rounded-3xl mb-6 flex items-center justify-center p-4 overflow-hidden border-4 border-navy/5">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`BEGIN:VCARD\nVERSION:3.0\nN:Ansari;Mustak;;;\nFN:Mustak Ansari\nORG:Atomic Solutions\nTEL;TYPE=WORK,VOICE:+919582268658\nTEL;TYPE=CELL,VOICE:+919582268658\nEMAIL;TYPE=PREF,INTERNET:atomichvacsolutions@gmail.com\nURL:https://atomicsolutions.in\nADR;TYPE=WORK:;;Binjha, Sonraithari;Deoghar;JH;814149;India\nEND:VCARD`)}`} 
                  alt="Atomic Solutions Contact QR" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-navy font-black text-xs uppercase tracking-widest leading-tight">
                Scan to Save<br />Contact Details
              </p>
            </div>
          </div>

        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:grid md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center gap-3 text-silver">
             <ShieldCheck className="text-teal" size={24} />
             <span className="text-[10px] font-black uppercase tracking-widest">100% Quality Guaranteed</span>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
              © {new Date().getFullYear()} Atomic Solutions. All Rights Reserved.
            </p>
          </div>
          <div className="md:justify-self-end">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
              Made with <Heart size={12} className="text-teal fill-teal" /> for Atomic Solutions
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-teal hover:text-white transition-all border border-white/10"
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
