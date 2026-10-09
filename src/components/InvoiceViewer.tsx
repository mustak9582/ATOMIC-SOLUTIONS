import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { 
  Download, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Home,
  Copy
} from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS, getMergedSettings, formatBankDetailsString } from '../services/settingsService';

export default function InvoiceViewer() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => DEFAULT_APP_SETTINGS);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const activeUpi = (invoice?.upiId !== undefined ? invoice.upiId : settings?.upiId) || '';
    if (invoice && invoice.totalAmount && activeUpi.trim()) {
      const upiString = `upi://pay?pa=${activeUpi.trim()}&pn=${encodeURIComponent(settings?.companyName || 'Atomic Solutions')}&am=${invoice.totalAmount}&cu=INR`;
      QRCode.toDataURL(upiString, { width: 150, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    } else {
      setQrDataUrl(null);
    }
  }, [invoice, settings]);

  useEffect(() => {
    const unsubSettings = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) setSettings(getMergedSettings(data[0]));
    });

    if (id) {
      dataService.getDoc('invoices', id)
        .then(data => {
          if (data) {
            setInvoice(data);
          } else {
            setError('Document not found');
          }
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load document');
        })
        .finally(() => setLoading(false));
    }

    return () => unsubSettings();
  }, [id]);

  const generatePDF = async () => {
    if (!invoice) return;
    try {
      const merged = getMergedSettings(settings);
      const dynamicBankDetails = invoice.bankDetails !== undefined ? invoice.bankDetails : formatBankDetailsString(merged);

      const pdfData: PDFInvoiceData = {
        type: invoice.type || 'Invoice',
        number: invoice.estimateNumber || invoice.invoiceNumber || 'No',
        date: invoice.date || invoice.timestamp,
        customerName: invoice.customerName || 'Valued Customer',
        customerPhone: invoice.customerPhone || '',
        customerAddress: invoice.customerAddress || '',
        customerGSTIN: invoice.customerGSTIN || '',
        items: (invoice.items || []).map((i: any) => {
          const q = Number(i.quantity) || 1;
          const r = Number(i.rate || i.price) || 0;
          return {
            name: i.name || 'Service Item',
            description: i.description || '',
            quantity: q,
            rate: r,
            uom: i.unit || i.uom || 'Nos',
            taxable: q * r,
            amount: q * r
          };
        }),
        summary: {
          taxableAmount: (invoice.subTotal || invoice.totalAmount) - (invoice.discount || 0),
          cgstAmount: (invoice.gstAmount || 0) / 2,
          sgstAmount: (invoice.gstAmount || 0) / 2,
          igstAmount: 0,
          freightCharges: invoice.freightCharges || 0,
          discountAmount: invoice.discount || 0,
          roundOff: invoice.roundOff || 0
        },
        totalAmount: invoice.totalAmount,
        bankDetails: dynamicBankDetails,
        terms: invoice.terms !== undefined ? invoice.terms : merged.defaultTerms,
        declaration: invoice.declaration !== undefined ? invoice.declaration : merged.defaultDeclaration,
        companyName: merged.companyName,
        companyPhone: merged.phone,
        companyAddress: merged.address,
        companyEmail: merged.email,
        companyGSTIN: merged.ownerGSTIN,
        ownerGSTIN: merged.ownerGSTIN,
        msmeNumber: merged.msmeNumber,
        logoUrl: merged.logoUrl,
        signatureUrl: merged.signatureUrl,
        upiId: invoice.upiId !== undefined ? invoice.upiId : merged.upiId,
        qrCodeUrl: qrDataUrl || undefined
      };
      
      const doc = await generateInvoicePDF(pdfData);
      const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || invoice.invoiceNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      toast.success('Invoice Downloaded Successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-navy border-t-teal rounded-full animate-spin" />
        <p className="text-navy font-black text-xs uppercase tracking-widest">Verifying Document Credentials...</p>
      </div>
    </div>
  );

  if (error || !invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl text-center border border-red-50">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-navy uppercase tracking-tighter mb-4">Access Denied</h2>
        <p className="text-gray-400 font-medium mb-8">The document you are trying to reach is unavailable or the link has expired.</p>
        <Link to="/" className="inline-block bg-navy text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20">Return Home</Link>
      </div>
    </div>
  );

  const displayBankDetails = invoice.bankDetails !== undefined 
    ? invoice.bankDetails 
    : formatBankDetailsString(settings);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Viewer Header */}
      <div className="bg-navy p-3 sm:p-4 flex justify-between items-center text-white border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center p-2 hover:text-teal transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline ml-2 font-black text-[10px] uppercase tracking-widest">Back</span>
          </button>
          <Logo />
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <div className="hidden sm:block">
            <h1 className="font-black text-[10px] uppercase tracking-widest text-teal">Secure Document Portal</h1>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Atomic Solutions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="hidden sm:flex text-white hover:text-teal font-black text-[10px] uppercase tracking-widest h-10 px-4"
          >
            <Home size={16} className="mr-2" /> Home
          </Button>
          <Button 
            onClick={generatePDF}
            className="bg-teal text-navy hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-4 sm:px-6 gap-2"
          >
            <Download size={14} /> <span className="hidden xs:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-4 sm:mt-8 px-2 sm:px-4">
        <div className="bg-white rounded-3xl sm:rounded-[40px] shadow-2xl shadow-navy/5 overflow-hidden border border-gray-100">
          {/* Status Banner */}
          <div className="bg-teal p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-navy rounded-2xl flex items-center justify-center text-teal shadow-xl shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-navy font-black text-base sm:text-lg leading-none mb-1 uppercase tracking-tighter">Verified {invoice.type}</h2>
                <p className="text-navy/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">Atomic Solutions Official Record</p>
              </div>
            </div>
            <div className="flex bg-navy/10 px-4 sm:px-6 py-2 rounded-xl">
               <span className="text-navy font-black text-xs">REF: {invoice.estimateNumber || invoice.invoiceNumber}</span>
            </div>
          </div>

          {/* Business Info Section */}
          <div className="p-5 sm:p-8 md:p-12 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6 md:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-navy uppercase tracking-tighter">{settings.companyName || 'Atomic Solutions'}</h3>
                {settings.companyTagline && (
                  <p className="text-xs font-bold text-teal italic">"{settings.companyTagline}"</p>
                )}
              </div>
              <div className="space-y-2">
                {settings.address && (
                  <div className="flex items-start gap-2.5 text-gray-500 font-medium text-xs">
                    <MapPin size={14} className="text-teal shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                )}
                {settings.phone && (
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium text-xs">
                    <Phone size={14} className="text-teal shrink-0" />
                    <span>{settings.phone}</span>
                  </div>
                )}
                {settings.email && (
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium text-xs">
                     <Mail size={14} className="text-teal shrink-0" />
                     <span>{settings.email}</span>
                  </div>
                )}
                {settings.ownerGSTIN && (
                  <div className="text-[10px] font-bold text-navy uppercase">
                    GSTIN: <span className="font-mono text-teal">{settings.ownerGSTIN}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] md:text-right min-w-[200px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billing Date</p>
              <p className="text-base sm:text-lg font-black text-navy mb-3 sm:mb-4">
                {invoice.date || invoice.timestamp 
                  ? new Date(invoice.date || invoice.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                  : 'N/A'}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
              <p className="text-sm font-black text-navy">{invoice.customerName || invoice.userName || 'Customer'}</p>
              {invoice.customerGSTIN && (
                <p className="text-[10px] font-bold text-teal uppercase mt-1">GSTIN: {invoice.customerGSTIN}</p>
              )}
            </div>
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4 text-left">Service</th>
                  <th className="px-8 py-4 text-center">Qty</th>
                  <th className="px-8 py-4 text-center">Unit</th>
                  <th className="px-8 py-4 text-right">Rate</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(invoice.items || []).map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-navy">{item.name}</p>
                      {item.description && <p className="text-[10px] font-medium text-gray-400">{item.description}</p>}
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600">{item.quantity}</td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600 uppercase">{item.unit || item.uom || 'Nos'}</td>
                    <td className="px-8 py-6 text-right text-sm font-bold text-gray-600">₹{(Number(item.rate) || Number(item.price) || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-sm font-black text-navy">₹{((Number(item.rate) || Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (No horizontal scrolling on phones) */}
          <div className="sm:hidden divide-y divide-gray-100 bg-white p-3 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy px-1 pt-1">Particulars ({invoice.items?.length || 0})</p>
            {(invoice.items || []).map((item: any, idx: number) => {
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.rate) || Number(item.price) || 0;
              return (
                <div key={item.id || idx} className="pt-3 pb-2 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-black text-navy">{item.name}</p>
                      {item.description && <p className="text-[10px] font-medium text-gray-400">{item.description}</p>}
                    </div>
                    <span className="text-xs font-black text-navy shrink-0">₹{(qty * rate).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                    <span>Qty: {qty} {item.unit || item.uom || 'Nos'}</span>
                    <span>Rate: ₹{rate.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Section */}
          <div className="p-5 sm:p-8 md:p-12 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-12">
            {qrDataUrl && invoice.type !== 'Estimate' ? (
              <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-auto max-w-[220px]">
                <img src={qrDataUrl} alt="Scan to Pay" className="w-24 h-24" />
                <p className="text-[8px] font-black text-navy uppercase tracking-widest mt-2">Scan to Pay</p>
                {(() => {
                  const currentUpi = (invoice.upiId !== undefined ? invoice.upiId : settings?.upiId) || '';
                  if (!currentUpi) return null;
                  return (
                    <div className="mt-2 w-full flex items-center justify-between gap-1 bg-gray-50 border border-gray-200/60 rounded-lg px-2 py-1">
                      <span className="text-[9px] font-bold text-teal tracking-tight break-all">
                        {currentUpi}
                      </span>
                      <button
                        type="button"
                        title="Copy UPI ID"
                        onClick={() => {
                          navigator.clipboard.writeText(currentUpi);
                          toast.success('UPI ID copied to clipboard');
                        }}
                        className="shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-teal transition-colors"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div />
            )}
             <div className="w-full sm:w-80 space-y-2.5 sm:space-y-3">
                {invoice.discount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Discount</span>
                    <span className="text-teal">-₹{invoice.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.gstAmount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>GST ({invoice.gstPercentage}%)</span>
                    <span className="text-gray-600">+₹{invoice.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Adjustment</span>
                    <span className="text-navy">{invoice.roundOff > 0 ? '+' : ''}₹{invoice.roundOff.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy">Payable {invoice.type !== 'Estimate' ? 'Total' : 'Estimate'}</span>
                   <span className="text-2xl sm:text-3xl font-black text-navy">₹{invoice.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
             </div>
          </div>

          {/* Bank & Terms (Only rendered if present) */}
          <div className="p-5 sm:p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 text-gray-500">
             {displayBankDetails && displayBankDetails.trim() && (
               <div className="space-y-3 sm:space-y-4">
                  <h5 className="text-[10px] font-black text-navy uppercase tracking-widest border-l-2 border-teal pl-3">Bank Details</h5>
                  <p className="text-[10px] font-medium whitespace-pre-wrap leading-relaxed">{displayBankDetails}</p>
               </div>
             )}
             <div className="space-y-3 sm:space-y-4">
                <h5 className="text-[10px] font-black text-navy uppercase tracking-widest border-l-2 border-teal pl-3">
                  {invoice.type !== 'Estimate' ? 'Declaration' : 'Standard Terms'}
                </h5>
                <p className="text-[10px] font-medium whitespace-pre-wrap leading-relaxed">
                  {invoice.type !== 'Estimate'
                    ? (invoice.declaration !== undefined ? invoice.declaration : settings.defaultDeclaration || '')
                    : (invoice.terms !== undefined ? invoice.terms : settings.defaultTerms || '')}
                </p>
             </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Official Billing Document of Atomic Solutions</p>
           <div className="flex justify-center gap-8 text-gray-300">
              <ShieldCheck size={20} />
              <FileText size={20} />
              <CheckCircle2 size={20} />
           </div>
        </div>
      </div>
    </div>
  );
}
