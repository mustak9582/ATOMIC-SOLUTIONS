import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MessageCircle, Mail, MapPin, ChevronRight, User, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { toast } from 'sonner';

const CompleteProfileModal: React.FC = () => {
  const { user, profile, refreshProfile, requestUserLocation } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(true);
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    phone: profile?.phone || '',
    whatsappNumber: profile?.whatsappNumber || '',
    address: profile?.address || '',
    location: profile?.location || null
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [whatsappOtpRequested, setWhatsappOtpRequested] = useState(false);
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(profile?.isPhoneVerified || false);

  // Visibility logic: only show if missing info AND we are in a booking flow (flagged in session)
  // Or if the user explicitly clicked a "Complete Profile" button (future proofing)
  const isMissingInfo = user && (!profile?.name || !profile?.phone || !profile?.isPhoneVerified || !profile?.address || !profile?.email);
  const isCustomer = user && !profile?.isAdmin && !profile?.isStaff;
  const isRequested = sessionStorage.getItem('request_profile_completion') === 'true';
  const isProtectedPath = window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/professional') || window.location.pathname.startsWith('/my-account');
  
  const handleRequestWhatsappOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    setIsSubmitting(true);
    try {
      // DEV NOTE: Integrate with Twilio or Meta Graph WhatsApp API here for production
      console.log(`Sending OTP to WhatsApp: ${formData.phone}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWhatsappOtpRequested(true);
      toast.info('OTP Sent! (Test Code: 123456)');
    } catch (err: any) {
      toast.error('Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyWhatsappOTP = async () => {
    if (whatsappOtp !== '123456') { 
      toast.error('Invalid OTP. Use 123456 for testing.');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsWhatsappVerified(true);
      toast.success('WhatsApp number verified!');
    } catch (err: any) {
      toast.error('Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !isMissingInfo || !isCustomer || (!isRequested && !isProtectedPath)) return null;

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await detectFullLocation();
      
      setFormData(prev => ({
        ...prev,
        address: location.address || prev.address,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          timestamp: new Date().toISOString()
        }
      }));

      if (location.address) {
        toast.success('Address auto-populated via GPS!');
      } else {
        toast.success('GPS coordinates captured! Please enter address text.');
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      toast.error('Failed to detect location. Please enter manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    setFormData(prev => {
      const next = { ...prev, phone: val };
      if (isWhatsAppSame) {
        next.whatsappNumber = val;
      }
      return next;
    });
  };

  const toggleWhatsAppSame = () => {
    setIsWhatsAppSame(!isWhatsAppSame);
    if (!isWhatsAppSame) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phone }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      whatsappNumber: isWhatsAppSame ? formData.phone : formData.whatsappNumber
    };

    if (!finalData.name || !finalData.phone || !finalData.whatsappNumber || !finalData.address || (!profile?.email && !user?.email)) {
      toast.error('Please fill in all details');
      return;
    }

    if (!isWhatsappVerified) {
      toast.error('Please verify your WhatsApp number first (2FA)');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.updateDoc('users', user.uid, {
        ...finalData,
        isPhoneVerified: true,
        email: profile?.email || user.email || '',
        updatedAt: new Date().toISOString()
      });
      await refreshProfile();
      sessionStorage.removeItem('request_profile_completion');
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden font-sans relative"
      >
        <div className="bg-navy p-8 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-teal/20 p-3 rounded-2xl">
              <User className="text-teal" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Complete Profile</h2>
              <p className="text-[10px] font-black text-teal uppercase tracking-widest">Mandatory Verification</p>
            </div>
          </div>
          <p className="text-white/60 text-xs font-medium leading-relaxed mt-4">
            Hi {profile?.name?.split(' ')[0]}, we need a few more details to provide you with the best service experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-navy transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="Your real name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Contact Number (WhatsApp)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-navy transition-colors">
                  <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  required
                  disabled={whatsappOtpRequested || isWhatsappVerified}
                  placeholder="Your 10-digit number"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-24 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all disabled:opacity-50"
                  value={formData.phone || ""}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
                {!whatsappOtpRequested && !isWhatsappVerified && (
                  <button 
                    type="button"
                    onClick={handleRequestWhatsappOTP}
                    disabled={formData.phone.length < 10 || isSubmitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-navy text-white text-[8px] font-black rounded-xl uppercase tracking-widest hover:bg-teal disabled:opacity-30 transition-all shadow-lg shadow-navy/10"
                  >
                    Verify 2FA
                  </button>
                )}
                {isWhatsappVerified && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-teal flex items-center gap-1">
                    <span className="text-[8px] font-black uppercase">Verified</span>
                    <ShieldCheck size={18} />
                  </div>
                )}
              </div>

              {whatsappOtpRequested && !isWhatsappVerified && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-teal/5 border border-teal/10 rounded-2xl space-y-4"
                >
                  <div className="flex gap-2 mb-1">
                    <ShieldCheck size={14} className="text-teal" />
                    <p className="text-[8px] font-black text-teal uppercase tracking-widest">Enter OTP sent to your WhatsApp</p>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal transition-colors">
                      <MessageCircle size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="6-DIGIT CODE"
                      className="w-full bg-white border-2 border-teal/30 rounded-xl pl-12 pr-24 py-3 font-black text-sm tracking-[0.2em] outline-none focus:border-teal transition-all"
                      value={whatsappOtp}
                      onChange={(e) => setWhatsappOtp(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={handleVerifyWhatsappOTP}
                      disabled={isSubmitting || whatsappOtp.length < 4}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-teal text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-navy transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setWhatsappOtpRequested(false)}
                    className="text-[8px] font-black text-gray-400 uppercase tracking-widest hover:text-navy"
                  >
                    Resend or Change Number
                  </button>
                </motion.div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WhatsApp Verification Status</label>
              </div>
              
              <div className="p-4 bg-teal/5 rounded-2xl border border-teal/10">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", isWhatsappVerified ? "bg-teal text-white" : "bg-gray-100 text-gray-400")}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h6 className="text-[10px] font-black uppercase text-navy">{isWhatsappVerified ? 'Identity Verified' : 'Awaiting 2FA'}</h6>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{isWhatsappVerified ? 'Your WhatsApp is active for updates' : 'Verify above to enable account'}</p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 italic px-1">* We use this verified number to share live work photos and maintenance reports.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Service Address</label>
                <button 
                  type="button"
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  className="text-[9px] font-black text-blue-600 uppercase tracking-tighter hover:text-navy transition-colors flex items-center gap-1"
                >
                  <MapPin size={10} /> {isDetectingLocation ? 'Detecting...' : (formData.location ? 'Location Set ✓' : 'Auto-detect Location')}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-300 group-focus-within:text-navy transition-colors">
                  <MapPin size={18} />
                </div>
                <textarea 
                  required
                  placeholder="Street, Landmark, City..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all min-h-[100px] resize-none"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              {formData.location && (
                <p className="text-[9px] text-teal mt-2 font-bold px-1 flex items-center gap-1">
                  <ShieldCheck size={10} /> GPS Coordinates captured for faster technician routing.
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full h-16 bg-navy hover:bg-navy/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-navy/10 flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Updating...' : (
              <>
                Let's Get Started <ChevronRight size={18} className="text-teal" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompleteProfileModal;
