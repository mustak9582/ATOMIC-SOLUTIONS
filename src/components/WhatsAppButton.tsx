import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { WHATSAPP_NUMBER } from '../constants';
import { formatWhatsAppLink } from '../lib/utils';
import { dataService } from '../services/firebaseService';
import { AppSettings } from '../types';

export default function WhatsAppButton() {
  const [whatsappNumber, setWhatsappNumber] = useState<string>(WHATSAPP_NUMBER);
  const [companyName, setCompanyName] = useState<string>('Atomic Solutions');

  useEffect(() => {
    const unsub = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) {
        const settings = data[0] as AppSettings;
        if (settings.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
        if (settings.companyName) setCompanyName(settings.companyName);
      }
    });
    return () => unsub();
  }, []);

  const handleClick = () => {
    const message = `Hello ${companyName}, I'm interested in your services. Could you please provide more information?`;
    window.open(formatWhatsAppLink(whatsappNumber, message), '_blank');
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 z-[60] bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-white flex items-center justify-center group"
      title="Chat with us on WhatsApp"
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6 md:w-8 md:h-8" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 ease-in-out font-semibold text-sm md:text-base whitespace-nowrap">
        WhatsApp Inquiry
      </span>
    </motion.button>
  );
}
