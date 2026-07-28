import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CORE_SERVICES, WHATSAPP_NUMBER } from '../constants';
import { Button } from './ui/button';
import { Play, X, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { dataService } from '../services/firebaseService';
import { Service } from '../types';
import 'swiper/css';
import 'swiper/css/pagination';
import CategoriesModal from './CategoriesModal';
import DirectBookingModal from './DirectBookingModal';

export default function ServiceGrid() {
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [whatsapp, setWhatsapp] = useState(WHATSAPP_NUMBER);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{
    serviceName: string;
    subName: string;
    type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH';
    labourPrice?: number;
    materialPrice?: number;
    staffCategory?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribe('services', (data) => {
      if (data.length > 0) {
        // Merge CORE_SERVICES with Firestore data
        const merged = [...CORE_SERVICES];
        (data as Service[]).forEach(fsService => {
          const index = merged.findIndex(s => s.id === fsService.id);
          if (index !== -1) {
            merged[index] = { ...merged[index], ...fsService };
          } else {
            merged.push(fsService);
          }
        });
        setServices(merged);
      }
    });

    const unsubSettings = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) {
        setWhatsapp((data[0] as any).whatsappNumber || WHATSAPP_NUMBER);
      }
    });

    // Handle hash scrolling on mount and hash change
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#service-')) {
        const id = hash.replace('#', '');
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 500);
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);

    return () => {
      unsub();
      unsubSettings();
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  return (
    <section id="services" className="py-28 bg-slate-app">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-teal/10 rounded-full border border-teal/15 text-teal text-[10px] font-bold uppercase tracking-[0.12em] mb-8 whitespace-nowrap"
          >
            <div className="w-2 h-2 bg-teal rounded-full" />
            Live booking catalog
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-navy mb-6 leading-tight"
          >
            Services built for homes <br />
            <span className="text-teal">that expect better</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Explore transparent service options across maintenance, HVAC, deep cleaning, home planning, and construction. Each request is routed to the right professional team.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {[...services]
            .filter(s => s.isActive !== false)
            .sort((a,b) => (a.sequence || 0) - (b.sequence || 0))
            .map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              index={index}
              onVideoOpen={(id: string) => setActiveVideo(id)}
              whatsapp={whatsapp}
              onOpenModal={() => setSelectedServiceForModal(service)}
              onBook={(subName, type, labourPrice, materialPrice) => setBookingDetails({ 
                serviceName: service.name, 
                subName, 
                type,
                labourPrice,
                materialPrice,
                staffCategory: service.staffCategory
              })}
              onNavigate={() => navigate(`/service/${service.id.toLowerCase().replace(/\s+/g, '-')}`)}
            />
          ))}
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden bg-black shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-xl"
            >
              <X size={24} />
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-view"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <CategoriesModal 
        isOpen={selectedServiceForModal !== null} 
        onClose={() => setSelectedServiceForModal(null)}
        service={selectedServiceForModal}
        whatsapp={whatsapp}
        onBook={(subName, type, labourPrice, materialPrice) => {
          setSelectedServiceForModal(null);
          setBookingDetails({ 
            serviceName: selectedServiceForModal?.name || '', 
            subName, 
            type,
            labourPrice,
            materialPrice,
            staffCategory: selectedServiceForModal?.staffCategory
          });
        }}
      />

      <DirectBookingModal 
        isOpen={bookingDetails !== null}
        onClose={() => setBookingDetails(null)}
        serviceName={bookingDetails?.serviceName || ''}
        subCategoryName={bookingDetails?.subName || ''}
        whatsapp={whatsapp}
        bookingType={bookingDetails?.type || 'GENERAL'}
        labourPrice={bookingDetails?.labourPrice}
        materialPrice={bookingDetails?.materialPrice}
        staffCategory={bookingDetails?.staffCategory}
      />
    </section>
  );
}

