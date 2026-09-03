import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CORE_SERVICES, WHATSAPP_NUMBER } from '../constants';
import { Service } from '../types';
import { dataService } from '../services/firebaseService';
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Comfort: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  Utility: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  Building: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  Interior: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  Finish: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  Planning: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20' },
};

export default function ServicesSection() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [whatsapp, setWhatsapp] = useState(WHATSAPP_NUMBER);

  useEffect(() => {
    const unsub = dataService.subscribe('services', (data) => {
      if (data.length > 0) {
        const merged = [...CORE_SERVICES];
        (data as Service[]).forEach(fsService => {
          const index = merged.findIndex(s => s.id === fsService.id);
          if (index !== -1) merged[index] = { ...merged[index], ...fsService };
          else merged.push(fsService);
        });
        setServices(merged);
      }
    });

    const unsubSettings = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) setWhatsapp((data[0] as any).whatsappNumber || WHATSAPP_NUMBER);
    });

    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  const activeServices = [...services]
    .filter(s => s.isActive !== false)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  return (
    <section id="services" className="py-20 sm:py-28 bg-slate-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 rounded-full border border-teal/20 text-teal text-xs font-bold uppercase tracking-[0.2em] mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal" />
            Our Core Services
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-navy tracking-tight leading-tight"
          >
            Select A Service To <br className="hidden sm:block" />
            <span className="text-teal">View Details &amp; Book</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg font-medium mt-4 leading-relaxed"
          >
            Click any category below to view all sub-options, transparent labour &amp; material rates, photo galleries, and book your service.
          </motion.p>
        </div>

        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {activeServices.map((service, index) => {
            const badgeStyle = CATEGORY_COLORS[service.category] || { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20' };
            const subCount = service.subCategories?.length || 0;
            const targetUrl = `/service/${service.id.toLowerCase().replace(/\s+/g, '-')}`;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(targetUrl)}
                className="group bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-[0_4px_24px_-10px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.15)] hover:border-teal/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative h-56 sm:h-60 overflow-hidden bg-slate-100">
                  <img
                    src={service.images?.[0] || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop'}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />

                  {/* Category Pill */}
                  <div className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md bg-white/90 ${badgeStyle.text} ${badgeStyle.border} shadow-sm`}>
                    {service.category}
                  </div>

                  {/* Option Count Pill */}
                  <div className="absolute top-4 right-4 bg-navy/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10">
                    {subCount} {subCount === 1 ? 'Option' : 'Options'}
                  </div>

                  {/* Title overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-extrabold text-xl sm:text-2xl leading-tight group-hover:text-teal-100 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                </div>

                {/* Card Content & Action */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5 text-teal">
                      <ShieldCheck className="w-4 h-4" /> Verified Experts
                    </span>
                    <span className="text-slate-400">Fixed &amp; Transparent Rates</span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      className="w-full h-12 rounded-2xl bg-slate-50 group-hover:bg-teal text-navy group-hover:text-white flex items-center justify-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-sm group-hover:shadow-[0_12px_24px_-10px_rgba(15,118,110,0.6)]"
                    >
                      <span>View Rates &amp; Book</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom WhatsApp Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-20 p-8 sm:p-12 rounded-[32px] bg-gradient-to-br from-navy to-navy/90 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
        >
          <div className="text-center md:text-left space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold">Need a Custom Requirement or Site Visit?</h3>
            <p className="text-white/65 text-sm sm:text-base font-medium max-w-xl">
              Talk directly with our founder &amp; engineering team on WhatsApp for free estimates and consultation.
            </p>
          </div>
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi Mustak, I want to discuss a custom service requirement.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat With Admin
          </a>
        </motion.div>

      </div>
    </section>
  );
}
