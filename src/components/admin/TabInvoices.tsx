import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { Plus, Download, Trash2, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';
import { maskPhone } from '../../lib/utils';

export interface TabInvoicesProps {
  allInvoices: any[];
  navigate: (path: string) => void;
  downloadInvoicePDF: (invoice: any) => Promise<void>;
  handleDeleteInvoice: (id: string) => void;
}


  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await dataService.updateDoc('invoices', id, { status });
      toast.success(`Invoice marked as ${status}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

export function TabInvoices({
  allInvoices,
  navigate,
  downloadInvoicePDF,
  handleDeleteInvoice
}: TabInvoicesProps) {
  return (
          <TabsContent value="invoices" id="invoices" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden mb-8">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Estimates Archive</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full Estimate History & PDF Access</p>
                </div>
                <div className="flex gap-2">
                   <Button 
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                    className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/admin/invoice-generator')}
                    className="bg-navy hover:bg-navy/90 text-white rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus size={16} className="text-teal" /> Create New
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Estimate No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Customer</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-right">Amount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInvoices.filter(i => i.type === 'Estimate').map((inv) => (
                      <TableRow key={inv.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                        <TableCell className="px-8 py-5 font-black text-navy text-sm">#{inv.estimateNumber || inv.invoiceNumber}</TableCell>
                        <TableCell className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-navy text-sm uppercase tracking-tight">{inv.customerName}</span>
                            <span className="text-[10px] font-medium text-gray-400">{inv.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-1 italic border-gray-200">
                            {inv.status || 'Saved'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-sm font-medium text-gray-500">
                          {new Date(inv.timestamp || inv.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right font-black text-navy text-sm">
                          <div className="max-w-[150px] truncate inline-block" title={`₹${inv.totalAmount.toLocaleString('en-IN')}`}>
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-4 rounded-xl border-gray-100 font-black text-[9px] uppercase tracking-widest hover:border-teal hover:text-teal transition-all"
                               onClick={() => navigate(`/invoice/${inv.id}`)}
                             >
                               View
                             </Button>
                             <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105" onClick={() => downloadInvoicePDF(inv)}><Download size={16} /></Button>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-10 w-10 p-0 rounded-xl border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDeleteInvoice(inv.id);
                               }}
                             >
                               <Trash2 size={18} />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allInvoices.filter(i => i.type === 'Estimate').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                              <FileText size={32} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No estimates generated yet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Tax Invoices Archive</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full Transaction History & PDF Access</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Invoice No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Customer</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-right">Amount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInvoices.filter(i => i.type === 'Invoice').map((inv) => (
                      <TableRow key={inv.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                        <TableCell className="px-8 py-5 font-black text-navy text-sm">#{inv.estimateNumber || inv.invoiceNumber}</TableCell>
                        <TableCell className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-navy text-sm uppercase tracking-tight">{inv.customerName}</span>
                            <span className="text-[10px] font-medium text-gray-400">{inv.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-1 italic border-gray-200">
                            {inv.status || 'Saved'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-sm font-medium text-gray-500">
                          {new Date(inv.timestamp || inv.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right font-black text-navy text-sm">
                          <div className="max-w-[150px] truncate inline-block" title={`₹${inv.totalAmount.toLocaleString('en-IN')}`}>
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-4 rounded-xl border-gray-100 font-black text-[9px] uppercase tracking-widest hover:border-teal hover:text-teal transition-all"
                               onClick={() => navigate(`/invoice/${inv.id}`)}
                             >
                               View
                             </Button>
                             <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105" onClick={() => downloadInvoicePDF(inv)}><Download size={16} /></Button>
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

                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-10 w-10 p-0 rounded-xl border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDeleteInvoice(inv.id);
                               }}
                             >
                               <Trash2 size={18} />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allInvoices.filter(i => i.type === 'Invoice').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                              <FileText size={32} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No tax invoices generated yet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
  );
}