interface ServiceCardProps {
  service: Service;
  index: number;
  onVideoOpen: (id: string) => void;
  whatsapp: string;
  onOpenModal: () => void;
  onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice?: number, materialPrice?: number) => void;
  onNavigate: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, onVideoOpen, whatsapp, onOpenModal, onBook, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const myId = `service-${service.id.replace(/\s+/g, '-').toLowerCase()}`;
    if (hash === `#${myId}`) {
      setIsExpanded(true);
    }
  }, [service.id]);

  return (
    <motion.div
      id={`service-${service.id.replace(/\s+/g, '-').toLowerCase()}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden premium-card premium-card-hover rounded-[24px]"
    >
      {/* Level 1: Visuals & Intro */}
      <div className="relative h-[410px] cursor-pointer" onClick={onNavigate}>
        <Swiper
          pagination={{ clickable: true }}
          modules={[Pagination, Autoplay]}
          autoplay={{ delay: 4000 }}
          className="h-full"
        >
          {service.images.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="relative h-full w-full">
                <img src={img} alt={service.name} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="absolute inset-x-0 bottom-0 p-7 pt-20 z-10">
          <div className="flex justify-between items-end gap-6">
            <div className="flex-1">
              <span className="text-teal-100 text-[10px] font-bold uppercase tracking-[0.22em] mb-3 block">{service.category}</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">{service.name}</h3>
              <div 
                className="text-white/70 text-sm font-medium line-clamp-2 max-w-lg mb-2"
                dangerouslySetInnerHTML={{ __html: service.detailedDescription || '' }}
              />
            </div>
            {service.youtubeId && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoOpen(service.youtubeId!);
                }}
                className="w-16 h-16 bg-teal rounded-full flex items-center justify-center text-white shadow-[0_20px_40px_-18px_rgba(15,118,110,0.9)] transition-all duration-300 flex-shrink-0 relative overflow-hidden btn-shine"
              >
                <Play fill="currentColor" size={28} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Level 2 & 3: Sub-categories Expansion */}
      <div className="p-6 md:p-7 pb-8">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h4 className="text-xs font-bold text-teal uppercase tracking-[0.18em]">Service Options</h4>
          {(service.subCategories || []).length > 4 && (
            <motion.button 
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenModal}
              className="text-teal hover:text-navy font-bold text-sm flex items-center gap-2 group/btn transition-all"
            >
              View All {service.subCategories?.length || 0} Categories
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>

        <div className="space-y-4">
          {(service.subCategories || [])
            .slice(0, isExpanded ? undefined : 4)
            .map((sub) => {
            const labourMin = sub.labourMin || sub.minPrice;
            const labourMax = sub.labourMax || sub.maxPrice;
            const materialMin = sub.materialMin || sub.minPrice;
            const materialMax = sub.materialMax || sub.maxPrice;
            const displayUnit = sub.unit ? `/ ${sub.unit}` : '';

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + (isExpanded ? 0 : 0.05) }}
                key={sub.id} 
                className="p-5 bg-slate-50/80 rounded-[24px] border border-slate-100 hover:bg-white hover:border-teal/20 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.35)] transition-all duration-400 hover:-translate-y-1 group/sub"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h5 className="text-navy text-lg font-extrabold group-hover/sub:text-teal transition-colors">{sub.name}</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{service.name} Specialization</span>
                  </div>
                  
                  <div className="flex flex-row flex-wrap gap-4 items-stretch sm:items-center">
                    {/* Labour Option */}
                    {(labourMin > 0 || labourMax > 0) && (
                        <div className="flex items-center gap-4 bg-white p-4 sm:p-5 rounded-[24px] border border-slate-100 flex-1 sm:flex-none sm:min-w-[180px] shadow-sm mb-2 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="flex-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Labour</span>
                          <div className="text-sm font-extrabold text-navy numeric">
                            Rs. {labourMin} <span className="opacity-60 text-[10px] font-sans">{displayUnit}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'LABOUR', labourMin, 0)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-teal text-slate-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 text-[9px] font-bold uppercase tracking-widest active:scale-[0.98] overflow-hidden relative btn-shine"
                        >
                          Labour
                        </button>
                      </div>
                    )}

                    {/* Material Option */}
                    {(materialMin > 0 || materialMax > 0) && (
                        <div className="flex items-center gap-4 bg-teal/10 p-4 sm:p-5 rounded-[24px] border border-teal/20 flex-1 sm:flex-none sm:min-w-[200px] mb-2 shadow-sm transition-all duration-300 hover:bg-teal/15 hover:shadow-[0_10px_20px_-10px_rgba(15,118,110,0.2)] hover:-translate-y-1">
                        <div className="flex-1">
                          <span className="text-[9px] font-bold text-teal uppercase tracking-widest block mb-0.5">With Material</span>
                          <div className="text-sm font-extrabold text-navy numeric">
                            Rs. {materialMin} <span className="opacity-60 text-[10px] font-sans">{displayUnit}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'MATERIAL', 0, materialMin)}
                          className="px-5 py-2.5 bg-teal text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_16px_30px_-18px_rgba(15,118,110,0.8)] active:scale-[0.98] text-[9px] font-bold uppercase tracking-widest overflow-hidden relative btn-shine"
                        >
                          Material
                        </button>
                      </div>
                    )}

                    {/* Fallback for no prices */}
                    {!(labourMin > 0 || labourMax > 0) && !(materialMin > 0 || materialMax > 0) && (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-100 flex-1 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="flex-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pricing</span>
                          <div className="text-sm font-extrabold text-navy italic opacity-70">
                            Available on Request
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'GENERAL', 0, 0)}
                          className="w-10 h-10 bg-slate-100 hover:bg-teal text-slate-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-[0.98] overflow-hidden relative btn-shine"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
