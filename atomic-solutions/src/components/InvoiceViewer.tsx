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
      // Header Branding
      const logoUrl = settings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
      
      // Attempt to load logo with a better approach
      try {
        doc.addImage(logoUrl, 'PNG', 15, 12, 18, 18);
      } catch (e) {
        doc.setDrawColor(0, 31, 63);
        doc.setLineWidth(0.5);
        doc.line(15, 12, 25, 25);
        doc.line(25, 25, 35, 12);
        doc.line(15, 25, 35, 25);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const addressStr = settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
      doc.text(addressStr, pageWidth / 2, 26, { align: 'center' });
      
      if (settings?.ownerGSTIN) {
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: ${settings.ownerGSTIN}`, pageWidth / 2, 31, { align: 'center' });
      }

      doc.setFont('helvetica', 'bold');
      doc.text('WE BRING COMFORT LIFE', pageWidth - 20, 12, { align: 'right' });
      doc.text(`MOB:- ${settings?.phone || '9582268658'}`, pageWidth - 20, 18, { align: 'right' });

      // SL NO and Date
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const invoiceTypePrefix = invoice.type === 'Invoice' ? 'INV-' : 'EST-';
      const slNoValue = invoice.estimateNumber ? invoice.estimateNumber.split('-').pop() : Math.floor(Math.random() * 100000);
      const slNo = `SL NO:- ${invoiceTypePrefix}${slNoValue}`;
      doc.text(slNo, 20, 40);
      doc.text(`DATE:- ${new Date(invoice.date || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - 20, 40, { align: 'right' });

      // M/S Line
      doc.text(`M/S: ${invoice.customerName || '.............................................................................................................................................................................'}`, 20, 48);
      doc.line(28, 49, pageWidth - 20, 49);

      const tableData = [
        ...(invoice.items || []).map((item: any, idx: number) => [
          idx + 1,
          item.description ? `${item.name}\n${item.description}` : item.name,
          item.quantity,
          (item.rate || 0).toLocaleString('en-IN'),
          ((item.rate || 0) * (item.quantity || 0)).toLocaleString('en-IN')
        ]),
        ['', 'TOTAL', '', '', (invoice.subTotal || invoice.totalAmount || 0).toLocaleString('en-IN')]
      ];

      autoTable(doc, {
        startY: 55,
        head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          fontStyle: 'bold', 
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          halign: 'left',
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        },
        didParseCell: (data: any) => {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 1) data.cell.styles.halign = 'right';
          }
        },
        margin: { left: 15, right: 15 },
        bodyStyles: { minCellHeight: 10 }
      });

      let finalY = (doc as any).lastAutoTable.finalY;

      // Table extensions
      if (finalY < pageHeight - 100) {
         const cols = [15, 30, pageWidth - 100, pageWidth - 80, pageWidth - 50, pageWidth - 15];
         cols.forEach(x => doc.line(x, finalY, x, pageHeight - 80));
         doc.line(15, pageHeight - 80, pageWidth - 15, pageHeight - 80);
         finalY = pageHeight - 80;
      }

      // Lower Section (GST & Grand Total)
      if (invoice.gstAmount || (invoice.roundOff && invoice.roundOff !== 0)) {
         let currentY = finalY + 5;
         doc.setFont('helvetica', 'bold');
         if (invoice.gstAmount) {
            doc.text(`GST (${invoice.gstPercentage || 0}%)`, pageWidth - 50, currentY, { align: 'right' });
            doc.text(`${(invoice.gstAmount || 0).toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
            currentY += 8;
         }
         if (invoice.roundOff) {
            doc.text(`ADJUSTMENT`, pageWidth - 50, currentY, { align: 'right' });
            doc.text(`${(invoice.roundOff || 0).toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
            currentY += 8;
         }
         doc.setFontSize(11);
         doc.text(`GRAND TOTAL: ₹ ${(invoice.totalAmount || 0).toLocaleString('en-IN')}/-`, pageWidth - 20, currentY + 5, { align: 'right' });
      }

      // Footer
      const footerY = pageHeight - 50;
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      doc.text('BANK DETAILS:', 20, footerY);
      doc.setFont('helvetica', 'normal');
      const bankLines = doc.splitTextToSize(invoice.bankDetails || 'N/A', 80);
      doc.text(bankLines, 20, footerY + 5);

      // QR Code with amount for convenience
      const upiID = "mustakansari9582-3@okhdfcbank";
      const qrText = `upi://pay?pa=${upiID}&pn=Mustak%20Ansari&am=${invoice.totalAmount || 0}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
      
      try {
        doc.addImage(qrUrl, 'PNG', 85, footerY - 3, 22, 22);
        doc.setFontSize(6);
        doc.text('SCAN TO PAY', 96, footerY + 22, { align: 'center' });
      } catch (e) {
        console.error('QR Code failed to load');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FOR :- MUSTAK ANSARI', pageWidth - 20, footerY + 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 25, { align: 'right' });

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
            className="flex sm:hidden items-center justify-center p-2 hover:text-teal transition-colors"
          >
            <ArrowLeft size={20} />
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
              <p className="text-lg font-black text-navy mb-4">{new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <span>Sub-Total</span>
                   <span className="text-navy">₹{invoice.subTotal?.toLocaleString('en-IN') || invoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
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
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy">Payable Total</span>
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
