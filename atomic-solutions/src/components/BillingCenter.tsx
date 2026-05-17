import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { useNavigate } from 'react-router-dom';
import { cn, formatWhatsAppLink } from '../lib/utils';
import Logo from './Logo';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Service, SubCategory, UserProfile, BillingItem, Invoice, AppSettings } from '../types';
import { toast } from 'sonner';
import { dataService } from '../services/firebaseService';

interface BillingCenterProps {
  services?: Service[];
  whatsapp?: string;
}

export default function BillingCenter({ services: propServices, whatsapp: propWhatsapp }: BillingCenterProps) {
  const navigate = useNavigate();
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
    { id: '1', name: '', description: '', rate: 0, quantity: 1, unit: 'Unit', type: 'Labor' }
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

  // For adding recommended items
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [pricingType, setPricingType] = useState<'labour' | 'material'>('labour');

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
    // Standardize page format
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Standard logo if settings logo is missing
    const logoUrl = settings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
    
    // 1. Header Section (Matching Image)
    // Top row: Billing Memo and Slogan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });
    doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 12, { align: 'right' });

    // Company Name (Center, Big)
    doc.setFontSize(22);
    doc.setTextColor(20, 25, 60); // Navy
    doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 22, { align: 'center' });
    
    // Mobile (Right, below slogan)
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`MOB:- ${settings?.phone || '9582268658'}`, pageWidth - 15, 18, { align: 'right' });

    // Address (Centered, below name)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const addressLine = settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
    doc.text(addressLine, pageWidth / 2, 28, { align: 'center' });

    // Logo (Left)
    try {
      doc.addImage(logoUrl, 'PNG', 15, 13, 20, 20);
    } catch (e) { console.error('Logo failed'); }

    // 2. SL NO and DATE (with dots as per image)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const slNoVal = `${isInvoice ? 'INV-' : 'EST-'}${estimateNumber.split('-').pop()}`;
    doc.text(`SL NO:- ${slNoVal}`, 15, 42);
    doc.text(`DATE:- ${new Date(invoiceDate || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - 15, 42, { align: 'right' });

    // 3. M/S Line (Full width with dots)
    doc.setFont('helvetica', 'bold');
    doc.text(`M/S ${customerName || ''}`, 15, 52);
    doc.setFont('helvetica', 'normal');
    doc.text('..........................................................................................................................................................................', 24, 53);

    // 4. Items Table
    const tableData: any[] = [];
    ['Labor', 'Material', 'General'].forEach(sectionType => {
      const sectionItems = items.filter(i => 
        (sectionType === 'General' ? (!i.type || i.type === 'General') : i.type === sectionType) && 
        i.name.trim() !== ''
      );
      
      if (sectionItems.length > 0) {
        // Only add section header if there's more than one section with items
        const activeSections = ['Labor', 'Material', 'General'].filter(st => 
          items.some(i => (st === 'General' ? (!i.type || i.type === 'General') : i.type === st) && i.name.trim() !== '')
        ).length;

        if (activeSections > 1) {
          tableData.push([
            { 
              content: `${sectionType.toUpperCase()} CHARGES`, 
              colSpan: 5, 
              styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 8 } 
            }
          ]);
        }

        sectionItems.forEach((item, idx) => {
          tableData.push([
            idx + 1,
            item.name + (item.description ? `\n${item.description}` : ''),
            item.quantity,
            item.rate.toLocaleString('en-IN'),
            (item.rate * item.quantity).toLocaleString('en-IN')
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: 60,
      head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
      body: tableData,
      theme: 'grid', 
      styles: { 
        fontSize: 9, 
        cellPadding: 4, 
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 15, right: 15 },
      bodyStyles: { minCellHeight: 12 }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // Ensure we don't bleed off the page
    if (finalY > pageHeight - 75) {
      doc.addPage();
      finalY = 20;
    }

    // 5. Total Row (Placed at bottom above bank details)
    const footerY = pageHeight - 50;
    const totalCellHeight = 10;
    const totalRowTop = footerY - 15;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(0);
    doc.rect(15, totalRowTop, pageWidth - 30, totalCellHeight);
    
    // Vertical line for total value column
    const amountColumnWidth = 35;
    const rateColumnWidth = 25;
    const qtyColumnWidth = 20;
    const snoColumnWidth = 15;
    const particularsLeft = 15 + snoColumnWidth;
    const qtyLeft = 15 + snoColumnWidth + (pageWidth - 30 - snoColumnWidth - qtyColumnWidth - rateColumnWidth - amountColumnWidth); // This is dynamic in jspdf-autotable, let's use fixed values for vertical lines

    // Vertical lines connecting table to total row
    doc.setLineWidth(0.2);
    doc.setDrawColor(0);
    
    const qtyX = 15 + snoColumnWidth + (pageWidth - 30 - snoColumnWidth - qtyColumnWidth - rateColumnWidth - amountColumnWidth); 
    // Autotable uses specific column widths. Let's trace them from the config:
    // 0: 15, 1: auto, 2: 20, 3: 25, 4: 35
    const col0X = 15;
    const col1X = 15 + 15;
    const col2X = pageWidth - 15 - 35 - 25 - 20;
    const col3X = pageWidth - 15 - 35 - 25;
    const col4X = pageWidth - 15 - 35;
    const col5X = pageWidth - 15;

    // Draw the vertical lines from table end to total row and beyond
    [col0X, col1X, col2X, col3X, col4X, col5X].forEach(x => {
      // Line from table end to total row
      doc.line(x, finalY, x, totalRowTop);
      // Line from total row bottom to signature top
      doc.line(x, totalRowTop + totalCellHeight, x, footerY - 5);
    });

    doc.rect(15, totalRowTop, pageWidth - 30, totalCellHeight);
    
    // Vertical line for total value column
    doc.line(col4X, totalRowTop, col4X, totalRowTop + totalCellHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', pageWidth - 15 - amountColumnWidth - 5, totalRowTop + 7, { align: 'right' });
    
    const finalTotalValue = isInvoice ? total : (subTotal + roundOff);
    doc.text(finalTotalValue.toLocaleString('en-IN'), pageWidth - 18, totalRowTop + 7, { align: 'right' });

    // 6. Footer (Bank Info & Signatures)
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const bankLabels = [
      ['NAME', ': MUSTAK ANSARI'],
      ['BANK NAME', ': BANK OF BARODA'],
      ['IFSC CODE', ': BARB0DEOGHA'],
      ['A/C', ': 26450200001659'],
      ['PAN', ': CVVPA9010L']
    ];
    
    bankLabels.forEach((item, i) => {
      doc.text(item[0], 15, footerY + (i * 5));
      doc.text(item[1], 40, footerY + (i * 5));
    });

    // Signature Area
    doc.setFontSize(12);
    doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY + 5, { align: 'right' });
    
    doc.setFontSize(9);
    doc.text('CUSTOMER SIGNATURE............................................................', pageWidth - 15, footerY + 22, { align: 'right' });

    // Bottom thin line border
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    return doc;
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
                    <div className="w-24 text-center">QTY</div>
                    <div className="w-32 text-center">RATE (₹)</div>
                    <div className="w-32 text-right">AMOUNT (₹)</div>
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
                              <div className="w-24 pt-1 text-center">
                                <input 
                                  type="number"
                                  className="w-16 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                  value={(!item.quantity || isNaN(item.quantity)) ? '' : item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <p className="text-[9px] font-black text-gray-300 mt-1 uppercase">{item.unit || 'Unit'}</p>
                              </div>
                              <div className="w-32 pt-1 text-center">
                                <input 
                                  type="number"
                                  className="w-24 bg-white border border-gray-100 rounded-lg py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-teal/20"
                                  value={(!item.rate || isNaN(item.rate)) ? '' : item.rate}
                                  onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <p className="text-[9px] font-black text-gray-300 mt-1 uppercase">Per {item.unit || 'Unit'}</p>
                              </div>
                              <div className="w-32 pt-3 text-right font-black text-navy text-base">
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
                                if(window.confirm('Clear all items?')) setItems([{ id: '1', name: '', description: '', rate: 0, quantity: 1, unit: 'Unit', type: 'Labor' }]);
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
               <div className="space-y-4">
                  <h6 className="text-[10px] font-black text-navy uppercase tracking-widest">Notes / Terms</h6>
                  <textarea 
                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 outline-none focus:border-teal resize-none"
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
               </div>
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
