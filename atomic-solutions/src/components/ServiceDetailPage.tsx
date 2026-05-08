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
  ShieldCheck,
  Zap,
  IndianRupee,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { dataService } from '../services/firebaseService';
import { Service, SubCategory } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import CategoriesModal from './CategoriesModal';
import DirectBookingModal from './DirectBookingModal';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isDirectBookingOpen, setIsDirectBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL'} | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const data = await dataService.getDoc('services', serviceId);
        if (data) {
          setService(data as Service);
        }
      } catch (error) {
        console.error("Failed to fetch service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
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

  const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => {
    setBookingData({ subName, type });
    setIsCategoriesOpen(false);
    setIsDirectBookingOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-navy border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <Info size={48} />
        </div>
        <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Service Not Found</h1>
        <Button onClick={() => navigate('/')} className="bg-navy hover:bg-teal">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <main className="pt-24 pb-20">
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
                  <Badge className="bg-teal text-navy font-black text-[10px] uppercase px-4 py-1.5 rounded-full shadow-sm">
                    {service.category}
                  </Badge>
                  <Badge variant="outline" className="text-teal border-teal/30 font-black text-[10px] uppercase px-4 py-1.5 rounded-full">
                    Professional Care
                  </Badge>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-navy tracking-tighter uppercase leading-[0.9]">
                  {service.name}
                </h1>
                <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-3xl">
                  {service.description || `High-quality ${service.name} services by Atomic Solutions. We provide experienced technicians and genuine parts for all your needs.`}
                </p>
              </div>

              {/* Main Image & Features */}
              <div className="space-y-4">
                <div className="rounded-[40px] md:rounded-[56px] overflow-hidden aspect-[16/9] md:aspect-[21/9] shadow-2xl relative bg-gray-100">
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
                        className={`w-32 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${service.featuredImage === img || (!service.featuredImage && i === 0) ? 'border-teal' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`${service.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center text-center gap-2 border border-gray-100">
                    <ShieldCheck className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy">Certified Expert</span>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center text-center gap-2 border border-gray-100">
                    <Clock className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy">Same Day Visit</span>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center text-center gap-2 border border-gray-100">
                    <IndianRupee className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy">Flat Pricing</span>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center text-center gap-2 border border-gray-100">
                    <Zap className="text-teal mb-1" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy">Genuine Spares</span>
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

                <div className="bg-white border border-gray-100 rounded-[40px] shadow-sm overflow-hidden">
                  <div className="p-8 md:p-12 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-3xl font-black text-navy uppercase tracking-tighter">About this service</h3>
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
                            <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Rate List & Tiers</h3>
                            <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-3">Live Pricing</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {service.subCategories?.map((sub, idx) => (
                                <div 
                                    id={`sub-${sub.id}`}
                                    key={idx} 
                                    className="group bg-gray-50/50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-teal/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-navy uppercase tracking-tight">{sub.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pricing based on work complexity</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-1">Labour Charges</div>
                                            <div className="text-xl font-black text-navy">₹{sub.labourMin || sub.minPrice} <span className="text-[10px] font-bold text-gray-400">-{sub.labourMax || sub.maxPrice}</span></div>
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleBook(sub.name, 'LABOUR')}
                                            className="h-12 w-12 rounded-2xl bg-navy hover:bg-teal text-white flex items-center justify-center p-0 transition-all shrink-0"
                                        >
                                            <ArrowLeft className="rotate-180" size={18} />
                                        </motion.button>
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
                    <h2 className="text-2xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                      <PlayCircle className="text-rose-500" /> Watch & Learn
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="aspect-video rounded-[32px] overflow-hidden bg-gray-100 shadow-2xl border-8 border-white">
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
                <Card className="rounded-[40px] border-none shadow-2xl shadow-gray-200 p-8 md:p-10 bg-navy text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <div className="inline-flex px-3 py-1 bg-teal/20 rounded-full text-teal text-[10px] font-black uppercase tracking-widest border border-teal/30">
                        Top Rated Service
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">
                        Instant Booking Available
                      </h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Book a professional technician now and get service within 2 hours.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified Experts</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-black uppercase tracking-widest">7 Days Warranty</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Digital Invoice</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setIsCategoriesOpen(true);
                      }}
                      className="w-full h-16 rounded-2xl bg-teal hover:bg-white text-navy font-black text-sm uppercase tracking-widest shadow-xl transition-all font-sans"
                    >
                      Book Service Now
                    </Button>

                    <div className="pt-4 text-center">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Atomic Solutions • Licensed Operator</p>
                    </div>
                  </div>
                </Card>

                <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal shadow-sm border border-gray-50">
                        <Phone size={20} />
                    </div>
                    <div>
                        <h4 className="text-navy font-black uppercase tracking-tight">Need Consultation?</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Talk to our service expert</p>
                    </div>
                    <a 
                        href="tel:+919582268658"
                        className="text-navy font-black text-xl hover:text-teal transition-colors tracking-tighter"
                    >
                        +91 95822 68658
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />

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
          whatsapp="+919582268658"
        />
      )}
    </div>
  );
}
