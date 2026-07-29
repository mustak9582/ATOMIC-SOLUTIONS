import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map as MapIcon, 
  Layout, 
  PenTool, 
  Send, 
  CheckCircle2, 
  Square,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { dataService, safeStringify } from '../services/firebaseService';
import { toast } from 'sonner';
import { WHATSAPP_NUMBER } from '../constants';
import { formatWhatsAppLink } from '../lib/utils';

export default function HomePlanningSection() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [adminEmail, setAdminEmail] = useState('mustakansari9582@gmail.com');

  useEffect(() => {
    // Try to get admin email from settings
    dataService.getDoc('settings', 'main').then((settings: any) => {
      if (settings && settings.email) {
        setAdminEmail(settings.email);
      }
    }).catch(() => {});
  }, []);
  
  const [formData, setFormData] = useState({
    plotSize: '',
    sqft: '',
    floors: 'G+0',
    rooms: '2 BHK',
    address: profile?.address || '',
    description: '',
    serviceType: 'House Plan',
    contactPreference: 'WhatsApp'
  });

  // Sync address from profile when it loads
  useEffect(() => {
    if (profile?.address && !formData.address) {
      setFormData(prev => ({ ...prev, address: profile.address }));
    }
  }, [profile?.address]);

  const BASE_RATE = 5; // You can change this rate per sqft

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (submitted && countdown === 0) {
      navigate('/dashboard');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submitted, countdown, navigate]);

  const calculateRate = () => {
    const area = parseFloat(formData.sqft);
    if (isNaN(area)) return 0;
    return area * BASE_RATE;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit your request');
      return;
    }

    if (!formData.address) {
      toast.error('Please enter your property address');
      return;
    }

    setIsSubmitting(true);
    try {
      const calculatedTotal = calculateRate();
      const requestData = {
        userId: user.uid,
        userName: profile?.name || user.displayName,
        userEmail: profile?.email || user.email,
        userPhone: profile?.phone || '',
        whatsappNumber: profile?.whatsappNumber || profile?.phone || '',
        userAddress: formData.address,
        type: 'PLANNING_REQUEST',
        serviceName: 'Home Planning & Design',
        subCategory: formData.serviceType,
        appointmentDate: null,
        appointmentSlot: null,
        details: {
          plotSize: formData.plotSize,
          sqft: formData.sqft,
          estimatedPrice: calculatedTotal,
          floors: formData.floors,
          rooms: formData.rooms,
          description: formData.description,
          contactPreference: formData.contactPreference
        },
        status: 'Pending',
        timestamp: new Date().toISOString()
      };

      // 1. Record booking first
      const booking = await dataService.addDoc('bookings', requestData);

      // Send email notification to admin via server
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ 
          booking: { ...requestData, id: booking.id }, 
          adminEmail: adminEmail 
        })
      }).catch(err => console.warn('Email notification failed', err));

      // 2. Notify Admin
      await dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New House Plan Request',
        message: `${profile?.name || 'A customer'} just submitted a new ${formData.serviceType} (${formData.rooms}) request for ${formData.plotSize}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking_new',
        link: '/admin/bookings',
        relatedId: booking.id
      }).catch(err => console.warn('Admin notification failed', err));

      // 3. Prepare WhatsApp message
      const waMessage = `Hi Atomic Solutions, I am interested in *${formData.serviceType}* (${formData.rooms}) for my property at *${formData.address}* (${formData.plotSize}). My estimated rate is ₹${calculatedTotal.toLocaleString('en-IN')}. Please call me to confirm a visit date.`;
      const waUrl = formatWhatsAppLink(WHATSAPP_NUMBER, waMessage);

      // 4. Show success and redirect
      setSubmitted(true);
      setCountdown(5);
      toast.success('Booking recorded! Opening WhatsApp...');
      
      // Use window.open for more reliable redirection
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-24 bg-slate-app">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center mx-auto text-teal"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-navy">Request received</h2>
            <p className="text-gray-500 font-medium max-w-lg mx-auto">
              Aapki house planning request humein mil gayi hai. Hamare expert engineers aapko jald hi contact karenge.
            </p>
            <p className="text-teal font-bold text-xs uppercase tracking-widest bg-teal/5 py-2 px-4 rounded-xl inline-block">
              Redirecting to your dashboard in {countdown}s...
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto rounded-lg h-14 px-10 bg-teal text-white font-bold text-sm shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)]"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setCountdown(5);
              }}
              variant="outline"
              className="w-full sm:w-auto rounded-lg h-14 px-8 font-bold text-sm"
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="plan-home" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Professional Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 rounded-full text-teal text-[10px] font-bold uppercase tracking-[0.2em] border border-teal/15">
                <PenTool size={14} />
                Architecture & Design
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-navy leading-tight">
                Plan your home with <br />
                <span className="text-teal">professional drawings</span>
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-lg">
                Ghar ka naksha banwana ab aur bhi aasan. Hamare professional engineers se apne ghar ka professional drawing aur 3D elevation banwayein.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="premium-card premium-card-hover p-6 space-y-4 group"
              >
                <div className="icon-tile w-12 h-12 group-hover:bg-teal group-hover:text-white transition-colors">
                  <Layout size={24} />
                </div>
                <h4 className="text-sm font-extrabold text-navy">2D layout plans</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Detailed space planning according to your property shape.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="premium-card premium-card-hover p-6 space-y-4 group"
              >
                <div className="icon-tile w-12 h-12 group-hover:bg-teal group-hover:text-white transition-colors">
                  <Home size={24} />
                </div>
                <h4 className="text-sm font-extrabold text-navy">3D elevation</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Visualize your future home with realistic 3D exterior designs.</p>
              </motion.div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-600 text-sm">
              <Info className="flex-shrink-0 text-teal" size={20} />
              <p>Professional architectural planning and modern 3D elevation solutions.</p>
            </div>
          </motion.div>

          {/* Right Side: Specialized Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="premium-card p-8 md:p-10 relative"
          >
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">What do you need?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['House Plan', '3D Design', 'Structural', 'Renovation'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, serviceType: type})}
                        className={`py-3 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                          formData.serviceType === type 
                            ? 'bg-teal border-teal text-white shadow-[0_14px_28px_-18px_rgba(15,118,110,0.9)]' 
                            : 'bg-white border-slate-100 text-slate-500 hover:border-teal/40'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="plot-size" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                       Plot Size (e.g. 30x40)
                    </label>
                    <input 
                      id="plot-size"
                      required
                      placeholder="e.g. 30x40 Ft"
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-5 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                      value={formData.plotSize || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newFormData = { ...formData, plotSize: val };
                        
                        // Try to auto-calculate sqft if pattern like 30x40 or 30*40 is found
                        const dimensions = val.toLowerCase().match(/(\d+)\s*[x\*]\s*(\d+)/);
                        if (dimensions && dimensions.length === 3) {
                          const area = parseInt(dimensions[1]) * parseInt(dimensions[2]);
                          newFormData.sqft = area.toString();
                        }
                        
                        setFormData(newFormData);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="total-sqft" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                      <Square size={12} className="text-teal" /> Total Sq. Ft.
                    </label>
                    <input 
                      id="total-sqft"
                      required
                      type="number"
                      placeholder="e.g. 1200"
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-5 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all numeric"
                      value={formData.sqft || ""}
                      onChange={(e) => setFormData({...formData, sqft: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="config-rooms" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                      <Layout size={12} className="text-teal" /> Configuration
                    </label>
                    <select 
                      id="config-rooms"
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-5 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all appearance-none cursor-pointer"
                      value={formData.rooms || ""}
                      onChange={(e) => setFormData({...formData, rooms: e.target.value})}
                    >
                      <option>1 BHK</option>
                      <option>2 BHK</option>
                      <option>3 BHK</option>
                      <option>4 BHK+</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                       Estimated Rate
                    </label>
                    <div className="w-full bg-teal/10 border border-teal/15 rounded-lg px-5 py-4 font-extrabold text-lg text-teal flex items-center justify-between numeric">
                      <span>₹ {calculateRate().toLocaleString('en-IN')}</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-60">Estimated</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="property-address" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Property Address (Deoghar)</label>
                  <input 
                    id="property-address"
                    required
                    placeholder="Full Address / Landmark"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-5 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="additional-requirements" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Additional Requirements</label>
                  <textarea 
                    id="additional-requirements"
                    rows={3}
                    placeholder="Describe your vision (e.g. Vastu compliant, Open kitchen, Parking space...)"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-5 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-teal hover:bg-[#0d9488] text-white font-bold text-sm rounded-lg shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] transition-all flex items-center justify-center gap-3 group"
              >
                {isSubmitting ? 'Recording Request...' : 'Book Visit & Schedule'}
                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>

              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Expert Consultation
                </div>
                <div className="h-4 w-px bg-gray-100" />
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-2 h-2 bg-teal rounded-full" />
                  Direct WhatsApp Support
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
