import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  Info,
  Calendar,
  LayoutGrid,
  ShieldCheck,
  Zap,
  IndianRupee,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { Service, SubCategory } from '../types';
import { CORE_SERVICES } from '../constants';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import CategoriesModal from './CategoriesModal';
import DirectBookingModal from './DirectBookingModal';

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isDirectBookingOpen, setIsDirectBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL', price?: string | number} | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    // ID Normalization helper
    const normalizeId = (id: string) => id.trim().toLowerCase().replace(/\s+/g, '-');
    const searchId = normalizeId(serviceId);

    // Initial fallback
    const initialFallback = CORE_SERVICES.find(s => 
      normalizeId(s.id) === searchId || 
      normalizeId(s.name).includes(searchId) ||
      searchId.includes(normalizeId(s.id))
    );
    if (initialFallback) setService(initialFallback);

    const handleData = (fsData: any) => {
      if (fsData) {
        // Merge with fallback if exists to preserve static fields if any are missing in FS
        if (initialFallback) {
          setService({ ...initialFallback, ...fsData });
        } else {
          setService(fsData as Service);
        }
        setLoading(false);
      } else {
        // Doc doesn't exist in FS, keep fallback if found
        if (initialFallback) {
          setService(initialFallback);
          setLoading(false);
        } else {
          // No fallback either
          setLoading(false);
        }
      }
    };

    // Attempt subscription
    const unsub = dataService.subscribeDoc('services', searchId, handleData);

    return () => unsub();
  }, [serviceId]);

  useEffect(() => {
    // Handle scroll to sub-category if query param exists
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('sub');
    
    if (sub && !loading && service) {
      const scrollToSub = () => {
        const element = document.getElementById(`sub-${sub}`);
        if (element) {
          const offset = 100;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          });
          // Add a brief highlight effect
          element.classList.add('ring-2', 'ring-teal', 'bg-teal/5');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-teal', 'bg-teal/5');
          }, 3000);
        }
      };

      // Try multiple times as images/content might still be loading
      scrollToSub();
      const timer1 = setTimeout(scrollToSub, 500);
      const timer2 = setTimeout(scrollToSub, 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (!loading && !window.location.search.includes('sub=')) {
      window.scrollTo(0, 0);
    }
  }, [window.location.search, loading, service]);

  const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice: string | number = 0, materialPrice: string | number = 0) => {
    setBookingData({ subName, type, price: labourPrice || materialPrice, labourPrice, materialPrice } as any);
    setIsCategoriesOpen(false);
    setIsDirectBookingOpen(true);
  };

  const handleConsultation = async () => {
    if (user && service) {
      try {
        await dataService.addDoc('bookings', {
          userId: user.uid,
          userName: profile?.name || user.displayName || 'User',
          userPhone: profile?.phone || '',
          serviceName: service.name,
          subCategory: 'Consultation',
          bookingType: 'GENERAL',
          status: 'Pending',
          timestamp: new Date().toISOString()
        });
        toast.success('Consultation Request Logged.');
      } catch (e) {
        console.error('Failed to log consultation:', e);
      }
    }
    window.location.href = 'tel:+919582268658';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-widest text-navy">Loading Service Details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center text-red-600 mx-auto mb-6">
            <LayoutGrid size={40} />
          </div>
          <h1 className="text-2xl font-black text-navy uppercase tracking-tighter mb-4">Service Not Found</h1>
          <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
            The service you're looking for might have been moved or renamed. Please check our all available services.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-navy text-white h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-all shadow-xl shadow-navy/20"
          >
            Explore Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-app font-sans">
      <main className="pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <Link to="/" className="hover:text-navy transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-navy">{service.name}</span>
            </nav>
            <motion.button 
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-navy hover:text-teal font-black text-[10px] uppercase tracking-widest self-start sm:self-auto"
            >
              <ArrowLeft size={16} /> Back to previous
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Content Column */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-12">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                <Badge className="bg-teal text-white font-bold text-[10px] uppercase px-4 py-1.5 rounded-full shadow-sm">
                    {service.category}
                  </Badge>
                  <Badge variant="outline" className="text-teal border-teal/30 font-black text-[10px] uppercase px-4 py-1.5 rounded-full">
                    Professional Care
                  </Badge>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold text-navy leading-tight">
                  {service.name}
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-3xl">
                  {service.description || `High-quality ${service.name} services by Atomic Solutions. We provide experienced technicians and genuine parts for all your needs.`}
                </p>
              </div>

              {/* Main Image & Features */}
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden aspect-[16/9] md:aspect-[21/9] shadow-[0_26px_55px_-24px_rgba(15,23,42,0.24)] relative bg-slate-100">
                  <img 
                    src={service.featuredImage || service.image || (service.images && service.images[0]) || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200&auto=format&fit=crop'} 
                    alt={service.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                </div>

                {service.images && service.images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {service.images.map((img, i) => (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={i}
                        onClick={() => setService({...service, featuredImage: img})}
                        className={`w-32 h-20 rounded-[24px] overflow-hidden flex-shrink-0 border-2 transition-all ${service.featuredImage === img || (!service.featuredImage && i === 0) ? 'border-teal' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`${service.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="premium-card premium-card-hover p-6 flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy">Certified Expert</span>
                  </div>
                  <div className="premium-card premium-card-hover p-6 flex flex-col items-center text-center gap-2">
                    <Clock className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy">Same Day Visit</span>
                  </div>
                  <div className="premium-card premium-card-hover p-6 flex flex-col items-center text-center gap-2">
                    <IndianRupee className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy">Flat Pricing</span>
                  </div>
                  <div className="premium-card premium-card-hover p-6 flex flex-col items-center text-center gap-2">
                    <Zap className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy">Genuine Spares</span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-100" />
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">Detailed Catalog</h2>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="premium-card overflow-hidden">
                  <div className="p-8 md:p-12 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-3xl font-extrabold text-navy">About this service</h3>
                      {service.detailedDescription ? (
                        <div 
                          className="text-gray-500 font-medium leading-loose text-lg prose prose-navy max-w-none"
                          dangerouslySetInnerHTML={{ __html: service.detailedDescription }}
                        />
                      ) : (
                        <div className="text-gray-500 font-medium leading-loose text-lg whitespace-pre-line">
                          Our {service.name} service is designed to provide you with a hassle-free experience. 
                          We handle everything from initial inspection to final execution, ensuring that your equipment or facility is in top condition. 
                          At Atomic Solutions, we believe in transparency and quality, which is why our technicians follow a strict checklist for every visit.
                        </div>
                      )}
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-extrabold text-navy">Rate list and tiers</h3>
                            <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-3">Live Pricing</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {service.subCategories?.map((sub, idx) => (
                                <div 
                                    id={`sub-${sub.id}`}
                                    key={idx} 
                                    className="group bg-slate-50/80 hover:bg-white p-6 rounded-[24px] border border-slate-100 hover:border-teal/20 transition-all duration-400 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.35)] hover:-translate-y-1"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-lg font-extrabold text-navy truncate">{sub.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Professional service</p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                    <IndianRupee size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-0.5 whitespace-nowrap">Labour Only</div>
                                                    <div className="text-lg font-extrabold text-navy numeric whitespace-nowrap">Rs. {sub.labourMin || sub.minPrice}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[9px] font-black uppercase text-orange-500 tracking-widest mb-0.5 whitespace-nowrap">With Material</div>
                                                    <div className="text-lg font-extrabold text-navy numeric whitespace-nowrap">Rs. {sub.materialMin || sub.minPrice}</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleBook(sub.name, 'LABOUR', sub.labourMin || sub.minPrice)}
                                                    className="flex-1 sm:flex-none h-11 px-5 rounded-full bg-white border border-slate-100 text-navy hover:bg-slate-50 transition-all duration-300 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-[0.98] overflow-hidden relative btn-shine"
                                                >
                                                    Labour
                                                </button>
                                                <button 
                                                    onClick={() => handleBook(sub.name, 'MATERIAL', sub.materialMin || sub.minPrice)}
                                                    className="flex-1 sm:flex-none h-11 px-7 rounded-full bg-teal hover:bg-[#0d9488] text-white flex items-center justify-center transition-all duration-300 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap shadow-[0_16px_30px_-18px_rgba(15,118,110,0.8)] active:scale-[0.98] overflow-hidden relative btn-shine"
                                                >
                                                    Material
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* YouTube Video Section */}
              {service.youtubeId && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-extrabold text-navy flex items-center gap-3">
                      <PlayCircle className="text-rose-500" /> Watch and learn
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-[0_26px_55px_-24px_rgba(15,23,42,0.24)] border border-white">
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${service.youtubeId}`}
                      title={`${service.name} Service Video`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Booking Sidebar */}
            <div className="lg:col-span-12 xl:col-span-4">
              <div className="sticky top-28 space-y-8">
                <Card className="rounded-lg border-none shadow-[0_26px_55px_-24px_rgba(15,23,42,0.42)] p-8 md:p-10 bg-navy text-white overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <div className="inline-flex px-3 py-1 bg-teal/20 rounded-full text-teal-100 text-[10px] font-bold uppercase tracking-widest border border-teal/30">
                        Top Rated Service
                      </div>
                      <h3 className="text-3xl font-extrabold leading-tight">
                        Instant booking available
                      </h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Book a professional technician now and get service within 2 hours.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Verified Experts</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">7 Days Warranty</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Digital Invoice</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setIsCategoriesOpen(true);
                      }}
                      className="w-full h-16 rounded-full bg-teal hover:bg-[#0d9488] text-white font-bold text-sm shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] transition-all font-sans btn-shine"
                    >
                      Book Service Now
                    </Button>

                    <div className="pt-4 text-center">
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Atomic Solutions licensed operator</p>
                    </div>
                  </div>
                </Card>

                <div className="premium-card p-8 flex flex-col items-center text-center gap-4">
                    <div className="icon-tile w-12 h-12">
                        <Phone size={20} />
                    </div>
                    <div>
                        <h4 className="text-navy font-extrabold">Need consultation?</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Talk to our service expert</p>
                    </div>
                    <button 
                        onClick={handleConsultation}
                        className="text-navy font-extrabold text-xl hover:text-teal transition-colors numeric"
                    >
                        +91 95822 68658
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modals */}
      <CategoriesModal 
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        service={service}
        whatsapp="+919582268658"
        onBook={handleBook}
      />

      {bookingData && (
        <DirectBookingModal 
          isOpen={isDirectBookingOpen}
          onClose={() => {
            setIsDirectBookingOpen(false);
            setBookingData(null);
          }}
          serviceName={service.name}
          subCategoryName={bookingData.subName}
          bookingType={bookingData.type}
          price={bookingData.price}
          whatsapp="+919582268658"
        />
      )}
    </div>
  );
}
