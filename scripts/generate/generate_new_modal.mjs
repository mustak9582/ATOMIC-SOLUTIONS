import fs from 'fs';

const oldContent = fs.readFileSync('src/components/DirectBookingModal.tsx', 'utf-8');

// The new component is quite large, I will construct it by modifying the existing one
// Wait, actually writing a completely new file is cleaner.

const newContent = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MessageCircle, ChevronRight, LogIn, MapPin, Loader2, ShieldCheck, Download, Upload, CreditCard, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, safeStringify, storageService } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { toast } from 'sonner';
import { formatWhatsAppLink, compressImage } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  const [address, setAddress] = useState(profile?.address || '');
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  
  // Location
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(profile?.location || null);
  
  // Checkout States
  const [flow, setFlow] = useState<'CONTACT' | 'CHECKOUT'>('CONTACT');
  const [paymentPreference, setPaymentPreference] = useState<'50% Advance' | '100% Full Payment'>('50% Advance');
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
      if (!address) setAddress(profile.address || '');
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

  // Pricing Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    if (bookingType === 'LABOUR') subtotal = labourPrice;
    if (bookingType === 'MATERIAL') subtotal = materialPrice;
    if (bookingType === 'BOTH') subtotal = labourPrice + materialPrice;
    if (bookingType === 'GENERAL') subtotal = Number(price) || 0;

    const advanceRequired = subtotal * 0.5;
    const amountToPay = paymentPreference === '50% Advance' ? advanceRequired : subtotal;

    return { subtotal, advanceRequired, amountToPay };
  };

  const generatePDFInvoice = async () => {
    const { subtotal, advanceRequired, amountToPay } = calculateTotals();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Base layout similar to test_invoice
    doc.setFillColor(0, 31, 63); // Navy header
    doc.rect(5, 5, pageWidth - 10, 35, 'F');
    
    // Try to add Logo
    try {
      const imgData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No context');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = window.location.origin + '/logo.png';
      });
      // 3:2 ratio => 27x18
      doc.addImage(imgData, 'PNG', 15, 12, 27, 18);
    } catch (e) {
      // Fallback text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ATOMIC SOLUTIONS', 15, 25);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA INVOICE', pageWidth - 15, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('EST-' + Date.now().toString().slice(-6), pageWidth - 15, 33, { align: 'right' });

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(name || 'Customer', 15, 62);
    doc.text(phone || '', 15, 68);
    if (address) {
      const splitAddress = doc.splitTextToSize(address, 80);
      doc.text(splitAddress, 15, 74);
    }

    // Service Info
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE DETAILS:', pageWidth - 80, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(serviceName, pageWidth - 80, 62);
    doc.text(subCategoryName, pageWidth - 80, 68);
    doc.text(\`Type: \${bookingType}\`, pageWidth - 80, 74);

    // Items
    const items = [];
    if (bookingType === 'LABOUR' || bookingType === 'BOTH') {
      items.push(['Labour Charges', '1', \`Rs. \${labourPrice}\`]);
    }
    if (bookingType === 'MATERIAL' || bookingType === 'BOTH') {
      items.push(['Material Charges', '1', \`Rs. \${materialPrice}\`]);
    }
    if (bookingType === 'GENERAL') {
      items.push(['Service Estimate', '1', \`Rs. \${subtotal}\`]);
    }

    (doc as any).autoTable({
      startY: 90,
      head: [['Description', 'Qty', 'Amount']],
      body: items,
      theme: 'grid',
      headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Totals
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', pageWidth - 55, finalY);
    doc.text(\`Rs. \${subtotal}\`, pageWidth - 15, finalY, { align: 'right' });
    
    doc.text('GST (0%):', pageWidth - 55, finalY + 8);
    doc.text('Rs. 0', pageWidth - 15, finalY + 8, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(0, 31, 63);
    doc.text('TOTAL:', pageWidth - 55, finalY + 20);
    doc.text(\`Rs. \${subtotal}\`, pageWidth - 15, finalY + 20, { align: 'right' });

    // Payment Info
    doc.setFillColor(240, 245, 250);
    doc.rect(15, finalY + 30, pageWidth - 30, 40, 'F');
    doc.setTextColor(0, 31, 63);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT REQUIRED NOW:', 20, finalY + 42);
    doc.setFontSize(16);
    doc.text(\`Rs. \${amountToPay} (\${paymentPreference})\`, 20, finalY + 52);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Please pay via Bank Transfer / UPI and upload the screenshot on our website to confirm.', 20, finalY + 62);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(0, 31, 63);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S'); // Outer border

    doc.setFontSize(8);
    doc.text('For Support & Queries, WhatsApp us at: +91 95822 68658', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(\`Estimate_\${subCategoryName.replace(/\\s+/g, '_')}.pdf\`);
    toast.success('Invoice downloaded!');
  };

  const handleWhatsAppConfirm = async () => {
    if (!validateContactInfo()) return;
    setIsSubmitting(true);
    await processBooking(false);
  };

  const handleWebsiteSubmit = async () => {
    if (!paymentProof) {
      toast.error('Please upload your payment screenshot to proceed.');
      return;
    }
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
        proofUrl = await storageService.uploadFile(compressed, \`bookings/\${Date.now()}_\${user?.uid}_proof\`);
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
        paymentPreference: isWebsiteCheckout ? paymentPreference : undefined,
        paymentProofUrl: proofUrl,
        status: isWebsiteCheckout ? 'Verification Pending' : 'Pending',
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
        title: isWebsiteCheckout ? 'New Booking (Payment Uploaded)' : 'New Service Request!',
        message: \`\${bookingData.userName} requested \${subCategoryName}.\`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings',
        relatedId: booking.id
      }).catch(() => {});

      if (!isWebsiteCheckout) {
        // Redirect to WhatsApp
        const waMessage = \`Hi Atomic Solutions, I want to book \${subCategoryName}\${typeText}. Please call me to confirm a visit date. (Customer Name: \${bookingData.userName}, Contact: \${phone}, WhatsApp: \${whatsappNum})\`;
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
                <span className={\`px-2 py-0.5 rounded text-[8px] \${bookingType === 'LABOUR' ? 'bg-blue-500/20 text-blue-300' : bookingType === 'MATERIAL' ? 'bg-orange-500/20 text-orange-300' : bookingType === 'BOTH' ? 'bg-purple-500/20 text-purple-300' : 'bg-teal-500/20 text-teal-300'}\`}>
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
                                <textarea 
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  placeholder="Site location..."
                                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none h-20"
                                />
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

                          {/* Payment Preference */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Plan</label>
                            <div className="grid grid-cols-2 gap-3">
                              {(['50% Advance', '100% Full Payment'] as const).map(pref => (
                                <button
                                  key={pref}
                                  onClick={() => setPaymentPreference(pref)}
                                  className={\`p-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 \${paymentPreference === pref ? 'border-navy bg-navy/5 text-navy' : 'border-slate-100 text-slate-400 hover:border-slate-200'}\`}
                                >
                                  {pref}
                                  {paymentPreference === pref && <CheckCircle2 size={14} className="text-teal" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Action Items */}
                          <div className="bg-teal/5 p-5 rounded-2xl border border-teal/10 space-y-4">
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-teal mb-1">Amount to Pay Now</p>
                              <p className="text-2xl font-black text-navy">₹{amountToPay}</p>
                            </div>

                            <button
                              onClick={generatePDFInvoice}
                              className="w-full bg-white border border-teal/20 text-teal h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all hover:bg-teal/5"
                            >
                              <Download size={16} /> Download Invoice
                            </button>

                            <div className="pt-2 border-t border-teal/10">
                              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-teal/30 rounded-xl cursor-pointer hover:bg-teal/5 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload size={20} className="text-teal mb-2" />
                                  <p className="text-xs font-bold text-navy">
                                    {paymentProof ? paymentProof.name : 'Upload Payment Screenshot'}
                                  </p>
                                </div>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={handleWebsiteSubmit}
                            disabled={isSubmitting || isUploading || !paymentProof}
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
`;

fs.writeFileSync('src/components/DirectBookingModal.tsx', newContent);
console.log('DirectBookingModal.tsx completely rewritten.');
