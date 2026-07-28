import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MessageCircle, ChevronRight, LogIn, MapPin, Loader2, ShieldCheck, Download, Upload, CreditCard, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, safeStringify } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { toast } from 'sonner';
import { formatWhatsAppLink, compressImage } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';

interface DirectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  subCategoryName: string;
  whatsapp: string;
  bookingType?: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH';
  price?: string | number;
  labourPrice?: number;
  materialPrice?: number;
  staffCategory?: string;
}

export default function DirectBookingModal({ 
  isOpen, 
  onClose, 
  serviceName, 
  subCategoryName, 
  whatsapp,
  bookingType = 'GENERAL',
  price,
  labourPrice = 0,
  materialPrice = 0,
  staffCategory
}: DirectBookingModalProps) {
  const { user, profile, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User Info
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsappNum, setWhatsappNum] = useState(profile?.whatsappNumber || profile?.phone || '');
  const [addressParts, setAddressParts] = useState({
    houseNo: '',
    street: profile?.address || '',
    landmark: '',
    pincode: '',
    city: ''
  });
  
  const address = [
    addressParts.houseNo,
    addressParts.street,
    addressParts.landmark,
    addressParts.city,
    addressParts.pincode ? `PIN: ${addressParts.pincode}` : ''
  ].filter(Boolean).join(', ');

  const [name, setName] = useState(profile?.name || user?.displayName || '');
  
  // Location
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(profile?.location || null);
  
  // Checkout States
  const [flow, setFlow] = useState<'CONTACT' | 'CHECKOUT'>('CONTACT');
  const [paymentPreference, setPaymentPreference] = useState<'Online Payment' | 'Cash Payment'>('Cash Payment');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [adminEmail, setAdminEmail] = useState('mustakansari9582@gmail.com');

  useEffect(() => {
    dataService.getDoc('settings', 'main').then((settings: any) => {
      if (settings && settings.email) setAdminEmail(settings.email);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      if (!name) setName(profile.name || user?.displayName || '');
      if (!phone) setPhone(profile.phone || '');
      if (!whatsappNum) setWhatsappNum(profile.whatsappNumber || profile.phone || '');
      if (!addressParts.street && profile.address) setAddressParts(prev => ({ ...prev, street: profile.address as string }));
      if (!locationCoords) setLocationCoords(profile.location || null);
    }
  }, [profile, user]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFlow('CONTACT');
      setPaymentProof(null);
    }
  }, [isOpen]);

  const isMissingInfo = !profile?.name || !profile?.phone || !profile?.whatsappNumber || !profile?.address || !profile?.email;

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectFullLocation();
      if (loc.address) {
        setAddressParts(prev => ({ ...prev, street: loc.address || '' }));
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

  // Pricing Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    if (bookingType === 'LABOUR') subtotal = labourPrice;
    if (bookingType === 'MATERIAL') subtotal = materialPrice;
    if (bookingType === 'BOTH') subtotal = labourPrice + materialPrice;
    if (bookingType === 'GENERAL') subtotal = Number(price) || 0;

    const advanceRequired = subtotal;
    const amountToPay = subtotal;

    return { subtotal, advanceRequired, amountToPay };
  };

  const generatePDFInvoice = async () => {
    try {
      const pdfData: PDFInvoiceData = {
        type: 'Estimate',
        number: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        customerName: name || user?.displayName || 'Valued Customer',
        customerPhone: phone || user?.phoneNumber || '',
        customerAddress: address,
        customerGSTIN: '',
        items: [
          ...(bookingType === 'LABOUR' || bookingType === 'BOTH' ? [{ name: 'Labour Charges', description: 'Service Labour', quantity: 1, rate: labourPrice, uom: 'Job', taxable: labourPrice, amount: labourPrice }] : []),
          ...(bookingType === 'MATERIAL' || bookingType === 'BOTH' ? [{ name: 'Material Charges', description: 'Service Material', quantity: 1, rate: materialPrice, uom: 'Job', taxable: materialPrice, amount: materialPrice }] : []),
          ...(bookingType === 'GENERAL' ? [{ name: 'Service Estimate', description: 'General Service', quantity: 1, rate: Number(price) || 0, uom: 'Job', taxable: Number(price) || 0, amount: Number(price) || 0 }] : []),
        ],
        summary: {
          taxableAmount: calculateTotals().subtotal,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          freightCharges: 0,
          discountAmount: 0,
          roundOff: 0
        },
        totalAmount: calculateTotals().subtotal,
        bankDetails: 'NAME: MUSTAK ANSARI \n BANK: BANK OF BARODA \n A/C: 26450200001659 \n IFSC: BARB0DEOGHA',
        companyPhone: '9582268658',
        companyAddress: '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
        logoUrl: window.location.origin + '/logo.png'
      };
      
      const doc = generateInvoicePDF(pdfData);
      const cleanFileName = `Estimate_${subCategoryName.replace(/\s+/g, '_')}`;
      doc.save(`${cleanFileName}.pdf`);
      toast.success('Estimate Downloaded Successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleWhatsAppConfirm = async () => {
    if (!validateContactInfo()) return;
    setIsSubmitting(true);
    await processBooking(false);
  };

  const handleWebsiteSubmit = async () => {
    setIsSubmitting(true);
    await processBooking(true);
  };

  const validateContactInfo = () => {
    if (!user) {
      login().catch(() => toast.error('Login failed.'));
      return false;
    }
    if (isMissingInfo && (!name || !phone || !whatsappNum || !address)) {
      toast.error('Please fill all contact fields.');
      return false;
    }
    return true;
  };

  const processBooking = async (isWebsiteCheckout: boolean) => {
    try {
      const typeText = bookingType === 'LABOUR' ? ' (Labour Only)' : bookingType === 'MATERIAL' ? ' (With Material)' : bookingType === 'BOTH' ? ' (Labour + Material)' : '';
      const { subtotal, advanceRequired, amountToPay } = calculateTotals();
      
      let proofUrl = '';
      if (isWebsiteCheckout && paymentProof) {
        setIsUploading(true);
        const compressed = await compressImage(paymentProof);
        proofUrl = compressed; // Base64 string from compressImage
        setIsUploading(false);
      }

      const bookingData = {
        userId: user!.uid,
        userName: name || profile?.name || user!.displayName,
        userPhone: phone,
        whatsappNumber: whatsappNum,
        userAddress: address,
        serviceName,
        serviceCategory: subCategoryName,
        category: serviceName, // Fallback
        subCategory: subCategoryName,
        tier: 'standard',
        price: subtotal,
        advanceAmount: advanceRequired,
        totalAmount: subtotal,
        bookingType,
        paymentPreference: 'Cash Payment',
        paymentProofUrl: '',
        status: 'Pending',
        timestamp: new Date().toISOString(),
        location: locationCoords ? {
          lat: locationCoords.lat,
          lng: locationCoords.lng,
          detectedAt: new Date().toISOString()
        } : null,
        staffCategory
      };

      const booking = await dataService.addDoc('bookings', bookingData);

      // Notification
      dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New Service Request!',
        message: `${bookingData.userName} requested ${subCategoryName}.`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings',
        relatedId: booking.id
      }).catch(() => {});

      if (!isWebsiteCheckout) {
        // Redirect to WhatsApp
        const waMessage = `Hi Atomic Solutions, I want to book ${subCategoryName}${typeText}. Please call me to confirm a visit date. (Customer Name: ${bookingData.userName}, Contact: ${phone}, WhatsApp: ${whatsappNum})`;
        const waUrl = formatWhatsAppLink(whatsapp, waMessage);
        toast.success('Booking Recorded! Opening WhatsApp...');
        setTimeout(() => window.open(waUrl, '_blank'), 800);
      } else {
        toast.success('Booking & Payment Proof Submitted successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to process request.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const { subtotal, amountToPay } = calculateTotals();

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
            className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#001f3f] p-8 text-white relative shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64FFDA] mb-2 flex items-center gap-2">
                Book Appointment 
                <span className={`px-2 py-0.5 rounded text-[8px] ${bookingType === 'LABOUR' ? 'bg-blue-500/20 text-blue-300' : bookingType === 'MATERIAL' ? 'bg-orange-500/20 text-orange-300' : bookingType === 'BOTH' ? 'bg-purple-500/20 text-purple-300' : 'bg-teal-500/20 text-teal-300'}`}>
                  {bookingType === 'LABOUR' ? 'Labour Only' : bookingType === 'MATERIAL' ? 'With Material' : bookingType === 'BOTH' ? 'Labour + Material' : 'General'}
                </span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{subCategoryName}</h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{serviceName}</p>
            </div>

            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <div className="p-8 space-y-6">
                {!user ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <LogIn size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-navy uppercase tracking-tight">Login Required</h4>
                      <p className="text-sm text-gray-500 font-medium">Please login with Google to book your service.</p>
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
                    <AnimatePresence mode="wait">
                      {flow === 'CONTACT' ? (
                        <motion.div 
                          key="contact"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          {isMissingInfo ? (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input 
                                  type="text"
                                  value={name}
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
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-[#25D366] uppercase tracking-widest ml-1">WhatsApp</label>
                                  <input 
                                    type="tel"
                                    value={whatsappNum}
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
                                    {isDetecting ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />} Auto-detect
                                  </button>
                                </div>
                                <div className="space-y-3 mt-1">
                                  <div className="grid grid-cols-2 gap-3">
                                    <input 
                                      type="text"
                                      placeholder="House / Flat No."
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                      value={addressParts.houseNo}
                                      onChange={(e) => setAddressParts({...addressParts, houseNo: e.target.value})}
                                    />
                                    <input 
                                      type="text"
                                      placeholder="Landmark"
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                      value={addressParts.landmark}
                                      onChange={(e) => setAddressParts({...addressParts, landmark: e.target.value})}
                                    />
                                  </div>
                                  
                                  <textarea 
                                    value={addressParts.street}
                                    onChange={(e) => setAddressParts({...addressParts, street: e.target.value})}
                                    placeholder="Street, Locality, Area..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none h-16"
                                  />
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <input 
                                      type="text"
                                      placeholder="City"
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                      value={addressParts.city}
                                      onChange={(e) => setAddressParts({...addressParts, city: e.target.value})}
                                    />
                                    <input 
                                      type="text"
                                      placeholder="Pincode"
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                      value={addressParts.pincode}
                                      onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-teal/5 p-4 rounded-2xl border border-teal/10">
                              <p className="text-[10px] font-black text-navy uppercase tracking-widest mb-2">My Saved Details</p>
                              <div className="space-y-1 text-xs font-bold text-gray-500">
                                <p>👤 {profile?.name}</p>
                                <p>📞 {profile?.phone}</p>
                                <p>📍 {profile?.address}</p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 pt-2">
                            <button
                              onClick={() => {
                                if (validateContactInfo()) setFlow('CHECKOUT');
                              }}
                              className="w-full bg-teal hover:bg-teal/90 text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl shadow-teal/20"
                            >
                              <CreditCard size={18} /> Checkout on Website
                            </button>

                            <button
                              onClick={handleWhatsAppConfirm}
                              disabled={isSubmitting}
                              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                              <MessageCircle size={18} className="text-[#25D366]" /> Continue via WhatsApp
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="checkout"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="space-y-6"
                        >
                          <button 
                            onClick={() => setFlow('CONTACT')}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-navy flex items-center gap-1 mb-4"
                          >
                            <ChevronRight size={12} className="rotate-180" /> Back to details
                          </button>

                          {/* Itemized Bill */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Estimated Costs (No GST)</h4>
                            
                            <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                              {(bookingType === 'LABOUR' || bookingType === 'BOTH') && (
                                <div className="flex justify-between items-center text-sm font-bold text-navy">
                                  <span>Labour Charges</span>
                                  <span>₹{labourPrice}</span>
                                </div>
                              )}
                              {(bookingType === 'MATERIAL' || bookingType === 'BOTH') && (
                                <div className="flex justify-between items-center text-sm font-bold text-navy">
                                  <span>Material Charges</span>
                                  <span>₹{materialPrice}</span>
                                </div>
                              )}
                              {bookingType === 'GENERAL' && (
                                <div className="flex justify-between items-center text-sm font-bold text-navy">
                                  <span>Service Estimate</span>
                                  <span>₹{subtotal}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-lg font-black text-navy">
                              <span>Total</span>
                              <span>₹{subtotal}</span>
                            </div>
                          </div>

                          {/* Information Banner */}
                          <div className="bg-teal/5 p-5 rounded-2xl border border-teal/10 space-y-2 text-center">
                            <p className="text-sm font-bold text-navy">No Payment Required Now</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Pay after service completion via Cash or Online</p>
                          </div>

                          <button
                            onClick={handleWebsiteSubmit}
                            disabled={isSubmitting || isUploading}
                            className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl shadow-[#001f3f]/20 disabled:opacity-50"
                          >
                            {isSubmitting || isUploading ? 'Processing...' : 'Confirm Booking'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
