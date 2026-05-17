import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MessageCircle, ChevronRight, LogIn, MapPin, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, safeStringify } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { toast } from 'sonner';
import { formatWhatsAppLink } from '../lib/utils';

interface DirectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  subCategoryName: string;
  whatsapp: string;
  bookingType?: 'LABOUR' | 'MATERIAL' | 'GENERAL';
  staffCategory?: string;
}

export default function DirectBookingModal({ 
  isOpen, 
  onClose, 
  serviceName, 
  subCategoryName, 
  whatsapp,
  bookingType = 'GENERAL',
  staffCategory
}: DirectBookingModalProps) {
  const { user, profile, login, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsappNum, setWhatsappNum] = useState(profile?.whatsappNumber || profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(profile?.location || null);
  const [adminEmail, setAdminEmail] = useState('mustakansari9582@gmail.com');

  React.useEffect(() => {
    // Try to get admin email from settings
    dataService.getDoc('settings', 'main').then((settings: any) => {
      if (settings && settings.email) {
        setAdminEmail(settings.email);
      }
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (profile) {
      if (!name) setName(profile.name || user?.displayName || '');
      if (!phone) setPhone(profile.phone || '');
      if (!whatsappNum) setWhatsappNum(profile.whatsappNumber || profile.phone || '');
      if (!address) setAddress(profile.address || '');
      if (!locationCoords) setLocationCoords(profile.location || null);
    }
  }, [profile, user]);

  const isMissingInfo = !profile?.name || !profile?.phone || !profile?.whatsappNumber || !profile?.address || !profile?.email;

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectFullLocation();
      if (loc.address) {
        setAddress(loc.address);
        toast.success('Address auto-populated via GPS!');
      } else {
        toast.success('GPS coordinates captured! Please enter address text.');
      }
      setLocationCoords({ lat: loc.lat, lng: loc.lng });
    } catch (e) {
      console.error('Location detection failed:', e);
      toast.error('Failed to detect location. Please enter manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      try {
        await login();
        return;
      } catch (error) {
        toast.error('Login failed. Please try again.');
        return;
      }
    }

    // Check if form is filled if info was missing
    if (isMissingInfo) {
      if (!name || !phone || !whatsappNum || !address) {
        toast.error('Please fill all fields to continue.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const locationData = locationCoords ? {
        ...locationCoords,
        address: address,
        timestamp: new Date().toISOString()
      } : profile?.location || null;

      // 1. Update profile in background if it was missing or changed
      if (isMissingInfo || (locationCoords && safeStringify(locationCoords) !== safeStringify(profile?.location))) {
        await updateProfile({ 
          name, 
          phone, 
          whatsappNumber: whatsappNum, 
          address,
          location: locationData
        }).catch(err => console.warn('Profile sync failed', err));
      }

      // 2. Prepare data
      const typeText = bookingType === 'LABOUR' ? ' (Labour Only)' : bookingType === 'MATERIAL' ? ' (With Material)' : '';
      
      const bookingData = {
        userId: user.uid,
        userName: name || profile?.name || user.displayName || 'User',
        userEmail: user.email,
        userPhone: phone,
        whatsappNumber: whatsappNum,
        userAddress: address,
        location: locationData,
        serviceName,
        serviceCategory: staffCategory || '',
        subCategory: subCategoryName,
        bookingType,
        status: 'Pending',
        appointmentDate: null,
        appointmentSlot: null,
        timestamp: new Date().toISOString()
      };

      // 3. TRIGGER WHATSAPP IMMEDIATELY (To avoid popup blocker and feel fast)
      const encodedMessage = `Hi Atomic Solutions, I want to book ${subCategoryName}${typeText}. Please call me to confirm a visit date. (Customer Name: ${name || profile?.name || user.displayName}, Contact: ${phone}, WhatsApp: ${whatsappNum})`;
      const waUrl = formatWhatsAppLink(whatsapp, encodedMessage);
      
      onClose();
      toast.success('Booking Recorded Successfully! Opening WhatsApp...');

      // Use window.open for more reliable redirection
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 800);

      // 5. Save to database in background
      dataService.addDoc('bookings', bookingData).then(booking => {
        // Send email notification to admin via server
        fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: safeStringify({ 
            booking: { ...bookingData, id: booking.id }, 
            adminEmail: adminEmail 
          })
        }).catch(err => console.warn('Email notification failed', err));

        dataService.addDoc('notifications', {
          userId: 'admin',
          title: 'New Service Request!',
          message: `${name || profile?.name || user.displayName} requested ${subCategoryName}.`,
          type: 'booking_new',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/admin/bookings',
          relatedId: booking.id
        }).catch(() => {});
      }).catch(error => {
        console.error('Background saving error:', error);
      });
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A192F]/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-[#001f3f] p-8 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64FFDA] mb-2 flex items-center gap-2">
                Book Appointment 
                <span className={`px-2 py-0.5 rounded text-[8px] ${bookingType === 'LABOUR' ? 'bg-blue-500/20 text-blue-300' : bookingType === 'MATERIAL' ? 'bg-orange-500/20 text-orange-300' : 'bg-teal-500/20 text-teal-300'}`}>
                  {bookingType === 'LABOUR' ? 'Labour Only' : bookingType === 'MATERIAL' ? 'With Material' : 'General'}
                </span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{subCategoryName}</h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{serviceName}</p>
            </div>

            <div className="p-0 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
              <div className="p-8 space-y-6">
                {!user ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <LogIn size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-navy uppercase tracking-tight">Login Required</h4>
                      <p className="text-sm text-gray-500 font-medium">Please login with Google to book your service and track your appointments.</p>
                    </div>
                    <button
                      onClick={login}
                      className="w-full bg-navy text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all hover:bg-navy/90"
                    >
                      Login with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
                          <MessageCircle size={20} />
                        </div>
                        <h4 className="text-sm font-black text-navy uppercase tracking-tight">Schedule via WhatsApp</h4>
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        {isMissingInfo 
                          ? "Please provide your contact details. This will also update your profile for future bookings."
                          : "Booking confirm karne ke liye aapko WhatsApp pe redirect kiya jayega. Hamari team aapse contact karke visit date final karegi."
                        }
                      </p>
                    </div>

                    {isMissingInfo ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                          <input 
                            type="text"
                            value={name || ""}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Aapka naam"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                            <input 
                              type="tel"
                              value={phone || ""}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Phone"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#25D366] uppercase tracking-widest ml-1">WhatsApp</label>
                            <input 
                              type="tel"
                              value={whatsappNum || ""}
                              onChange={(e) => setWhatsappNum(e.target.value)}
                              placeholder="WhatsApp"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Address</label>
                            <button 
                              type="button"
                              onClick={detectLocation}
                              disabled={isDetecting}
                              className="text-[9px] font-black uppercase tracking-widest text-teal hover:text-navy transition-colors flex items-center gap-1"
                            >
                              {isDetecting ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <MapPin size={10} />
                              )}
                              Auto-detect
                            </button>
                          </div>
                          <textarea 
                            value={address || ""}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Deoghar site location..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none h-20"
                          />
                          {locationCoords && (
                            <p className="text-[9px] text-teal mt-2 font-bold px-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <ShieldCheck size={10} /> GPS Coordinates captured for faster technician routing.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-teal/5 p-4 rounded-2xl border border-teal/10">
                        <p className="text-[10px] font-black text-navy uppercase tracking-widest mb-2">My Saved Details</p>
                        <div className="space-y-1 text-xs font-bold text-gray-500">
                          <p>📞 {profile?.phone}</p>
                          <p>📍 {profile?.address}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl shadow-[#001f3f]/20 group disabled:opacity-50"
                    >
                      {isSubmitting ? 'Recording Booking...' : (isMissingInfo ? 'Complete & Book Now' : 'Confirm & WhatsApp')}
                      {!isSubmitting && <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            
            <div className="bg-gray-50 p-6 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Fast & Secure Booking System
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
