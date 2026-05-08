import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Service, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, MapPin, Phone, User, MessageCircle as WhatsApp } from 'lucide-react';
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

  // Form state
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsappNumber || profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState('Morning (10 AM - 1 PM)');

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Update profile first if info changed
      if (name !== profile.name || phone !== profile.phone || address !== profile.address || whatsapp !== profile.whatsappNumber) {
        await updateProfile({ name, phone, address, whatsappNumber: whatsapp });
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
        serviceId: service.id,
        serviceName: service.name,
        category: (service.category as any) || 'General',
        tier: tier,
        price: (service.prices as any)[tier] || 0,
        status: 'Pending',
        timestamp: new Date().toISOString(),
        appointmentDate: date,
        appointmentSlot: slot
      };

      await dataService.setDoc('bookings', bookingId, newBooking);
      
      // Create notification for admin
      await dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New Booking Received',
        message: `${name} has booked ${service.name} for ${date}.`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings-list'
      });

      setSuccess(true);
      toast.success('Service booked successfully!');
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
            <h3 className="text-2xl font-black text-navy mb-2 uppercase tracking-tighter">Booking Confirmed!</h3>
            <p className="text-gray-500 font-medium mb-8 px-4">Our expert team will visit on <span className="text-navy font-black">{new Date(date).toLocaleDateString()}</span> during <span className="text-navy font-black">{slot}</span>.</p>
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
              Confirm your <span className="text-white border-b-2 border-teal pb-0.5">{tier}</span> package
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Estimated Cost</div>
            <div className="text-3xl font-black text-teal">₹{(service.prices as any)[tier] || 'TBD'}</div>
          </div>
        </div>

        <form onSubmit={handleBooking} className="p-8 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Service Date</Label>
              <Input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
                className="h-12 rounded-xl border-gray-100 font-black text-xs text-navy focus:border-teal"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Time Slot</Label>
              <select 
                value={slot}
                onChange={e => setSlot(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-100 bg-white px-3 font-black text-[10px] text-navy outline-none focus:border-teal"
              >
                <option>Morning (10 AM - 1 PM)</option>
                <option>Afternoon (1 PM - 4 PM)</option>
                <option>Evening (4 PM - 7 PM)</option>
              </select>
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
            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Service Address</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-teal" size={16} />
              <textarea 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                required 
                placeholder="Full Site Location in Deoghar"
                className="flex min-h-[80px] w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-sm ring-offset-white placeholder:text-gray-200 outline-none focus:border-teal pl-12 font-medium"
              />
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
