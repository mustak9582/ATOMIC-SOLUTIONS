import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabInvoices.tsx', 'utf-8');

// Import dataService and toast
if (!content.includes('dataService')) {
  content = content.replace(
    "import { Plus, Download, Trash2, FileText } from 'lucide-react';",
    "import { Plus, Download, Trash2, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';\nimport { dataService } from '../../services/firebaseService';\nimport { toast } from 'sonner';"
  );
}

// Add the update function inside the component
const updateFn = `
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await dataService.updateDoc('invoices', id, { status });
      toast.success(\`Invoice marked as \${status}\`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };
`;

content = content.replace(
  "export function TabInvoices({",
  updateFn + "\nexport function TabInvoices({"
);

// Add action buttons for Verification Pending
const actions = `
                             {inv.paymentProofUrl && (
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 className="h-9 px-3 rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest"
                                 onClick={() => window.open(inv.paymentProofUrl, '_blank')}
                                 title="View Payment Proof"
                               >
                                 <ImageIcon size={14} /> Proof
                               </Button>
                             )}
                             {inv.status === 'Verification Pending' && (
                               <Button 
                                 size="sm"
                                 className="h-9 px-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest"
                                 onClick={() => handleUpdateStatus(inv.id, 'Paid')}
                               >
                                 <CheckCircle size={14} /> Approve
                               </Button>
                             )}
`;

content = content.replace(
  /<Button \s*size="sm" \s*className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy\/90 text-white transition-all hover:scale-105"\s*onClick=\{\(\) => downloadInvoicePDF\(inv\)\}\s*>\s*<Download size=\{16\} \/>\s*<\/Button>/g,
  `<Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105" onClick={() => downloadInvoicePDF(inv)}><Download size={16} /></Button>${actions}`
);

fs.writeFileSync('src/components/admin/TabInvoices.tsx', content);
console.log('Updated TabInvoices.tsx');
