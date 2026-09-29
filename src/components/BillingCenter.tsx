import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
import QRCode from 'qrcode';
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
  ArrowLeft,
  QrCode,
  Copy
} from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, formatWhatsAppLink } from '../lib/utils';
import Logo from './Logo';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Service, SubCategory, UserProfile, BillingItem, Invoice, AppSettings, Booking } from '../types';
import { toast } from 'sonner';
import { dataService } from '../services/firebaseService';
import { autoDetectStateCode } from '../utils/stateCodeHelper';
import { getFinancialYearString, getDefaultSerialNumber, getNextSerialNumberForInvoices } from '../utils/serialNumberHelper';

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
  const [customerState, setCustomerState] = useState('');
  
  const [buyerOrder, setBuyerOrder] = useState('');
  const [delivDate, setDelivDate] = useState('');
  const [stateSupply, setStateSupply] = useState('');
  const [transport, setTransport] = useState('');
  const [payMode, setPayMode] = useState('UPI');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [savedInvoicesList, setSavedInvoicesList] = useState<any[]>([]);
  const [items, setItems] = useState<BillingItem[]>([
    { id: '1', name: '', description: '', hsn: '', rate: 0, quantity: 1, unit: 'Unit', type: 'Labor' }
  ]);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [estimateNumber, setEstimateNumber] = useState(() => getDefaultSerialNumber('Estimate'));
  const [upiId, setUpiId] = useState('mustakansari9582-3@okhdfcbank');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentType, setDocumentType] = useState<'Estimate' | 'Tax Invoice'>('Estimate');
  const [copyType, setCopyType] = useState<'Original Copy' | 'Duplicate Copy' | 'Triplicate Copy'>('Original Copy');
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const isInvoice = documentType === 'Tax Invoice' || documentType === 'Simple Invoice';
  const isTaxInvoice = documentType === 'Tax Invoice';
  const isSimpleInvoice = documentType === 'Simple Invoice';
  const isEstimate = documentType === 'Estimate';
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ownerGSTIN, setOwnerGSTIN] = useState('');
  const [includeQR, setIncludeQR] = useState(true);
  
  // Editable Company Branding State
  const [companyName, setCompanyName] = useState('ATOMIC SOLUTIONS');
  const [companyTagline, setCompanyTagline] = useState('We Bring Comfort Life');
  const [founderName, setFounderName] = useState('Mustak Ansari');
  const [companyPin, setCompanyPin] = useState('814149');
  const [companyBranch, setCompanyBranch] = useState('Deoghar, Jharkhand - 814149');
  const [companyPhone, setCompanyPhone] = useState('+91 95822 68658');
  const [companyEmail, setCompanyEmail] = useState('atomichvacsolution@gmail.com');
  const [companyAddress, setCompanyAddress] = useState('96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149');
  const [msmeNumber, setMsmeNumber] = useState('');
  const [gstType, setGstType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');
  
  // Shipping details state
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingGSTIN, setShippingGSTIN] = useState('');
  const [shippingState, setShippingState] = useState('');
  
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
      
      setDocumentType('Tax Invoice');
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
        if ((s as any).upiId) setUpiId((s as any).upiId);
      }
    });

    if (!propServices) {
      dataService.getCollection('services').then(data => {
        setInternalServices(data as Service[]);
      });
    }

    // Auto-detect next serial number for this financial year (starting from 01)
    dataService.getCollection('invoices').then((allInvoices: any[]) => {
      if (allInvoices && Array.isArray(allInvoices)) {
        setSavedInvoicesList(allInvoices);
        const nextSerial = getNextSerialNumberForInvoices(documentType, allInvoices);
        setEstimateNumber(nextSerial);
      }
    }).catch(() => {});
  }, [propServices, documentType]);

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
      ? (selectedSub.labourMin || selectedSub.labourMax || (!selectedSub.materialMin && !selectedSub.materialMax ? selectedSub.minPrice : 0) || 0)
      : (selectedSub.materialMin || selectedSub.materialMax || (!selectedSub.labourMin && !selectedSub.labourMax ? selectedSub.minPrice : 0) || 0);

    const newItem: BillingItem = {
      id: Date.now().toString(),
      name: selectedSub.name,
      description: `${selectedService?.name} (${pricingType === 'labour' ? 'Labour Charges' : 'With Material'})`,
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

  const getAutoHsnCode = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // Service & Labour (Prioritize verbs)
    if (lowerName.includes('install') || lowerName.includes('uninstall') || lowerName.includes('dismantle') || lowerName.includes('un-install')) return '995461';
    if (lowerName.includes('repair') || lowerName.includes('service') || lowerName.includes('maintenance') || lowerName.includes('check') || lowerName.includes('visit') || lowerName.includes('shift')) return '998719';
    if (lowerName.includes('labour') || lowerName.includes('labor') || lowerName.includes('charge') || lowerName.includes('fee')) return '9987';
    
    // Parts & Materials
    if (lowerName.includes('copper') || lowerName.includes('pipe') || lowerName.includes('tube')) return '7411';
    if (lowerName.includes('gas') || lowerName.includes('refrigerant') || lowerName.includes('r32') || lowerName.includes('r22') || lowerName.includes('r410') || lowerName.includes('freon')) return '3824';
    if (lowerName.includes('wire') || lowerName.includes('cable')) return '8544';
    if (lowerName.includes('pcb') || lowerName.includes('board') || lowerName.includes('circuit')) return '8537';
    if (lowerName.includes('compressor')) return '8414';
    if (lowerName.includes('part') || lowerName.includes('motor') || lowerName.includes('condenser') || lowerName.includes('fan') || lowerName.includes('capacitor') || lowerName.includes('sensor') || lowerName.includes('remote')) return '84159000';
    
    // Base Machine
    if (lowerName.includes('ac') || lowerName.includes('air conditioner') || lowerName.includes('split') || lowerName.includes('window') || lowerName.includes('machine') || lowerName.includes('cassette')) return '841510';
    
    return '';
  };

  const handleDetectHsn = async (itemId: string, itemName: string, itemType?: string) => {
    if (!itemName || !itemName.trim()) {
      toast.error('Please enter item name first');
      return;
    }
    toast.info('Searching GST Portal & Google AI for official HSN/SAC code...');
    let detectedCode = '';
    try {
      const res = await fetch('/api/detect-hsn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: itemName, itemType: itemType || 'Labor' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code) detectedCode = data.code;
      }
    } catch (e) {
      console.warn('GST search error:', e);
    }

    try {
      const aiRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `What is the exact official 6-digit SAC code (starts with 99) or HSN code for Indian GST for: "${itemName}" (${itemType || 'Service'})? Return ONLY the 6-digit code number without any other text.` }
          ]
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = aiData.reply || aiData.text || '';
        const match = text.match(/\b(99\d{4}|84\d{4}|85\d{4}|74\d{4}|38\d{4}|39\d{4}|25\d{4}|69\d{4}|72\d{4}|\d{6}|\d{4})\b/);
        if (match) {
          if (!detectedCode || (itemType === 'Labor' && match[1].startsWith('99'))) {
            detectedCode = match[1];
          }
        }
      }
    } catch (e) {
      console.warn('AI HSN lookup error:', e);
    }

    if (!detectedCode) {
      detectedCode = getAutoHsnCode(itemName);
    }

    if (detectedCode) {
      updateItem(itemId, 'hsn', detectedCode);
      toast.success(`Detected SAC/HSN Code: ${detectedCode}`);
    } else {
      toast.error('Could not detect HSN code. Please enter manually.');
    }
  };

  const updateItem = (id: string, field: keyof BillingItem, value: string | number) => {
    let finalValue = value;
    if (field === 'rate' || field === 'quantity') {
      finalValue = value === '' ? 0 : Number(value);
    }
    
    setItems(items.map(i => {
      if (i.id === id) {
        const newItem = { ...i, [field]: finalValue };
        
        // Auto-detect HSN when name changes
        if (field === 'name' && typeof value === 'string') {
          const suggestedHsn = getAutoHsnCode(value);
          const oldSuggestedHsn = getAutoHsnCode(i.name);
          
          if (suggestedHsn && (!i.hsn || i.hsn === oldSuggestedHsn)) {
            newItem.hsn = suggestedHsn;
          }
        }
        
        return newItem;
      }
      return i;
    }));
  };

  const subTotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const discountedTotal = subTotal - discount;
  const gstAmount = (discountedTotal * gstPercentage) / 100;
  const total = discountedTotal + gstAmount + freight + roundOff;

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
        estimateNumber: estimateNumber || getDefaultSerialNumber(documentType),
        type: documentType,
        date: invoiceDate,
        items: items.filter(item => item.name.trim() !== ''),
        subTotal,
        discount,
        freightCharges: freight,
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

  const generatePDF = async () => {
    const logoUrl = settings?.logoUrl || window.location.origin + '/logo.png';
    const pdfData: PDFInvoiceData = {
      type: documentType,
      number: estimateNumber || getDefaultSerialNumber(documentType),
      date: invoiceDate,
      originalDup: copyType,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      customerGSTIN: customerGSTIN,
      customerState: customerState,
      shippingName: !shippingSameAsBilling ? shippingName : undefined,
      shippingPhone: !shippingSameAsBilling ? shippingPhone : undefined,
      shippingAddress: !shippingSameAsBilling ? shippingAddress : undefined,
      shippingGSTIN: !shippingSameAsBilling ? shippingGSTIN : undefined,
      shippingState: !shippingSameAsBilling ? shippingState : undefined,
      companyName: companyName,
      companyPhone: companyPhone,
      companyAddress: companyAddress,
      companyEmail: companyEmail,
      ownerGSTIN: ownerGSTIN,
      msmeNumber: msmeNumber,
      payMode: payMode || undefined,
      buyerOrder: buyerOrder || undefined,
      delivDate: delivDate || undefined,
      transport: transport || undefined,
      stateSupply: stateSupply ? autoDetectStateCode(stateSupply) : undefined,
      items: items.filter(i => i.name.trim() !== '').map(i => {
        const taxable = i.rate * i.quantity;
        const itemGstAmt = (taxable * gstPercentage) / 100;
        return {
          name: i.name,
          description: i.description,
          hsn: i.hsn,
          uom: i.unit,
          quantity: i.quantity,
          rate: i.rate,
          taxable: taxable,
          gstPercent: gstPercentage > 0 ? gstPercentage : undefined,
          gstAmount: itemGstAmt > 0 ? itemGstAmt : undefined,
          amount: taxable + itemGstAmt
        };
      }),
      summary: {
        taxableAmount: discountedTotal,
        cgstAmount: gstType === 'cgst_sgst' ? gstAmount / 2 : 0,
        sgstAmount: gstType === 'cgst_sgst' ? gstAmount / 2 : 0,
        igstAmount: gstType === 'igst' ? gstAmount : 0,
        freightCharges: freight,
        discountAmount: discount,
        roundOff: roundOff
      },
      totalAmount: total,
      bankDetails: bankDetails,
      terms: terms,
      declaration: declaration,
      logoUrl: logoUrl,
      upiId: upiId
    };
    return await generateInvoicePDF(pdfData, { includeQR });
  };

  const handleDownload = async () => {
    try {
      toast.info('Generating PDF...');
      const doc = await generatePDF();
      const cleanFileName = `${isInvoice ? 'Invoice' : 'Proforma Invoice'}_${estimateNumber}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      toast.success('PDF Downloaded Successfully');
      
      // Attempt to save to database in background
      try {
        await saveToDatabase();
      } catch (dbErr) {
        console.warn('Database record save skipped or offline:', dbErr);
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to generate PDF. Please check item details.');
    }
  };

  const handleWhatsAppShare = async () => {
    const docType = documentType;
    
    try {
      let savedId = estimateNumber;
      try {
        const savedDoc = await saveToDatabase();
        if (savedDoc?.id) savedId = savedDoc.id;
      } catch (dbErr) {
        console.warn('Database save warning:', dbErr);
      }
      const shareUrl = `${window.location.origin}/invoice/${savedId}`;
      
      const message = `Hi ${customerName || 'Valued Customer'},\n\nHope you're doing well! Your ${docType} (#${estimateNumber}) from *ATOMIC SOLUTIONS* is ready.\n\n*Grand Total: ₹ ${total.toLocaleString('en-IN')}*\n\n*View/Download here:* ${shareUrl}\n\nPlease find the details above. We bring comfort to your life!\n\nFounder: Mustak Ansari (PIN: 814149)\nAdmin: +91 95822 68658`;
      
      const targetPhone = (customerPhone || whatsapp);
      window.open(formatWhatsAppLink(targetPhone, message), '_blank');
    } catch (err) {
      toast.error('Failed to generate WhatsApp share link');
    }
  };

  if (showEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-sans">
        {/* Editor Toolbar */}
        <div className="bg-navy p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center text-white border-b border-white/10 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all shrink-0 cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <Logo />
              <div className="hidden sm:block h-6 w-px bg-white/20 mx-1" />
              <h1 className="font-black text-[11px] sm:text-xs uppercase tracking-widest text-teal truncate">Live Invoice Builder</h1>
            </div>
            <button 
              type="button"
              onClick={() => setShowEditor(false)} 
              className="md:hidden bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4">
             <div className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-xl w-full md:w-auto">
               <button 
                 type="button"
                 onClick={() => {
                   setDocumentType('Estimate');
                   setEstimateNumber(getNextSerialNumberForInvoices('Estimate', savedInvoicesList));
                 }}
                 className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all text-center cursor-pointer ${
                   documentType === 'Estimate' ? 'bg-teal text-navy shadow-md font-black' : 'text-white/60 hover:text-white'
                 }`}
               >
                 Proforma Invoice
               </button>
               <button 
                 type="button"
                 onClick={() => {
                   setDocumentType('Tax Invoice');
                   setEstimateNumber(getNextSerialNumberForInvoices('Tax Invoice', savedInvoicesList));
                 }}
                 className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all text-center cursor-pointer ${
                   documentType === 'Tax Invoice' ? 'bg-teal text-navy shadow-md font-black' : 'text-white/60 hover:text-white'
                 }`}
               >
                 Tax Invoice
               </button>
             </div>
             <button 
               type="button"
               onClick={() => setShowEditor(false)} 
               className="hidden md:block bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
             >
               Close Editor
             </button>
          </div>
        </div>

        {/* Editor Main Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12">
          <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-[40px] overflow-hidden min-h-screen flex flex-col border border-gray-100 mb-12">
            {/* Branding Header Area */}
            <div className="bg-gray-50/50 p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-3 flex-1">
                <input 
                  className="text-2xl md:text-3xl font-black text-navy tracking-tight bg-transparent border-b border-transparent hover:border-gray-300 focus:border-teal outline-none w-full transition-all"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-teal italic">"</span>
                  <input 
                    className="text-xs font-bold text-teal italic bg-transparent border-b border-transparent hover:border-gray-300 focus:border-teal outline-none w-full transition-all"
                    value={companyTagline}
                    onChange={(e) => setCompanyTagline(e.target.value)}
                    placeholder="Tagline"
                  />
                  <span className="text-xs font-bold text-teal italic">"</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-navy uppercase tracking-widest shrink-0">Founder:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold text-navy outline-none focus:border-teal"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      placeholder="Founder Name"
                    />
                    <span className="text-[10px] font-black text-navy uppercase tracking-widest shrink-0">| PIN:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold text-navy outline-none focus:border-teal w-24"
                      value={companyPin}
                      onChange={(e) => setCompanyPin(e.target.value)}
                      placeholder="PIN Code"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">Branch:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-medium text-gray-700 outline-none focus:border-teal flex-1"
                      value={companyBranch}
                      onChange={(e) => setCompanyBranch(e.target.value)}
                      placeholder="Branch Info"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">Mob:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-medium text-gray-700 outline-none focus:border-teal w-36"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="Phone"
                    />
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">| Email:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-medium text-gray-700 outline-none focus:border-teal flex-1"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">Address:</span>
                    <input 
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-medium text-gray-700 outline-none focus:border-teal flex-1"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Company Address"
                    />
                  </div>
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">My GSTIN:</span>
                      <input 
                        className="bg-teal/5 border border-teal/10 rounded px-2 py-0.5 text-[9px] font-bold text-teal outline-none w-36"
                        placeholder="Your GSTIN"
                        value={ownerGSTIN}
                        onChange={(e) => updateOwnerGSTIN(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">MSME/Udyam:</span>
                      <input 
                        className="bg-teal/5 border border-teal/10 rounded px-2 py-0.5 text-[9px] font-bold text-teal outline-none w-36"
                        placeholder="MSME/Udyam Reg No."
                        value={msmeNumber}
                        onChange={(e) => setMsmeNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="inline-block bg-navy px-6 py-2 rounded-xl">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">{isInvoice ? 'Tax Invoice' : 'Proforma Invoice'}</h3>
                </div>

                {/* Copy Type Selection (Original / Duplicate / Triplicate) */}
                <div className="flex flex-col items-end gap-1.5 pt-1">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Copy Type (प्रति प्रकार):
                  </span>
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1 border border-gray-200">
                    {(['Original Copy', 'Duplicate Copy', 'Triplicate Copy'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCopyType(type)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                          copyType === type 
                            ? "bg-navy text-white shadow-sm font-black" 
                            : "text-gray-500 hover:text-navy hover:bg-white"
                        )}
                      >
                        {copyType === type && <CheckCircle2 size={10} className="text-teal" />}
                        {type === 'Original Copy' ? 'Original' : type === 'Duplicate Copy' ? 'Duplicate' : 'Triplicate'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-end items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No:</span>
                     <input 
                       className="bg-transparent border-b border-gray-200 text-sm font-bold text-navy outline-none text-right w-36 focus:border-teal"
                       value={estimateNumber}
                       onChange={(e) => setEstimateNumber(e.target.value)}
                     />
                   </div>
                   <div className="flex justify-end items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date:</span>
                     <input 
                       type="date"
                       className="bg-transparent border-b border-gray-200 text-sm font-bold text-navy outline-none text-right w-36 focus:border-teal"
                       value={invoiceDate}
                       onChange={(e) => setInvoiceDate(e.target.value)}
                     />
                   </div>
                </div>
              </div>
            </div>

            {/* Customer Area */}
            <div className="p-4 sm:p-6 md:p-12 border-b border-gray-50">
               {/* Quick Link User */}
               <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                  <h5 className="text-[9px] font-black text-navy uppercase tracking-widest shrink-0">Quick Link User</h5>
                  <select 
                    className="w-full md:w-1/2 bg-white border border-gray-200 rounded-2xl px-4 py-3 font-bold text-xs outline-none focus:border-teal"
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

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 {/* Bill To */}
                 <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <span className="w-2 h-2 bg-teal rounded-full" /> Bill To
                   </h4>
                   <div className="space-y-4">
                     <input 
                       placeholder="Customer Full Name"
                       className="w-full text-xl font-black text-navy placeholder:text-gray-400 outline-none focus:border-b-2 focus:border-teal pb-2 transition-all"
                       value={customerName || ""}
                       onChange={(e) => setCustomerName(e.target.value)}
                     />
                     <div className="flex flex-col md:flex-row gap-4 border-b border-gray-50 mb-2">
                        <input 
                          placeholder="WhatsApp/Phone (+91...)"
                          className="flex-1 text-sm font-bold text-gray-700 placeholder:text-gray-400 outline-none pb-2"
                          value={customerPhone || ""}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                     </div>
                     <textarea 
                       placeholder="Full Site Address"
                       rows={2}
                       className="w-full text-xs font-medium text-gray-600 placeholder:text-gray-400 outline-none resize-none"
                       value={customerAddress || ""}
                       onChange={(e) => setCustomerAddress(e.target.value)}
                     />
                     <input 
                       placeholder="State (e.g. Jharkhand - 20)"
                       className="w-full text-sm font-bold text-gray-700 placeholder:text-gray-400 outline-none pb-2 border-b border-gray-50 focus:border-teal transition-all"
                       value={customerState || ""}
                       onChange={(e) => setCustomerState(e.target.value)}
                       onBlur={() => { if (customerState) setCustomerState(autoDetectStateCode(customerState)); }}
                     />
                     <input 
                       placeholder="GSTIN (Optional)"
                       className="w-full text-sm font-black text-teal placeholder:text-gray-400 outline-none pb-2 border-b border-gray-50 focus:border-teal transition-all"
                       value={customerGSTIN || ""}
                       onChange={(e) => setCustomerGSTIN(e.target.value)}
                     />
                   </div>
                 </div>

                 {/* Ship To */}
                 <div className="space-y-6">
                     <div className="flex items-center justify-between mb-4">
                       <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
                         <span className="w-2 h-2 bg-navy rounded-full" /> Ship To
                       </h4>
                       <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="accent-teal w-4 h-4"
                           checked={shippingSameAsBilling}
                           onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                         />
                         Same as Bill To
                       </label>
                     </div>
                     
                     {!shippingSameAsBilling ? (
                       <div className="space-y-4 animate-in fade-in duration-300">
                         <input 
                           placeholder="Shipping Full Name"
                           className="w-full text-xl font-black text-navy placeholder:text-gray-400 outline-none focus:border-b-2 focus:border-navy pb-2 transition-all"
                           value={shippingName || ""}
                           onChange={(e) => setShippingName(e.target.value)}
                         />
                         <div className="flex flex-col md:flex-row gap-4 border-b border-gray-50 mb-2">
                            <input 
                              placeholder="Phone Number"
                              className="flex-1 text-sm font-bold text-gray-700 placeholder:text-gray-400 outline-none pb-2"
                              value={shippingPhone || ""}
                              onChange={(e) => setShippingPhone(e.target.value)}
                            />
                         </div>
                         <textarea 
                           placeholder="Shipping Address"
                           rows={2}
                           className="w-full text-xs font-medium text-gray-600 placeholder:text-gray-400 outline-none resize-none"
                           value={shippingAddress || ""}
                           onChange={(e) => setShippingAddress(e.target.value)}
                         />
                         <input 
                           placeholder="State (e.g. Jharkhand - 20)"
                           className="w-full text-sm font-bold text-gray-700 placeholder:text-gray-400 outline-none pb-2 border-b border-gray-50 focus:border-navy transition-all"
                           value={shippingState || ""}
                           onChange={(e) => setShippingState(e.target.value)}
                         />
                         <input 
                           placeholder="GSTIN (Optional)"
                           className="w-full text-sm font-black text-navy placeholder:text-gray-400 outline-none pb-2 border-b border-gray-50 focus:border-navy transition-all"
                           value={shippingGSTIN || ""}
                           onChange={(e) => setShippingGSTIN(e.target.value)}
                         />
                       </div>
                     ) : (
                       <div className="h-full flex items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold text-xs p-6 text-center">
                         Shipping details will be the same as billing details. Uncheck the box above to specify a different shipping address.
                       </div>
                     )}
                   </div>
               </div>
            </div>

            {/* Order Details (Optional) */}
            <div className="p-4 sm:p-6 md:p-12 border-b border-gray-50 bg-gray-50/10">
               <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-indigo-400 rounded-full" /> Additional Details (Optional)
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pay Mode</label>
                   <select 
                     className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm font-bold text-navy outline-none focus:border-teal"
                     value={payMode}
                     onChange={(e) => setPayMode(e.target.value)}
                   >
                     <option value="">None (Don't show)</option>
                     <option value="UPI">UPI</option>
                     <option value="Cash">Cash</option>
                     <option value="Bank Transfer">Bank Transfer</option>
                     <option value="Card">Card</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Buyer Order No.</label>
                   <input 
                     placeholder="e.g. PO-1234"
                     className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm font-bold text-navy outline-none focus:border-teal placeholder:text-gray-400"
                     value={buyerOrder}
                     onChange={(e) => setBuyerOrder(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Transport</label>
                   <input 
                     placeholder="e.g. By Road"
                     className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm font-bold text-navy outline-none focus:border-teal placeholder:text-gray-400"
                     value={transport}
                     onChange={(e) => setTransport(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Delivery Date</label>
                   <input 
                     type="date"
                     className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm font-bold text-navy outline-none focus:border-teal text-gray-500"
                     value={delivDate}
                     onChange={(e) => setDelivDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Place of Supply</label>
                    <input 
                      placeholder="e.g. Jharkhand - 20"
                      className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm font-bold text-navy outline-none focus:border-teal placeholder:text-gray-400"
                      value={stateSupply}
                      onChange={(e) => setStateSupply(e.target.value)}
                      onBlur={() => { if (stateSupply) setStateSupply(autoDetectStateCode(stateSupply)); }}
                   />
                 </div>
               </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="flex-1 p-0">
               <div className="w-full">
                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <div className="min-w-[760px]">
                      <div className="bg-navy text-white text-[10px] font-black uppercase tracking-widest flex items-center py-4 px-6 md:px-12">
                        <div className="w-12 text-center text-[8px] opacity-70">S.No</div>
                        <div className="flex-1 px-4">PARTICULARS (Service Name & Details)</div>
                        <div className="w-24 text-center">HSN</div>
                        <div className="w-20 text-center">QTY</div>
                        <div className="w-28 text-center">UNIT (UOM)</div>
                        <div className="w-28 text-center">RATE (₹)</div>
                        <div className="w-28 text-right">AMOUNT (₹)</div>
                        <div className="w-12"></div>
                      </div>
                      
                      <div className="divide-y divide-gray-50 bg-white">
                        {items.map((item, index) => (
                          <div key={item.id} className="flex items-start py-6 px-6 md:px-12 group hover:bg-gray-50/50 transition-colors">
                            <div className="w-12 pt-2 text-center font-black text-navy text-sm">{index + 1}</div>
                            <div className="flex-1 px-4 space-y-2">
                              <input 
                                className="w-full bg-transparent font-black text-base text-navy outline-none placeholder:text-gray-400"
                                placeholder="Particulars (Service Name / Material)"
                                value={item.name || ""}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              />
                              <textarea 
                                className="w-full bg-gray-50/50 border border-transparent focus:border-teal/30 focus:bg-white rounded-xl p-3 font-medium text-xs text-gray-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                placeholder="Describe details..."
                                rows={2}
                                value={item.description || ""}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              />
                            </div>
                            <div className="w-24 pt-1 text-center">
                              <input 
                                className="w-20 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                placeholder="HSN/SAC"
                                value={item.hsn || ''}
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => handleDetectHsn(item.id, item.name, item.type)}
                                className="mt-1 text-[9px] font-black text-teal hover:underline flex items-center justify-center gap-0.5 mx-auto cursor-pointer"
                                title="Search GST Portal & Google AI for HSN/SAC Code"
                              >
                                ✨ Detect
                              </button>
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
                                className="w-full bg-white border border-gray-100 rounded-lg py-2 px-1 text-center font-bold text-xs outline-none focus:ring-2 focus:ring-teal/20 cursor-pointer"
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
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MOBILE RESPONSIVE CARD VIEW (Prices & UOM 100% visible) */}
                  <div className="md:hidden divide-y divide-gray-100 bg-white">
                    <div className="bg-navy text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4 flex justify-between items-center">
                      <span>Items List ({items.length})</span>
                      <span className="text-teal font-extrabold text-[9px]">UOM & Rates Auto-Calculated</span>
                    </div>

                    {items.map((item, index) => (
                      <div key={item.id} className="p-4 space-y-3 bg-white">
                        {/* Row 1: S.No + Particulars + Delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-full bg-navy/10 text-navy font-black text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <input 
                              className="w-full bg-transparent font-black text-sm text-navy outline-none placeholder:text-gray-400 border-b border-gray-100 focus:border-teal pb-1"
                              placeholder="Particulars (Service / Material)"
                              value={item.name || ""}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 shrink-0 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Description */}
                        <textarea 
                          className="w-full bg-gray-50/70 border border-gray-100 focus:border-teal/30 focus:bg-white rounded-xl p-2.5 font-medium text-xs text-gray-600 outline-none transition-all placeholder:text-gray-400 resize-none"
                          placeholder="Description / work details..."
                          rows={2}
                          value={item.description || ""}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />

                        {/* Grid 1: HSN & Quantity */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">HSN / SAC</label>
                              <button
                                type="button"
                                onClick={() => handleDetectHsn(item.id, item.name, item.type)}
                                className="text-[9px] font-black text-teal hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                ✨ Detect
                              </button>
                            </div>
                            <input 
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2.5 text-xs font-bold text-navy outline-none focus:border-teal"
                              placeholder="HSN/SAC"
                              value={item.hsn || ''}
                              onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Quantity (QTY)</label>
                            <input 
                              type="number"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2.5 text-xs font-bold text-navy text-center outline-none focus:border-teal"
                              value={(!item.quantity || isNaN(item.quantity)) ? '' : item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>

                        {/* Grid 2: Unit (UOM) & Rate (₹) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Unit (UOM)</label>
                            <select
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-xs font-bold text-navy outline-none focus:border-teal cursor-pointer"
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
                                className="mt-1.5 w-full bg-white border border-gray-200 rounded-lg py-1 px-2 text-[10px] font-bold outline-none focus:border-teal"
                                placeholder="Enter Unit"
                                value={item.unit || ''}
                                onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                              Rate (₹) / {item.unit || 'Unit'}
                            </label>
                            <input 
                              type="number"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2.5 text-xs font-bold text-navy text-right outline-none focus:border-teal"
                              placeholder="0"
                              value={(!item.rate || isNaN(item.rate)) ? '' : item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>

                        {/* Bottom Row: Amount Highlight */}
                        <div className="flex items-center justify-between bg-teal/10 px-3.5 py-2.5 rounded-xl border border-teal/20">
                          <span className="text-[10px] font-black text-teal uppercase tracking-wider">Item Total:</span>
                          <span className="text-sm font-black text-navy">
                            ₹{(item.rate * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
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
                               <Plus size={16} className="text-teal" /> Add Services
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
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Freight & Pkg (+)</span>
                           <input 
                              type="number"
                              className="w-24 bg-teal/5 border border-teal/10 rounded-lg py-1 px-2 text-right font-bold text-teal outline-none focus:ring-2 focus:ring-teal/20"
                              value={(!freight || isNaN(freight)) ? '' : freight}
                              onChange={(e) => setFreight(e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                           />
                        </div>
                        <div className="flex justify-between items-center px-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Round Off (+/-)</span>
                           <input 
                              type="number"
                              step="any"
                              className="w-24 bg-teal/5 border border-teal/10 rounded-lg py-1 px-2 text-right font-bold text-teal outline-none focus:ring-2 focus:ring-teal/20"
                              value={(!roundOff || isNaN(roundOff)) ? '' : roundOff}
                              onChange={(e) => setRoundOff(e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                           />
                        </div>
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
                           <>
                             <div className="flex justify-between items-center px-4 pt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Type</span>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg text-[9px] font-black">
                                  <button
                                    type="button"
                                    onClick={() => setGstType('cgst_sgst')}
                                    className={cn("px-2 py-1 rounded-md transition-all", gstType === 'cgst_sgst' ? "bg-teal text-navy shadow-sm font-black" : "text-gray-500 hover:text-navy")}
                                  >
                                    CGST+SGST
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGstType('igst')}
                                    className={cn("px-2 py-1 rounded-md transition-all", gstType === 'igst' ? "bg-teal text-navy shadow-sm font-black" : "text-gray-500 hover:text-navy")}
                                  >
                                    IGST
                                  </button>
                                </div>
                             </div>
                             {gstType === 'cgst_sgst' ? (
                               <>
                                 <div className="flex justify-between items-center px-4 text-xs">
                                   <span className="text-[10px] font-medium text-gray-400">CGST ({gstPercentage / 2}%)</span>
                                   <span className="font-bold text-navy">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
                                 </div>
                                 <div className="flex justify-between items-center px-4 text-xs">
                                   <span className="text-[10px] font-medium text-gray-400">SGST ({gstPercentage / 2}%)</span>
                                   <span className="font-bold text-navy">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
                                 </div>
                               </>
                             ) : (
                               <div className="flex justify-between items-center px-4 text-xs">
                                 <span className="text-[10px] font-medium text-gray-400">IGST ({gstPercentage}%)</span>
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
            <div className="p-4 sm:p-6 md:p-12 bg-gray-50/30 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
               <div className="space-y-4">
                  <h6 className="text-[10px] font-black text-navy uppercase tracking-widest">Bank Details & Billing Policy</h6>
                  <textarea 
                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 outline-none focus:border-teal resize-none"
                    rows={4}
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black text-navy uppercase tracking-widest">UPI ID / Link for QR:</span>
                      <span className="text-[8px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Slideable ↔</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-teal focus-within:ring-1 focus-within:ring-teal/20 transition-all shadow-sm">
                      <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-thin scroll-smooth flex items-center pr-1 touch-pan-x">
                        <input 
                          className="bg-transparent text-xs font-bold text-teal outline-none w-full min-w-[280px] tracking-wide"
                          placeholder="e.g. 9582268658@ybl or mustakansari9582-3@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                      {upiId && (
                        <button
                          type="button"
                          title="Copy UPI ID"
                          onClick={() => {
                            navigator.clipboard.writeText(upiId);
                            toast.success('UPI ID copied to clipboard');
                          }}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
               </div>
               {!isTaxInvoice ? (
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
        <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {/* QR Code Toggle Row */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => setIncludeQR(prev => !prev)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                includeQR
                  ? 'bg-teal/10 border-teal text-teal shadow-[0_0_20px_rgba(15,118,110,0.2)]'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                includeQR ? 'bg-teal border-teal' : 'border-gray-300 bg-white'
              }`}>
                {includeQR && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <QrCode size={16} className={includeQR ? 'text-teal' : 'text-gray-400'} />
              Include QR Code on PDF
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                includeQR ? 'bg-teal text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {includeQR ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
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
            setDocumentType('Estimate');
            setEstimateNumber(getNextSerialNumberForInvoices('Estimate', savedInvoicesList));
            setShowEditor(true);
          }}
          className="bg-navy text-white h-20 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Create Proforma Invoice
        </Button>
        <Button 
          onClick={() => {
            setDocumentType('Tax Invoice');
            setEstimateNumber(getNextSerialNumberForInvoices('Tax Invoice', savedInvoicesList));
            setShowEditor(true);
          }}
          className="bg-teal text-navy h-20 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Create Tax Invoice
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
