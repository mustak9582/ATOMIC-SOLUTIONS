import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
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
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';

export default function InvoiceViewer() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    dataService.getCollection('settings').then(data => {
      if (data && data.length > 0) setSettings(data[0]);
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
  }, [id]);

  const generatePDF = async () => {
    if (!invoice) return;
    try {
      const pdfData: PDFInvoiceData = {
        type: invoice.type || 'Invoice',
        number: invoice.estimateNumber || invoice.invoiceNumber || 'No',
        date: invoice.date || invoice.timestamp,
        customerName: invoice.customerName || 'Valued Customer',
        customerPhone: invoice.customerPhone || '',
        customerAddress: invoice.customerAddress || '',
        customerGSTIN: invoice.customerGSTIN || '',
        items: (invoice.items || []).map((i: any) => {
          const q = i.quantity || 1;
          const r = i.rate || i.price || 0;
          return {
            name: i.name,
            description: i.description,
            quantity: q,
            rate: r,
            uom: i.unit || i.uom || 'Nos',
            taxable: q * r,
            amount: q * r
          };
        }),
        summary: {
          taxableAmount: invoice.subTotal - (invoice.discount || 0),
          cgstAmount: (invoice.gstAmount || 0) / 2,
          sgstAmount: (invoice.gstAmount || 0) / 2,
          igstAmount: 0,
          freightCharges: 0,
          discountAmount: invoice.discount || 0,
          roundOff: invoice.roundOff || 0
        },
        totalAmount: invoice.totalAmount,
        bankDetails: invoice.bankDetails || 'NAME: MUSTAK ANSARI \n BANK: BANK OF BARODA \n A/C: 26450200001659 \n IFSC: BARB0DEOGHA',
        terms: invoice.terms,
        declaration: invoice.declaration,
        companyPhone: settings?.phone || '9582268658',
        companyAddress: settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
        logoUrl: window.location.origin + '/logo.png'
      };
      
      const doc = generateInvoicePDF(pdfData);
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Viewer Header */}
      <div className="bg-navy p-4 flex justify-between items-center text-white border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
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
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="hidden sm:flex text-white hover:text-teal font-black text-[10px] uppercase tracking-widest h-10 px-4"
          >
            <Home size={16} className="mr-2" /> Home
          </Button>
          <Button 
            onClick={generatePDF}
            className="bg-teal text-navy hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6 gap-2"
          >
            <Download size={14} /> <span className="hidden xs:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-navy/5 overflow-hidden border border-gray-100">
          {/* Status Banner */}
          <div className="bg-teal p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-teal shadow-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-navy font-black text-lg leading-none mb-1 uppercase tracking-tighter">Verified {invoice.type}</h2>
                <p className="text-navy/60 text-[10px] font-black uppercase tracking-widest italic">Atomic Solutions Official Record</p>
              </div>
            </div>
            <div className="flex bg-navy/10 px-6 py-2 rounded-xl">
               <span className="text-navy font-black text-xs">REF: {invoice.estimateNumber}</span>
            </div>
          </div>

          {/* Business Info Section */}
          <div className="p-8 md:p-12 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Atomic Solutions</h3>
                <p className="text-xs font-bold text-teal italic">"We Bring Comfort Life"</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
                  <MapPin size={14} className="text-teal" />
                  <span>Deoghar, Jharkhand - 814149</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
                  <Phone size={14} className="text-teal" />
                  <span>+91 95822 68658</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
                   <Mail size={14} className="text-teal" />
                   <span>atomichvacsolutions@gmail.com</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-[32px] md:text-right min-w-[200px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billing Date</p>
              <p className="text-lg font-black text-navy mb-4">
                {invoice.date || invoice.timestamp 
                  ? new Date(invoice.date || invoice.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                  : 'N/A'}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
              <p className="text-sm font-black text-navy">{invoice.customerName}</p>
              {invoice.customerGSTIN && (
                <p className="text-[10px] font-bold text-teal uppercase mt-1">GSTIN: {invoice.customerGSTIN}</p>
              )}
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
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
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-navy">{item.name}</p>
                      <p className="text-[10px] font-medium text-gray-400">{item.description}</p>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600">{item.quantity}</td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600 uppercase">{item.unit || item.uom || 'Nos'}</td>
                    <td className="px-8 py-6 text-right text-sm font-bold text-gray-600">₹{item.rate.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-sm font-black text-navy">₹{(item.rate * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="p-8 md:p-12 border-t border-gray-50 bg-gray-50/50 flex flex-col items-end">
             <div className="w-full md:w-80 space-y-3">
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
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy">Payable {invoice.type === 'Invoice' ? 'Total' : 'Estimate'}</span>
                   <span className="text-3xl font-black text-navy">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
             </div>
          </div>

          {/* Bank & Terms */}
          <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-500">
             <div className="space-y-4">
                <h5 className="text-[10px] font-black text-navy uppercase tracking-widest border-l-2 border-teal pl-3">Bank Details</h5>
                <p className="text-[10px] font-medium whitespace-pre-wrap leading-relaxed">{invoice.bankDetails}</p>
             </div>
             <div className="space-y-4">
                <h5 className="text-[10px] font-black text-navy uppercase tracking-widest border-l-2 border-teal pl-3">
                  {invoice.type === 'Invoice' ? 'Declaration' : 'Standard Terms'}
                </h5>
                <p className="text-[10px] font-medium whitespace-pre-wrap leading-relaxed">
                  {invoice.type === 'Invoice'
                    ? (invoice.declaration || '1. Subject to Deoghar (Jharkhand) jurisdiction\n2. Terms & conditions are subject to our trade policy\n3. Our risk & responsibility ceases after the delivery of goods.\nE. & O.E.')
                    : (invoice.terms || '1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.')}
                </p>
             </div>
          </div>
        </div>

        <div className="mt-12 text-center">
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
