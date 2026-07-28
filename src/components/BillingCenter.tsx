import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
import { 
  Plus, 
  Trash2, 
  Download, 
  MessageCircle, 
  FileText,
  User as UserIcon,
  MapPin,
  Calendar,
  Calculator,
  Search,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, formatWhatsAppLink } from '../lib/utils';
import Logo from './Logo';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Service, SubCategory, UserProfile, BillingItem, Invoice, AppSettings, Booking } from '../types';
import { toast } from 'sonner';
import { dataService } from '../services/firebaseService';

const commonUnits = ['Nos', 'Meter', 'Unit', 'HP', 'Job', 'Sq.Ft.', 'Sq. Ft.', 'Square Feet', 'Per Sq. Ft.', 'Kg'];

interface BillingCenterProps {
  services?: Service[];
  whatsapp?: string;
}

export default function BillingCenter({ services: propServices, whatsapp: propWhatsapp }: BillingCenterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillBooking = location.state?.booking as Booking | undefined;
  const [internalServices, setInternalServices] = useState<Service[]>([]);
  const services = propServices || internalServices;
  const whatsapp = propWhatsapp || '+919582268658'; // Default admin whatsapp
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [items, setItems] = useState<BillingItem[]>([
    { id: '1', name: '', description: '', hsn: '', rate: 0, quantity: 1, unit: 'Unit', type: 'Labor' }
  ]);
  const [discount, setDiscount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [estimateNumber, setEstimateNumber] = useState(`EST-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInvoice, setIsInvoice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ownerGSTIN, setOwnerGSTIN] = useState('');
  
  // Footer Options
  const [bankDetails, setBankDetails] = useState('NAME: MUSTAK ANSARI\nBANK NAME: BANK OF BARODA\nIFSC CODE: BARB0DEOGHA\nA/C: 26450200001659\nPAN: CVVPA9010L');
  const [terms, setTerms] = useState('1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.');
  const [declaration, setDeclaration] = useState('1. Subject to Deoghar (Jharkhand) jurisdiction\n2. Terms & conditions are subject to our trade policy\n3. Our risk & responsibility ceases after the delivery of goods.\nE. & O.E.');

  // For adding recommended items
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [pricingType, setPricingType] = useState<'labour' | 'material'>('labour');

  
  useEffect(() => {
    if (prefillBooking) {
      setCustomerName(prefillBooking.userName || '');
      setCustomerPhone(prefillBooking.whatsappNumber || prefillBooking.userPhone || '');
      setCustomerAddress(prefillBooking.userAddress || '');
      if (prefillBooking.userId) setSelectedUserId(prefillBooking.userId);
      
      setItems([
        {
          id: Date.now().toString() + '-labor',
          name: prefillBooking.serviceName + ' (Labor)',
          description: `Tier: ${prefillBooking.tier}\nSub-category: ${prefillBooking.subCategory || 'N/A'}`,
          hsn: '',
          rate: prefillBooking.price || 0,
          quantity: 1,
          unit: 'Job',
          type: 'Labor'
        },
        {
          id: Date.now().toString() + '-material',
          name: prefillBooking.serviceName + ' (Material)',
          description: `Materials required for the job`,
          hsn: '',
          rate: 0,
          quantity: 1,
          unit: 'Job',
          type: 'Material'
        }
      ]);
      
      setIsInvoice(true);
      setShowEditor(true);
      
      // Clear router state to prevent infinite loop on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [prefillBooking]);

  useEffect(() => {
    dataService.getCollection('users').then(users => {
      setAllUsers(users as UserProfile[]);
    });

    dataService.getCollection('settings').then(data => {
      if (data && data.length > 0) {
        const s = data[0] as AppSettings;
        setSettings(s);
        if (s.ownerGSTIN) setOwnerGSTIN(s.ownerGSTIN);
      }
    });

    if (!propServices) {
      dataService.getCollection('services').then(data => {
        setInternalServices(data as Service[]);
      });
    }
  }, [propServices]);

  const updateOwnerGSTIN = async (val: string) => {
    setOwnerGSTIN(val);
    if (settings?.id) {
       await dataService.updateDoc('settings', settings.id, { ownerGSTIN: val });
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedSub = selectedService?.subCategories?.find(sub => sub.id === selectedSubId);

  const addNewRow = (type: 'Labor' | 'Material' | 'General' = 'Labor') => {
    const newItem: BillingItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      hsn: '',
      rate: 0,
      quantity: 1,
      unit: 'Unit',
      type
    };
    setItems([...items, newItem]);
  };

  const addRecommendedItem = () => {
    if (!selectedSub) {
      toast.error('Please select a service');
      return;
    }

    const rate = pricingType === 'labour' 
      ? (selectedSub.labourMin || selectedSub.minPrice || 0)
      : (selectedSub.materialMin || selectedSub.minPrice || 0);

    const newItem: BillingItem = {
      id: Date.now().toString(),
      name: selectedSub.name,
      description: `${selectedService?.name} (${pricingType === 'labour' ? 'Labour Only' : 'With Material'})`,
      hsn: '',
      rate,
      quantity: 1,
      unit: selectedSub.unit || 'Unit',
      type: pricingType === 'labour' ? 'Labor' : 'Material'
    };

    setItems([...items, newItem]);
    setSelectedSubId('');
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BillingItem, value: string | number) => {
    let finalValue = value;
    if (field === 'rate' || field === 'quantity') {
      finalValue = value === '' ? 0 : Number(value);
    }
    setItems(items.map(i => i.id === id ? { ...i, [field]: finalValue } : i));
  };

  const subTotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const discountedTotal = subTotal - discount;
  const gstAmount = (discountedTotal * gstPercentage) / 100;
  const total = discountedTotal + gstAmount + roundOff;

  const saveToDatabase = async () => {
    if (items.length === 0) return;
    setIsSaving(true);
    try {
      const docData: Omit<Invoice, 'id'> = {
        userId: selectedUserId || null,
        customerName: customerName || 'Valued Customer',
        customerPhone,
        customerAddress,
        customerGSTIN,
        estimateNumber: isInvoice ? estimateNumber.replace('EST', 'INV') : estimateNumber,
        type: isInvoice ? 'Invoice' : 'Estimate',
        date: invoiceDate,
        items: items.filter(item => item.name.trim() !== ''),
        subTotal,
        discount,
        roundOff,
        gstPercentage,
        gstAmount,
        totalAmount: total,
        bankDetails,
        terms,
        declaration,
        status: isInvoice ? 'Sent' : 'Draft',
        timestamp: new Date().toISOString()
      };
      const result = await dataService.addDoc('invoices', docData);
      toast.success('Record saved to Database');
      return result;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save to database');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const logoUrl = settings?.logoUrl || window.location.origin + '/logo.png';
    const pdfData: PDFInvoiceData = {
      type: isInvoice ? 'Invoice' : 'Estimate',
      number: `${isInvoice ? 'INV-' : 'EST-'}${estimateNumber.split('-').pop()}`,
      date: invoiceDate,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      customerGSTIN: customerGSTIN,
      ownerGSTIN: ownerGSTIN,
      payMode: 'UPI',
      items: items.filter(i => i.name.trim() !== '').map(i => {
        const taxable = i.rate * i.quantity;
        const itemGstAmt = isInvoice ? (taxable * gstPercentage) / 100 : 0;
        return {
          name: i.name,
          description: i.description,
          hsn: i.hsn,
          uom: i.unit,
          quantity: i.quantity,
          rate: i.rate,
          taxable: taxable,
          gstPercent: isInvoice && gstPercentage > 0 ? gstPercentage : undefined,
          gstAmount: isInvoice && itemGstAmt > 0 ? itemGstAmt : undefined,
          amount: taxable + itemGstAmt
        };
      }),
      summary: {
        taxableAmount: isInvoice ? discountedTotal : subTotal,
        cgstAmount: isInvoice ? gstAmount / 2 : 0,
        sgstAmount: isInvoice ? gstAmount / 2 : 0,
        igstAmount: 0, // Assume intra-state for now unless implemented
        freightCharges: 0,
        discountAmount: discount,
        roundOff: roundOff
      },
      totalAmount: isInvoice ? total : (subTotal + roundOff),
      bankDetails: bankDetails,
      terms: terms,
      declaration: declaration,
      companyPhone: settings?.phone || '9582268658',
      companyAddress: settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
      logoUrl: logoUrl
    };
    return generateInvoicePDF(pdfData);
  };

  const handleDownload = async () => {
    try {
      toast.info('Preparing PDF...');
      const doc = generatePDF();
      const cleanFileName = `${isInvoice ? 'Invoice' : 'Estimate'}_${estimateNumber}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      await saveToDatabase();
      toast.success('PDF Downloaded & Record Saved');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download PDF');
    }
  };

  const handleWhatsAppShare = async () => {
    const docType = isInvoice ? 'Tax Invoice' : 'Estimate';
    
    try {
      const savedDoc = await saveToDatabase();
      const shareUrl = `${window.location.origin}/invoice/${savedDoc?.id}`;
      
      const message = `Hi ${customerName},\n\nHope you're doing well! Your ${docType} (#${estimateNumber}) from *ATOMIC SOLUTIONS* is ready.\n\n*Grand Total: ₹ ${total.toLocaleString('en-IN')}*\n\n*View/Download here:* ${shareUrl}\n\nPlease find the details above. We bring comfort to your life!\n\nFounder: Mustak Ansari (PIN: 814149)\nAdmin: +91 95822 68658`;
      
      const targetPhone = (customerPhone || whatsapp);
      window.open(formatWhatsAppLink(targetPhone, message), '_blank');
    } catch (err) {
      toast.error('Failed to generate share link');
    }
  };

  if (showEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-sans">
        {/* Editor Toolbar */}
        <div className="bg-navy p-4 flex justify-between items-center text-white border-b border-white/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all mr-2"
            >
              <ArrowLeft size={20} />
            </button>
            <Logo />
            <div className="h-8 w-px bg-white/20 mx-2" />
            <h1 className="font-black text-xs uppercase tracking-widest text-teal">Live Invoice Builder</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
               <button 
                 onClick={() => setIsInvoice(false)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isInvoice ? 'bg-teal text-navy' : 'text-white/40 hover:text-white'}`}
               >Estimate</button>
               <button 
                 onClick={() => setIsInvoice(true)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isInvoice ? 'bg-teal text-navy' : 'text-white/40 hover:text-white'}`}
               >Invoice</button>
             </div>
             <button onClick={() => setShowEditor(false)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Close Editor</button>
          </div>
        </div>

        {/* Editor Main Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12">
          <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-[40px] overflow-hidden min-h-screen flex flex-col border border-gray-100 mb-12">
            {/* Branding Header Area */}
            <div className="bg-gray-50/50 p-12 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-8">
              <div>
                <h2 className="text-3xl font-black text-navy tracking-tight mb-1">ATOMIC SOLUTIONS</h2>
                <p className="text-xs font-bold text-teal italic mb-6">"We Bring Comfort Life"</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-navy uppercase tracking-widest">Founder: Mustak Ansari | PIN: 814149</p>
                  <p className="text-[10px] font-medium text-gray-400">Branch: Deoghar, Jharkhand - 814149</p>
                  <p className="text-[10px] font-medium text-gray-400">Mob: +91 95822 68658 | Email: atomichvacsolutions@gmail.com</p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">My GSTIN:</span>
                    <input 
                      className="bg-teal/5 border border-teal/10 rounded px-2 py-0.5 text-[9px] font-bold text-teal outline-none w-32"
                      placeholder="Your GSTIN"
                      value={ownerGSTIN}
                      onChange={(e) => updateOwnerGSTIN(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="inline-block bg-navy px-6 py-2 rounded-xl">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">{isInvoice ? 'Invoice' : 'Estimate'}</h3>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-end items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No:</span>
                     <input 
                       className="bg-transparent border-b border-gray-200 text-sm font-bold text-navy outline-none text-right w-32 focus:border-teal"
                       value={estimateNumber}
                       onChange={(e) => setEstimateNumber(e.target.value)}
                     />
                   </div>
                   <div className="flex justify-end items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date:</span>
                     <input 
                       type="date"
                       className="bg-transparent border-b border-gray-200 text-sm font-bold text-navy outline-none text-right w-32 focus:border-teal"
                       value={invoiceDate}
                       onChange={(e) => setInvoiceDate(e.target.value)}
                     />
                   </div>
                </div>
              </div>
            </div>

            {/* Customer Area */}
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-50">
               <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 bg-teal rounded-full" /> Bill To
                 </h4>
                 <div className="space-y-4">
                   <input 
                     placeholder="Customer Full Name"
                     className="w-full text-xl font-black text-navy placeholder:text-gray-200 outline-none focus:border-b-2 focus:border-teal pb-2 transition-all"
                     value={customerName || ""}
                     onChange={(e) => setCustomerName(e.target.value)}
                   />
                   <div className="flex flex-col md:flex-row gap-4 border-b border-gray-50 mb-2">
                      <input 
                        placeholder="WhatsApp/Phone (+91...)"
                        className="flex-1 text-sm font-bold text-gray-500 placeholder:text-gray-200 outline-none pb-2"
                        value={customerPhone || ""}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      <input 
                        placeholder="GSTIN (Optional)"
                        className="w-full md:w-56 text-sm font-black text-teal placeholder:text-gray-200 outline-none pb-2 md:text-right"
                        value={customerGSTIN || ""}
                        onChange={(e) => setCustomerGSTIN(e.target.value)}
                      />
                   </div>
                   <textarea 
                     placeholder="Full Site Address"
                     rows={2}
                     className="w-full text-xs font-medium text-gray-400 placeholder:text-gray-200 outline-none resize-none"
                     value={customerAddress || ""}
                     onChange={(e) => setCustomerAddress(e.target.value)}
                   />
                 </div>
               </div>
               <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                  <h5 className="text-[9px] font-black text-navy uppercase tracking-widest mb-4">Quick Link User</h5>
                  <select 
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 font-bold text-xs"
                    value={selectedUserId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setSelectedUserId(uid);
                      const user = allUsers.find(u => u.uid === uid);
                      if (user) {
                        setCustomerName(user.name);
                        setCustomerAddress(user.address || '');
                        setCustomerPhone(user.whatsappNumber || user.phone || '');
                      }
                    }}
                  >
                    <option value="">Select Existing Customer</option>
                    {allUsers.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
                  </select>
               </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="flex-1 p-0">
               <div className="w-full">
                  <div className="bg-navy text-white text-[10px] font-black uppercase tracking-widest flex items-center py-4 px-12">
                    <div className="w-12 text-center text-[8px] opacity-70">S.No</div>
                    <div className="flex-1 px-4">PARTICULARS (Service Name & Details)</div>
                    <div className="w-20 text-center">HSN</div>
                    <div className="w-20 text-center">QTY</div>
                    <div className="w-28 text-center">UNIT (UOM)</div>
                    <div className="w-28 text-center">RATE (₹)</div>
                    <div className="w-28 text-right">AMOUNT (₹)</div>
                    <div className="w-12"></div>
                  </div>
                  
                  <div className="divide-y divide-gray-50">
                    {/* Render Sections */}
                    {['Labor', 'Material', 'General'].map(sectionType => {
                      const sectionItems = items.filter(i => (sectionType === 'General' ? (!i.type || i.type === 'General') : i.type === sectionType));
                      if (sectionItems.length === 0 && sectionType !== 'Labor') return null;

                      return (
                        <div key={sectionType} className="bg-white">
                          <div className={cn(
                            "px-12 py-3 flex items-center justify-between",
                            sectionType === 'Labor' ? "bg-teal/5" : sectionType === 'Material' ? "bg-amber-50/30" : "bg-gray-50/30"
                          )}>
                             <h4 className="text-[10px] font-black text-navy uppercase tracking-widest flex items-center gap-2">
                               {sectionType === 'Labor' ? (
                                 <Calculator size={14} className="text-teal" />
                               ) : sectionType === 'Material' ? (
                                 <Plus size={14} className="text-amber-500" />
                               ) : (
                                 <FileText size={14} className="text-gray-400" />
                               )}
                               {sectionType} Charges
                             </h4>
                             <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => addNewRow(sectionType as any)}
                                 className="text-[9px] font-black text-teal uppercase hover:underline"
                               >+ Add {sectionType} Item</button>
                               {sectionItems.length > 0 && (
                                 <button 
                                   onClick={() => {
                                     if(window.confirm(`Remove all ${sectionType} items?`)) {
                                       setItems(items.filter(i => (sectionType === 'General' ? (i.type && i.type !== 'General') : i.type !== sectionType)));
                                     }
                                   }}
                                   className="text-[9px] font-black text-red-400 uppercase hover:underline ml-4"
                                 >Remove Section</button>
                               )}
                             </div>
                          </div>
                          
                          {sectionItems.map((item, index) => (
                            <div key={item.id} className="flex items-start py-6 px-12 group hover:bg-gray-50/50 transition-colors">
                              <div className="w-12 pt-2 text-center font-black text-navy text-sm">{index + 1}</div>
                              <div className="flex-1 px-4 space-y-2">
                                <input 
                                  className="w-full bg-transparent font-black text-base text-navy outline-none placeholder:text-gray-200"
                                  placeholder={sectionType === 'Labor' ? "Labor Name (e.g. Plan Drawing)" : "Item Name"}
                                  value={item.name || ""}
                                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                />
                                <textarea 
                                  className="w-full bg-gray-50/50 border border-transparent focus:border-teal/30 focus:bg-white rounded-xl p-3 font-medium text-xs text-gray-500 outline-none transition-all placeholder:text-gray-200 resize-none"
                                  placeholder="Describe details..."
                                  rows={2}
                                  value={item.description || ""}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                />
                              </div>
                              <div className="w-20 pt-1 text-center">
                                <input 
                                  className="w-16 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                  placeholder="HSN"
                                  value={item.hsn || ''}
                                  onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                                />
                                <p className="text-[9px] font-black text-gray-300 mt-1 uppercase">HSN</p>
                              </div>
                              <div className="w-20 pt-1 text-center">
                                <input 
                                  type="number"
                                  className="w-16 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                  value={(!item.quantity || isNaN(item.quantity)) ? '' : item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <p className="text-[9px] font-black text-gray-300 mt-1 uppercase">QTY</p>
                              </div>
                              <div className="w-28 pt-1 text-center px-1">
                                <select
                                  className="w-full bg-white border border-gray-100 rounded-lg py-2 px-1 text-center font-bold text-xs outline-none focus:ring-2 focus:ring-teal/20"
                                  value={commonUnits.includes(item.unit || '') ? (item.unit || 'Unit') : 'Custom'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Custom') {
                                      updateItem(item.id, 'unit', '');
                                    } else {
                                      updateItem(item.id, 'unit', val);
                                    }
                                  }}
                                >
                                  {commonUnits.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                  <option value="Custom">Custom...</option>
                                </select>
                                {(!commonUnits.includes(item.unit || '') || item.unit === '') && (
                                  <input 
                                    className="mt-1 w-full bg-white border border-gray-100 rounded-lg py-1 px-2 text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-teal/20"
                                    placeholder="Specify Unit"
                                    value={item.unit || ''}
                                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                  />
                                )}
                              </div>
                              <div className="w-28 pt-1 text-center">
                                <input 
                                  type="number"
                                  className="w-24 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                  value={(!item.rate || isNaN(item.rate)) ? '' : item.rate}
                                  onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <p className="text-[9px] font-black text-gray-300 mt-1 uppercase">Per {item.unit || 'Unit'}</p>
                              </div>
                              <div className="w-28 pt-3 text-right font-black text-navy text-base">
                                ₹{(item.rate * item.quantity).toLocaleString('en-IN')}
                              </div>
                              <div className="w-12 pt-3 flex justify-end">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* Table Footer Controls */}
                  <div className="p-12 border-t border-gray-50 flex flex-col md:flex-row justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4">
                            <button 
                              onClick={() => addNewRow('Labor')}
                              className="flex items-center gap-2 bg-navy text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-navy/20"
                            >
                              <Plus size={16} className="text-teal" /> + Labor Section
                            </button>
                            <button 
                              onClick={() => addNewRow('Material')}
                              className="flex items-center gap-2 bg-amber-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-amber-500/20"
                            >
                              <Plus size={16} /> + Material Section
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm('Clear all items?')) setItems([{ id: '1', name: '', description: '', hsn: '', rate: 0, quantity: 1, unit: 'Unit', type: 'Labor' }]);
                              }}
                              className="flex items-center gap-2 text-red-400 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:text-red-600"
                            >
                              <Trash2 size={16} /> Clear All
                            </button>
                        </div>
                        
                        <div className="mt-8 space-y-4">
                           <div className="flex items-center justify-between">
                             <p className="text-[10px] font-black text-navy uppercase tracking-widest flex items-center gap-2">
                               <Search size={14} className="text-teal" /> Quick Select Library
                             </p>
                             <div className="flex bg-gray-100 p-1 rounded-lg">
                               <button 
                                 onClick={() => setPricingType('labour')}
                                 className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${pricingType === 'labour' ? 'bg-white text-navy shadow-sm' : 'text-gray-400'}`}
                               >Labour</button>
                               <button 
                                 onClick={() => setPricingType('material')}
                                 className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${pricingType === 'material' ? 'bg-white text-navy shadow-sm' : 'text-gray-400'}`}
                               >Material</button>
                             </div>
                           </div>
                           <div className="flex gap-2">
                              <select 
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-[10px] w-48"
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                              >
                                <option value="">Select Category</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <select 
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-[10px] w-48"
                                disabled={!selectedServiceId}
                                value={selectedSubId}
                                onChange={(e) => setSelectedSubId(e.target.value)}
                              >
                                <option value="">Select Sub</option>
                                {selectedService?.subCategories?.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                              </select>
                              <Button onClick={addRecommendedItem} className="h-10 w-10 bg-teal text-navy rounded-xl">
                                <Plus size={18} />
                              </Button>
                           </div>
                        </div>
                     </div>
                     <div className="w-80 space-y-4">
                        <div className="flex justify-between items-center px-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount (-)</span>
                           <input 
                              type="number"
                              className="w-24 bg-teal/5 border border-teal/10 rounded-lg py-1 px-2 text-right font-bold text-teal outline-none focus:ring-2 focus:ring-teal/20"
                              value={(!discount || isNaN(discount)) ? '' : discount}
                              onChange={(e) => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                              onFocus={(e) => e.target.select()}
                           />
                        </div>
                        <div className="flex justify-between items-center px-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adjustment (+/-)</span>
                           <input 
                              type="number"
                              className="w-24 bg-gray-100 border border-gray-200 rounded-lg py-1 px-2 text-right font-bold text-navy outline-none focus:ring-2 focus:ring-navy/10"
                              value={(!roundOff || isNaN(roundOff)) ? '' : roundOff}
                              onChange={(e) => setRoundOff(e.target.value === '' ? 0 : Number(e.target.value))}
                              onFocus={(e) => e.target.select()}
                           />
                        </div>
                        {isInvoice && (
                          <>
                            <div className="flex justify-between items-center px-4 pt-2 border-t border-gray-50">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apply GST</span>
                               <select 
                                  className="bg-navy text-white text-[10px] font-black px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                                  value={gstPercentage}
                                  onChange={(e) => setGstPercentage(Number(e.target.value))}
                               >
                                  <option value="0">0% (Exempt)</option>
                                  <option value="5">5% GST</option>
                                  <option value="12">12% GST</option>
                                  <option value="18">18% GST</option>
                                  <option value="28">28% GST</option>
                               </select>
                            </div>
                            {gstPercentage > 0 && (
                               <div className="flex justify-between items-center px-4">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Amount</span>
                                  <span className="font-bold text-navy">₹{gstAmount.toLocaleString('en-IN')}</span>
                               </div>
                            )}
                          </>
                        )}
                        <div className="bg-navy p-6 rounded-3xl flex justify-between items-center shadow-xl shadow-navy/10 mt-6 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-teal" />
                           <span className="text-2xl font-black text-white relative z-10 ml-auto">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                     </div>
                  </div>
               </div>

            {/* Footer Terms & Bank */}
            <div className="p-12 bg-gray-50/30 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <h6 className="text-[10px] font-black text-navy uppercase tracking-widest">Bank Details & Billing Policy</h6>
                  <textarea 
                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 outline-none focus:border-teal resize-none"
                    rows={4}
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                  />
               </div>
               {!isInvoice ? (
                 <div className="space-y-4">
                    <h6 className="text-[10px] font-black text-navy uppercase tracking-widest">Notes / Terms</h6>
                    <textarea 
                      className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 outline-none focus:border-teal resize-none"
                      rows={4}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                    />
                 </div>
               ) : (
                 <div className="space-y-4">
                    <h6 className="text-[10px] font-black text-navy uppercase tracking-widest">Declaration</h6>
                    <textarea 
                      className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 outline-none focus:border-teal resize-none"
                      rows={4}
                      value={declaration}
                      onChange={(e) => setDeclaration(e.target.value)}
                    />
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Global Save/Send Actions Sticky */}
        <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex flex-wrap justify-center gap-4">
           <Button 
             onClick={handleDownload}
             className="bg-navy hover:bg-navy/90 text-white px-12 h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl"
           >
             <FileText size={20} className="text-teal" /> Preview & Save PDF
           </Button>
           <Button 
             onClick={handleWhatsAppShare}
             className="bg-[#25D366] hover:bg-[#25D366]/90 text-white px-12 h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl"
           >
             <MessageCircle size={20} /> Send to Customer (WhatsApp)
           </Button>
           <Button 
             onClick={saveToDatabase}
             variant="outline"
             className="border-2 border-gray-100 hover:border-navy px-8 h-16 rounded-2xl font-black text-xs uppercase tracking-widest"
           >
             Save Draft
           </Button>
        </div>
      </div>
    );
  }

  // Initial Landing State before Editor opens
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 relative">
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 flex items-center gap-2 text-navy/40 hover:text-navy font-black text-[10px] uppercase tracking-widest transition-all"
      >
        <ArrowLeft size={16} /> Back to previous
      </button>
      <div className="bg-teal/10 w-24 h-24 rounded-full flex items-center justify-center mb-8">
        <FileText size={40} className="text-teal" />
      </div>
      <h2 className="text-3xl font-black text-navy uppercase tracking-tight mb-4">Professional Billing System</h2>
      <p className="text-gray-400 font-medium mb-12 text-center max-w-md"> Create secure, company-branded estimates and invoices in seconds with our professional builder.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <Button 
          onClick={() => {
            setIsInvoice(false);
            setEstimateNumber(`EST-${Date.now().toString().slice(-6)}`);
            setShowEditor(true);
          }}
          className="bg-navy text-white h-20 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Create New Estimate
        </Button>
        <Button 
          onClick={() => {
            setIsInvoice(true);
            setEstimateNumber(`INV-${Date.now().toString().slice(-6)}`);
            setShowEditor(true);
          }}
          className="bg-teal text-navy h-20 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Generate Tax Invoice
        </Button>
      </div>

      <div className="mt-12">
        <Button 
          variant="link"
          onClick={() => navigate('/admin/invoices')}
          className="text-navy/40 hover:text-navy font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          <FileText size={16} /> Open Invoice Archive
        </Button>
      </div>
    </div>
  );
}
