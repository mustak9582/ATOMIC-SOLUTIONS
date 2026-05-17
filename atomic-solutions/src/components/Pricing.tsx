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
    type: 'LABOUR' | 'MATERIAL' | 'GENERAL';
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
    <section id="services" className="py-24 bg-[#0A192F]">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#64FFDA]/10 rounded-full border border-[#64FFDA]/20 text-[#64FFDA] text-[10px] font-black uppercase tracking-[0.3em] mb-8"
          >
            <div className="w-2 h-2 bg-[#64FFDA] rounded-full animate-pulse" />
            Website is Live & Accepting Bookings
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none"
          >
            OUR EXPERTISE <br />
            <span className="text-[#64FFDA]">IS NOW LIVE</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#8892B0] max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Atomic Solutions delivers high-quality maintenance, deep cleaning, and construction services. Explore our specialized categories and book a professional today.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              onBook={(subName, type) => setBookingDetails({ 
                serviceName: service.name, 
                subName, 
                type,
                staffCategory: service.staffCategory
              })}
              onNavigate={() => navigate(`/service/${service.id.toLowerCase().replace(/\s+/g, '-')}`)}
            />
          ))}
        </div>
      </div>


      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A192F]/95 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl aspect-video rounded-[32px] overflow-hidden bg-black shadow-2xl animate-in zoom-in-95 duration-300">
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
        onBook={(subName, type) => {
          setSelectedServiceForModal(null);
          setBookingDetails({ 
            serviceName: selectedServiceForModal?.name || '', 
            subName, 
            type,
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
  onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => void;
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
      className="group relative bg-[#112240] rounded-[48px] overflow-hidden border border-[#233554] hover:border-[#64FFDA]/30 transition-all duration-500 shadow-2xl shadow-black/20"
    >
      {/* Level 1: Visuals & Intro */}
      <div className="relative h-[450px] cursor-pointer" onClick={onNavigate}>
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] via-[#112240]/40 to-transparent" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="absolute inset-x-0 bottom-0 p-8 pt-20 z-10">
          <div className="flex justify-between items-end gap-6">
            <div className="flex-1">
              <span className="text-[#64FFDA] text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">{service.category}</span>
              <h3 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">{service.name}</h3>
              <div 
                className="text-[#8892B0] text-sm font-medium line-clamp-2 max-w-lg mb-2"
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
                className="w-20 h-20 bg-[#64FFDA] rounded-[32px] flex items-center justify-center text-[#0A192F] shadow-xl shadow-[#64FFDA]/20 transition-all duration-300 flex-shrink-0"
              >
                <Play fill="currentColor" size={28} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Level 2 & 3: Sub-categories Expansion */}
      <div className="p-8 pb-12">
        <div className="flex justify-between items-center mb-8 border-b border-[#233554] pb-4">
          <h4 className="text-xs font-black text-[#64FFDA] uppercase tracking-[0.2em]">Service Options</h4>
          {(service.subCategories || []).length > 4 && (
            <motion.button 
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenModal}
              className="text-[#64FFDA] hover:text-white font-bold text-sm flex items-center gap-2 group/btn transition-all"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={sub.id} 
                className="p-6 bg-[#0A192F]/60 rounded-[32px] border border-[#233554] hover:border-[#64FFDA]/20 transition-all group/sub"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h5 className="text-[#CCD6F6] text-lg font-black group-hover/sub:text-[#64FFDA] transition-colors uppercase tracking-tight">{sub.name}</h5>
                    <span className="text-[10px] text-[#8892B0] font-bold uppercase tracking-widest">{service.name} Specialization</span>
                  </div>
                  
                  <div className="flex flex-row flex-wrap gap-4 items-stretch sm:items-center">
                    {/* Labour Option */}
                    {(labourMin > 0 || labourMax > 0) && (
                        <div className="flex items-center gap-4 bg-[#008080] p-4 sm:p-5 rounded-2xl border border-white/20 flex-1 sm:flex-none sm:min-w-[180px] shadow-lg mb-2">
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-white/70 uppercase tracking-widest block mb-0.5">Labour</span>
                          <div className="text-sm font-black text-white">
                            ₹{labourMin}{labourMax > labourMin ? ` - ₹${labourMax}` : ''} <span className="opacity-70 text-[10px]">{displayUnit}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'LABOUR')}
                          className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-[#008080] rounded-xl flex items-center justify-center transition-all text-[9px] font-black uppercase tracking-widest"
                        >
                          Labour
                        </button>
                      </div>
                    )}

                    {/* Material Option */}
                    {(materialMin > 0 || materialMax > 0) && (
                        <div className="flex items-center gap-4 bg-[#112240] p-4 sm:p-5 rounded-2xl border-2 border-[#64FFDA] flex-1 sm:flex-none sm:min-w-[200px] mb-2 shadow-lg shadow-[#64FFDA]/5 transition-all hover:bg-[#1a2b4b]">
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-[#64FFDA] uppercase tracking-widest block mb-0.5">With Material</span>
                          <div className="text-sm font-black text-white">
                            ₹{materialMin}{materialMax > materialMin ? ` - ₹${materialMax}` : ''} <span className="opacity-50 text-[10px]">{displayUnit}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'MATERIAL')}
                          className="px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded-xl flex items-center justify-center transition-all shadow-lg shadow-[#64FFDA]/20 hover:scale-105 text-[9px] font-black uppercase tracking-widest"
                        >
                          Material
                        </button>
                      </div>
                    )}

                    {/* Fallback for no prices */}
                    {!(labourMin > 0 || labourMax > 0) && !(materialMin > 0 || materialMax > 0) && (
                      <div className="flex items-center gap-4 bg-[#112240] p-4 rounded-2xl border border-[#233554] flex-1">
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-[#8892B0] uppercase tracking-widest block mb-0.5">Pricing</span>
                          <div className="text-sm font-black text-white italic opacity-70">
                            Available on Request
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'GENERAL')}
                          className="w-10 h-10 bg-white/5 hover:bg-[#64FFDA] text-white hover:text-[#0A192F] rounded-xl flex items-center justify-center transition-all"
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
