import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MessageCircle, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { toast } from 'sonner';

interface DirectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  subCategoryName: string;
  whatsapp: string;
  bookingType?: 'LABOUR' | 'MATERIAL' | 'GENERAL';
}

export default function DirectBookingModal({ 
  isOpen, 
  onClose, 
  serviceName, 
  subCategoryName, 
  whatsapp,
  bookingType = 'GENERAL'
}: DirectBookingModalProps) {
  const { user, profile, login } = useAuth();
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    'Morning (9 AM - 12 PM)',
    'Afternoon (12 PM - 4 PM)',
    'Evening (4 PM - 8 PM)'
  ];

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

    if (!date) {
      toast.error('Please select a preferred date');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      await dataService.addDoc('bookings', {
        userId: user.uid,
        userName: profile?.name || user.displayName || 'User',
        userEmail: user.email,
        userPhone: profile?.phone || '',
        whatsappNumber: profile?.whatsappNumber || profile?.phone || '',
        serviceName,
        subCategory: subCategoryName,
        bookingDate: date,
        timeSlot,
        bookingType,
        status: 'Pending',
        timestamp: new Date().toISOString()
      });

      // Notify admin
      await dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New Direct Booking',
        message: `${profile?.name || user.displayName || 'User'} booked ${subCategoryName} via WhatsApp.`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings-list'
      });

      const typeText = bookingType === 'LABOUR' ? ' (Labour Only)' : bookingType === 'MATERIAL' ? ' (With Material)' : '';
      const waNum = profile?.whatsappNumber || profile?.phone || '';
      const message = `Hi Atomic Solutions, I want to book ${subCategoryName}${typeText} for ${date} at ${timeSlot}. Please confirm. (Customer Name: ${profile?.name || user.displayName}, Contact: ${profile?.phone || ''}, WhatsApp: ${waNum})`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${whatsapp}?text=${encodedMessage}`, '_blank');
      toast.success('Booking recorded! Redirecting to WhatsApp...');
      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to save booking. Please try again.');
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
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64FFDA] mb-2">Book Appointment</div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{subCategoryName}</h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{serviceName}</p>
            </div>

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
                  {/* Date Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Calendar size={14} className="text-[#008080]" />
                      Preferred Service Date
                    </label>
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Time Slot Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Clock size={14} className="text-[#008080]" />
                      Preferred Time Slot
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          disabled={isSubmitting}
                          onClick={() => setTimeSlot(slot)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            timeSlot === slot 
                              ? 'bg-[#008080] border-[#008080] text-white shadow-lg shadow-[#008080]/20' 
                              : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-[#008080]/30'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase tracking-widest">{slot}</span>
                          {timeSlot === slot && <div className="w-2 h-2 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl shadow-[#001f3f]/20 group disabled:opacity-50"
                  >
                    {isSubmitting ? 'Recording Booking...' : 'Confirm & WhatsApp'}
                    {!isSubmitting && <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />}
                  </button>
                </>
              )}
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
