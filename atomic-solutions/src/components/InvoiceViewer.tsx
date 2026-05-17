import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    
    // Create PDF with explicit A4 format
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    toast.info('Generating PDF...', { duration: 2000 });

    try {
      // 1. Header Section (Matching Reference Image)
      const logoUrl = settings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
      
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
      const addressStr = settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
      doc.text(addressStr, pageWidth / 2, 28, { align: 'center' });

      // Logo (Left)
      try {
        doc.addImage(logoUrl, 'PNG', 15, 13, 20, 20);
      } catch (e) { console.error('Logo add failed'); }

      // 2. SL NO and DATE (with dots as per image)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const invoiceTypePrefix = invoice.type === 'Invoice' ? 'INV-' : 'EST-';
      const slNoValue = invoice.estimateNumber ? invoice.estimateNumber.split('-').pop() : '';
      doc.text(`SL NO:- ${invoiceTypePrefix}${slNoValue}`, 15, 42);
      doc.text(`DATE:- ${invoice.date || invoice.timestamp ? new Date(invoice.date || invoice.timestamp).toLocaleDateString('en-IN') : 'N/A'}`, pageWidth - 15, 42, { align: 'right' });

      // 3. M/S Line (Full width with dots)
      doc.setFont('helvetica', 'bold');
      doc.text(`M/S ${invoice.customerName || ''}`, 15, 52);
      doc.setFont('helvetica', 'normal');
      doc.text('..........................................................................................................................................................................', 24, 53);

      // 4. Items Table
      const tableData = [
        ...(invoice.items || []).map((item: any, idx: number) => [
          idx + 1,
          item.name + (item.description ? `\n${item.description}` : ''),
          item.quantity,
          (item.rate || 0).toLocaleString('en-IN'),
          ((item.rate || 0) * (item.quantity || 0)).toLocaleString('en-IN')
        ])
      ];

      autoTable(doc, {
        startY: 60,
        head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          halign: 'left',
          textColor: [0, 0, 0],
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
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
      const col0X = 15;
      const col1X = 15 + 15;
      const col2X = pageWidth - 15 - 35 - 25 - 20;
      const col3X = pageWidth - 15 - 35 - 25;
      const col4X = pageWidth - 15 - 35;
      const col5X = pageWidth - 15;

      // Vertical lines from table end to total row and beyond
      doc.setLineWidth(0.2);
      doc.setDrawColor(0);
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
      doc.text('TOTAL', pageWidth - 15 - 35 - 5, totalRowTop + 7, { align: 'right' });
      
      const isActuallyInvoice = invoice.type === 'Invoice';
      const displayTotal = isActuallyInvoice ? (invoice.totalAmount || 0) : ((invoice.subTotal || 0) + (invoice.roundOff || 0));
      doc.text(displayTotal.toLocaleString('en-IN'), pageWidth - 18, totalRowTop + 7, { align: 'right' });

      // 6. Footer Section (Matching Image)
      
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

      // Signature Area (Matching Image)
      doc.setFontSize(12);
      doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY + 5, { align: 'right' });
      
      doc.setFontSize(9);
      doc.text('CUSTOMER SIGNATURE............................................................', pageWidth - 15, footerY + 22, { align: 'right' });
      
      // Bottom thin line border
      doc.setLineWidth(0.3);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Clean filename
      const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      toast.success('Invoice Downloaded Successfully');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF. Please try again.');
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
                <h5 className="text-[10px] font-black text-navy uppercase tracking-widest border-l-2 border-teal pl-3">Standard Terms</h5>
                <p className="text-[10px] font-medium whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
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
