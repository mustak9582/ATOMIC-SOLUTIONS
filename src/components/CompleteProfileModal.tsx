import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin, ChevronRight, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { toast } from 'sonner';

const CompleteProfileModal: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    location: profile?.location || null,
    staffCategory: ''
  });
  const [addressParts, setAddressParts] = useState({
    houseNo: '',
    street: profile?.address || '',
    landmark: '',
    pincode: '',
    city: ''
  });

  useEffect(() => {
    const fullAddress = [
      addressParts.houseNo,
      addressParts.street,
      addressParts.landmark,
      addressParts.city,
      addressParts.pincode ? `PIN: ${addressParts.pincode}` : ''
    ].filter(Boolean).join(', ');
    setFormData(prev => ({ ...prev, address: fullAddress }));
  }, [addressParts]);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const isProfessionalSignup = sessionStorage.getItem('is_professional_signup') === 'true';

  // Visibility logic: only show if missing info AND we are in a booking flow (flagged in session)
  // Or if the user explicitly clicked a "Complete Profile" button (future proofing)
  const isMissingInfo = user && (!profile?.name || !profile?.phone || !profile?.address || !profile?.email);
  const isCustomer = user && !profile?.isAdmin && !profile?.isStaff;
  const isRequested = sessionStorage.getItem('request_profile_completion') === 'true';
  const isProtectedPath = window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/professional') || window.location.pathname.startsWith('/my-account');

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await detectFullLocation();

      setAddressParts(prev => ({ ...prev, street: location.address || prev.street }));
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
      toast.error('Failed to detect location automatically. Please enter it manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Auto-detect location on mount if address is missing
  useEffect(() => {
    if ((isMissingInfo && (isRequested || isProtectedPath)) && !formData.address && !isDetectingLocation) {
      detectLocation();
    }
  }, [isMissingInfo, isRequested, isProtectedPath]);

  if (!user || !isMissingInfo || !isCustomer || (!isRequested && !isProtectedPath)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address || (!profile?.email && !user?.email) || (isProfessionalSignup && !formData.staffCategory)) {
      toast.error('Please fill in all details');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.updateDoc('users', user.uid, {
        ...formData,
        whatsappNumber: formData.phone, // Auto-set whatsapp to phone
        isPhoneVerified: true, // Auto-verify since we removed mock OTP
        email: profile?.email || user.email || '',
        updatedAt: new Date().toISOString(),
        ...(isProfessionalSignup && {
          isStaff: true,
          staffStatus: 'pending',
          staffCategory: formData.staffCategory
        })
      });
      await refreshProfile();
      sessionStorage.removeItem('request_profile_completion');
      sessionStorage.removeItem('is_professional_signup');
      toast.success('Profile updated successfully! Welcome to Atomic Solutions.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload profile data. Please check your internet connection.');
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
              <p className="text-[10px] font-black text-teal uppercase tracking-widest">Final Step</p>
            </div>
          </div>
          <p className="text-white/60 text-xs font-medium leading-relaxed mt-4">
            Hi {profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0]}, please provide your contact details to complete your setup.
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  placeholder="Your 10-digit number"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
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
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="House / Flat No."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                    value={addressParts.houseNo}
                    onChange={(e) => setAddressParts({ ...addressParts, houseNo: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Landmark"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                    value={addressParts.landmark}
                    onChange={(e) => setAddressParts({ ...addressParts, landmark: e.target.value })}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-4 text-gray-300 group-focus-within:text-navy transition-colors">
                    <MapPin size={18} />
                  </div>
                  <textarea
                    placeholder="Street, Locality, Area..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all min-h-[80px] resize-none"
                    value={addressParts.street}
                    onChange={(e) => setAddressParts({ ...addressParts, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                    value={addressParts.city}
                    onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all"
                    value={addressParts.pincode}
                    onChange={(e) => setAddressParts({ ...addressParts, pincode: e.target.value })}
                  />
                </div>
              </div>
              {formData.location && (
                <p className="text-[9px] text-teal mt-2 font-bold px-1 flex items-center gap-1">
                  <ShieldCheck size={10} /> GPS Coordinates captured for faster technician routing.
                </p>
              )}
            </div>

            {isProfessionalSignup && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Profession / Category</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-navy transition-colors pointer-events-none">
                    <ShieldCheck size={18} />
                  </div>
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-navy outline-none focus:bg-white focus:border-navy transition-all appearance-none cursor-pointer"
                    value={formData.staffCategory}
                    onChange={(e) => setFormData({ ...formData, staffCategory: e.target.value })}
                  >
                    <option value="" disabled>Select your profession</option>
                    <option value="AC Technician">AC Technician</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Painter">Painter</option>
                    <option value="General Service">General Service</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-16 bg-navy hover:bg-navy/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-navy/10 flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Saving Profile...' : (
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
