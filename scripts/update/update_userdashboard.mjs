import fs from 'fs';

let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// 1. Add compressImage to utils import
content = content.replace(
  "import { cn, formatWhatsAppLink, safeDateFormatter, safeTimeFormatter } from '../lib/utils';",
  "import { cn, formatWhatsAppLink, safeDateFormatter, safeTimeFormatter, compressImage } from '../lib/utils';"
);

// 2. Add Upload to lucide-react imports
if (!content.includes('Upload,')) {
  content = content.replace(
    "CheckCircle2,",
    "CheckCircle2, Upload,"
  );
}

// 3. Add handleUploadPaymentProof function
const uploadFn = `
  const handleUploadPaymentProof = async (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Uploading payment proof...');
      const base64Image = await compressImage(file, 800);
      await dataService.updateDoc('invoices', invoiceId, {
        paymentProofUrl: base64Image,
        status: 'Verification Pending',
      });
      toast.success('Payment proof uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image.');
    }
  };
`;

content = content.replace(
  "const downloadInvoicePDF = async (invoice: any) => {",
  uploadFn + "\n  const downloadInvoicePDF = async (invoice: any) => {"
);

// 4. Update the Invoice Card in UserDashboard to include the upload button (in two places!)
// Place 1: Recent Billing (line 862 roughly)
// Place 2: Financial Records (line 942 roughly)

const invoiceCardContent = `
                            <div className="text-right flex flex-col md:flex-row gap-4 items-center">
                              <div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-xl font-black text-navy">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-black uppercase text-teal mt-1">{inv.status}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  onClick={() => downloadInvoicePDF(inv)}
                                  className="h-10 px-6 rounded-xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20"
                                >
                                  <Download size={14} className="mr-2" /> PDF
                                </Button>
                                {inv.status !== 'Paid' && inv.status !== 'Verification Pending' && (
                                  <label className="cursor-pointer h-10 px-6 rounded-xl bg-teal/10 text-teal hover:bg-teal hover:text-navy font-black text-[10px] uppercase tracking-widest flex items-center justify-center transition-all">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleUploadPaymentProof(inv.id, e)}
                                    />
                                    <Upload size={14} className="mr-2" /> Pay / Upload
                                  </label>
                                )}
                                {inv.status === 'Verification Pending' && (
                                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-4 py-2 bg-orange-50 rounded-xl">In Review</span>
                                )}
                              </div>
                            </div>
`;

// It's safer to use a regex or string replacement that targets the exact div.
// Let's replace the `div` that contains the totalAmount and the GET PDF button in the Financial Records tab.

content = content.replace(
  /<div className="text-right">\s*<p className="text-\[8px\] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount<\/p>\s*<p className="text-xl font-black text-navy">₹\{inv\.totalAmount\.toLocaleString\('en-IN'\)\}<\/p>\s*<\/div>\s*<Button \s*onClick=\{\(\) => downloadInvoicePDF\(inv\)\}\s*className="h-14 px-8 rounded-2xl bg-navy hover:bg-teal text-white font-black text-\[10px\] uppercase tracking-widest shadow-xl shadow-navy\/20"\s*>\s*<Download size=\{18\} className="mr-2" \/> GET PDF\s*<\/Button>/g,
  invoiceCardContent
);

// Also replace the Recent Billing one:
content = content.replace(
  /<p className="text-sm font-black text-navy">₹\{inv\.totalAmount\.toLocaleString\(\)\}<\/p>\s*<Button \s*onClick=\{\(\) => downloadInvoicePDF\(inv\)\}\s*variant="ghost"\s*className="h-10 w-10 p-0 rounded-xl hover:bg-navy hover:text-white"\s*>\s*<Download size=\{16\} \/>\s*<\/Button>/g,
  invoiceCardContent
);

fs.writeFileSync('src/components/UserDashboard.tsx', content);
console.log('Updated UserDashboard.tsx');
