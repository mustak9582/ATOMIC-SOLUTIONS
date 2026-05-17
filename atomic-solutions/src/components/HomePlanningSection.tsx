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
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center mx-auto text-teal"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-navy uppercase tracking-tighter">Request Received!</h2>
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
              className="w-full sm:w-auto rounded-2xl h-14 px-10 bg-navy text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-navy/10"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setCountdown(5);
              }}
              variant="outline"
              className="w-full sm:w-auto rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest border-2"
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="plan-home" className="py-24 bg-gray-50 overflow-hidden">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 rounded-full text-teal text-[10px] font-black uppercase tracking-widest border border-teal/20">
                <PenTool size={14} />
                Architecture & Design
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-navy leading-[0.95] tracking-tighter uppercase">
                PLAN YOUR <br />
                <span className="text-teal underline decoration-navy underline-offset-8">DRAWING</span>
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-lg">
                Ghar ka naksha banwana ab aur bhi aasan. Hamare professional engineers se apne ghar ka professional drawing aur 3D elevation banwayein.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 space-y-4 group hover:border-teal/30 transition-all">
                <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white group-hover:bg-teal transition-colors">
                  <Layout size={24} />
                </div>
                <h4 className="text-sm font-black text-navy uppercase tracking-tight">2D Layout Plans</h4>
                <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed">Detailed space planning according to your property shape.</p>
              </div>
              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 space-y-4 group hover:border-teal/30 transition-all">
                <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white group-hover:bg-teal transition-colors">
                  <Home size={24} />
                </div>
                <h4 className="text-sm font-black text-navy uppercase tracking-tight">3D Elevation</h4>
                <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed">Visualize your future home with realistic 3D exterior designs.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-navy/5 rounded-3xl border border-navy/10 italic text-navy/70 text-sm">
              <Info className="flex-shrink-0 text-teal" size={20} />
              <p>Professional architectural planning and modern 3D elevation solutions.</p>
            </div>
          </motion.div>

          {/* Right Side: Specialized Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-200 border border-gray-100 relative"
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-teal/5 rounded-full blur-3xl -z-1" />
            
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
                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                          formData.serviceType === type 
                            ? 'bg-navy border-navy text-white shadow-lg' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-teal/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                       Plot Size (e.g. 30x40)
                    </label>
                    <input 
                      required
                      placeholder="e.g. 30x40 Ft"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                      <Square size={12} className="text-teal" /> Total Sq. Ft.
                    </label>
                    <input 
                      required
                      type="number"
                      placeholder="e.g. 1200"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                      value={formData.sqft || ""}
                      onChange={(e) => setFormData({...formData, sqft: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                      <Layout size={12} className="text-teal" /> Configuration
                    </label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all appearance-none cursor-pointer"
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
                    <div className="w-full bg-teal/5 border border-teal/10 rounded-2xl px-5 py-4 font-black text-lg text-teal flex items-center justify-between">
                      <span>₹ {calculateRate().toLocaleString('en-IN')}</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-60">Estimated</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Property Address (Deoghar)</label>
                  <input 
                    required
                    placeholder="Full Address / Landmark"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Additional Requirements</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe your vision (e.g. Vastu compliant, Open kitchen, Parking space...)"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-navy hover:bg-teal text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-navy/20 transition-all flex items-center justify-center gap-3 group"
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
