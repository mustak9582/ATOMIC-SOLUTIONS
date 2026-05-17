import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Service, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dataService, safeStringify } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { WHATSAPP_NUMBER } from '../constants';
import { toast } from 'sonner';
import { formatWhatsAppLink } from '../lib/utils';
import { Calendar, CheckCircle2, MapPin, Phone, User, MessageCircle as WhatsApp, Loader2 } from 'lucide-react';
import Logo from './Logo';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  tier: 'basic' | 'standard' | 'premium';
}

export default function BookingModal({ isOpen, onClose, service, tier }: BookingModalProps) {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [adminEmail, setAdminEmail] = useState('mustakansari9582@gmail.com');

  React.useEffect(() => {
    // Try to get admin email from settings
    dataService.getDoc('settings', 'main').then((settings: any) => {
      if (settings && settings.email) {
        setAdminEmail(settings.email);
      }
    }).catch(() => {});
  }, []);

  // Form state
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsappNumber || profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(profile?.location || null);

  React.useEffect(() => {
    if (profile) {
      if (!name) setName(profile.name || '');
      if (!phone) setPhone(profile.phone || '');
      if (!whatsapp) setWhatsapp(profile.whatsappNumber || profile.phone || '');
      if (!address) setAddress(profile.address || '');
      if (!locationCoords) setLocationCoords(profile.location || null);
    }
  }, [profile]);

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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Prepare profile update if info changed
      const locationData = locationCoords ? {
        ...locationCoords,
        address: address,
        timestamp: new Date().toISOString()
      } : profile.location;

      if (name !== profile.name || phone !== profile.phone || address !== profile.address || whatsapp !== profile.whatsappNumber || safeStringify(locationCoords) !== safeStringify(profile.location)) {
        await updateProfile({ 
          name, 
          phone, 
          address, 
          whatsappNumber: whatsapp,
          location: locationData
        }).catch(err => console.warn('Profile update failed', err));
      }

      // 2. Create booking
      const bookingId = `book_${Date.now()}`;
      const newBooking: Booking = {
        id: bookingId,
        userId: profile.uid,
        userName: name,
        userPhone: phone,
        whatsappNumber: whatsapp,
        userAddress: address,
        location: locationData,
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.staffCategory || '',
        category: (service.category as any) || 'General',
        tier: tier,
        price: (service.prices as any)[tier] || 0,
        status: 'Pending',
        timestamp: new Date().toISOString(),
      };

      // Record booking
      await dataService.setDoc('bookings', bookingId, newBooking);
      
      // Send email notification to admin via server
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ 
          booking: newBooking, 
          adminEmail: adminEmail 
        })
      }).catch(err => console.warn('Email notification failed', err));
      
      // 3. Prepare WhatsApp Message
      const waMessage = `Hi Atomic Solutions, I want to book ${service.name} (${tier} package). My address is: ${address}. Please confirm a visit date. (Name: ${name}, Contact: ${phone})`;
      const waUrl = formatWhatsAppLink(WHATSAPP_NUMBER, waMessage);

      // 4. Create notification for admin
      await dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New Booking! (Date Pending)',
        message: `${name} has requested ${service.name}. Admin needs to assign visit date.`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings',
        relatedId: bookingId
      }).catch(err => console.warn('Admin notification failed', err));

      setSuccess(true);
      toast.success('Request submitted! Opening WhatsApp...');
      
      // Redirect after a short delay
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error('Failed to book service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] font-sans">
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="text-teal" size={40} />
            </div>
            <h3 className="text-2xl font-black text-navy mb-2 uppercase tracking-tighter">Request Submitted!</h3>
            <p className="text-gray-500 font-medium mb-8 px-4">Our expert team will contact you soon to <span className="text-navy font-black underline decoration-teal decoration-2 underline-offset-4">SCHEDULE A VISIT</span> at your convenience.</p>
            <Button onClick={onClose} className="w-full h-14 rounded-2xl bg-navy hover:bg-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden outline-none font-sans border-none shadow-2xl">
        <div className="bg-navy p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Logo size="lg" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{service.name}</DialogTitle>
            <DialogDescription className="text-teal font-black uppercase tracking-widest text-[10px] opacity-80">
              Confirm your <span className="text-white border-b-2 border-teal pb-0.5">{tier}</span> package request
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Estimated Cost</div>
            <div className="text-3xl font-black text-teal">₹{(service.prices as any)[tier] || 'TBD'}</div>
          </div>
        </div>

        <form onSubmit={handleBooking} className="p-8 space-y-5 bg-white">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal shrink-0">
               <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-navy uppercase tracking-widest mb-1">Schedule Visit</p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Our engineer will call you to confirm a convenient date and time for the visit.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Site Contact Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-teal" size={16} />
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Full Name"
                className="pl-12 h-12 rounded-xl border-gray-100 font-bold text-sm text-navy focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal" size={16} />
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  placeholder="95822..."
                  className="pl-12 h-12 rounded-xl border-gray-100 font-bold text-sm text-navy focus:border-teal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">WhatsApp</Label>
              <div className="relative">
                <WhatsApp className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]" size={16} />
                <Input 
                  value={whatsapp} 
                  onChange={e => setWhatsapp(e.target.value)} 
                  required 
                  placeholder="95822..."
                  className="pl-12 h-12 rounded-xl border-gray-100 font-bold text-sm text-navy focus:border-teal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Service Address</Label>
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
                {isDetecting ? 'Detecting...' : 'Auto-detect'}
              </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-teal" size={16} />
              <textarea 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                required 
                placeholder="Full Site Location in Deoghar"
                className="flex min-h-[80px] w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-sm ring-offset-white placeholder:text-gray-200 outline-none focus:border-teal pl-12 font-medium"
              />
              {locationCoords && (
                <p className="text-[9px] text-teal mt-2 font-bold px-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={10} /> GPS Coordinates captured for faster technician routing.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full h-16 rounded-2xl bg-navy hover:bg-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20 transition-all active:scale-95">
              {loading ? 'Securing Slot...' : 'Confirm Visit Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
