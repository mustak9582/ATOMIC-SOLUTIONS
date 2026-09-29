import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Plus, Download, Trash2, FileText, CheckCircle, Image as ImageIcon, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';
import { cn, maskPhone } from '../../lib/utils';

export interface TabInvoicesProps {
  allInvoices: any[];
  navigate: (path: string) => void;
  downloadInvoicePDF: (invoice: any) => Promise<void>;
  handleDeleteInvoice: (id: string) => void;
  handleBulkDeleteInvoices?: (ids: string[]) => Promise<void> | void;
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
  handleDeleteInvoice,
  handleBulkDeleteInvoices
}: TabInvoicesProps) {
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const estimateInvoices = allInvoices.filter(i => i.type === 'Estimate');
  const taxInvoices = allInvoices.filter(i => i.type !== 'Estimate');

  const allEstimateSelected = estimateInvoices.length > 0 && estimateInvoices.every(i => selectedInvoiceIds.includes(i.id));
  const allTaxSelected = taxInvoices.length > 0 && taxInvoices.every(i => selectedInvoiceIds.includes(i.id));
  const allInvoicesSelected = allInvoices.length > 0 && allInvoices.every(i => selectedInvoiceIds.includes(i.id));

  const toggleSelectEstimates = () => {
    if (allEstimateSelected) {
      const estimateIds = new Set(estimateInvoices.map(i => i.id));
      setSelectedInvoiceIds(prev => prev.filter(id => !estimateIds.has(id)));
    } else {
      const newIds = new Set([...selectedInvoiceIds, ...estimateInvoices.map(i => i.id)]);
      setSelectedInvoiceIds(Array.from(newIds));
    }
  };

  const toggleSelectTax = () => {
    if (allTaxSelected) {
      const taxIds = new Set(taxInvoices.map(i => i.id));
      setSelectedInvoiceIds(prev => prev.filter(id => !taxIds.has(id)));
    } else {
      const newIds = new Set([...selectedInvoiceIds, ...taxInvoices.map(i => i.id)]);
      setSelectedInvoiceIds(Array.from(newIds));
    }
  };

  const toggleSelectAll = () => {
    if (allInvoicesSelected) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(allInvoices.map(i => i.id));
    }
  };

  const toggleInvoiceSelection = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      if (handleBulkDeleteInvoices) {
        await handleBulkDeleteInvoices(selectedInvoiceIds);
      } else {
        await Promise.all(selectedInvoiceIds.map(id => dataService.deleteDoc('invoices', id)));
        toast.success(`${selectedInvoiceIds.length} invoices deleted`);
      }
      setSelectedInvoiceIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Bulk delete invoices error:', err);
      toast.error('Failed to delete selected invoices');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <TabsContent value="invoices" id="invoices" className="m-0 focus-visible:outline-none">
      {/* Global Invoice Header Bar */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden mb-8">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
          <div>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Invoices & Billing Hub</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Manage Proforma Estimates & Official Tax Invoices ({allInvoices.length} Total)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allInvoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className={cn(
                  "rounded-2xl px-5 h-12 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all",
                  allInvoicesSelected ? "bg-teal/20 text-teal border-teal/30" : "bg-white text-navy border-gray-200"
                )}
              >
                {allInvoicesSelected ? <CheckSquare size={16} className="text-teal" /> : <Square size={16} className="text-gray-400" />}
                {allInvoicesSelected ? "Deselect All" : `Select All (${allInvoices.length})`}
              </Button>
            )}
            {selectedInvoiceIds.length > 0 && (
              <Button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-5 h-12 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-200"
              >
                <Trash2 size={16} /> Delete Selected ({selectedInvoiceIds.length})
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/admin/invoice-generator')}
              className="bg-navy hover:bg-navy/90 text-white rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"
            >
              <Plus size={16} className="text-teal" /> Create New
            </Button>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedInvoiceIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-8 bg-red-50/90 backdrop-blur-md border-2 border-red-200 rounded-[28px] p-5 px-8 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-red-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              {selectedInvoiceIds.length}
            </div>
            <div>
              <span className="text-sm font-black text-red-950 uppercase tracking-tight block">
                {selectedInvoiceIds.length} Invoice{selectedInvoiceIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Ready for permanent deletion from database
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoiceIds([])}
              className="h-11 px-5 rounded-xl border-red-200 text-red-800 hover:bg-red-100 font-black text-[10px] uppercase tracking-widest bg-white"
            >
              Cancel Selection
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-300 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete Permanently ({selectedInvoiceIds.length})
            </Button>
          </div>
        </motion.div>
      )}

      {/* 1. Proforma Invoices Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden mb-8">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
          <div>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Proforma Invoice Archive</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full Proforma Invoice History & PDF Access ({estimateInvoices.length})</p>
          </div>
          {estimateInvoices.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectEstimates}
                className={cn(
                  "rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  allEstimateSelected ? "bg-teal/20 text-teal border-teal/30" : "bg-white text-navy border-gray-200"
                )}
              >
                {allEstimateSelected ? <CheckSquare size={16} className="text-teal" /> : <Square size={16} className="text-gray-400" />}
                {allEstimateSelected ? "Deselect Proforma" : `Select All Proforma (${estimateInvoices.length})`}
              </Button>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none">
                <TableHead className="w-12 px-6 h-14 text-center">
                  <input 
                    type="checkbox"
                    checked={allEstimateSelected}
                    onChange={toggleSelectEstimates}
                    aria-label="Select all proforma invoices"
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Proforma Inv No</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Customer</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimateInvoices.map((inv) => {
                const isSelected = selectedInvoiceIds.includes(inv.id);
                return (
                  <TableRow 
                    key={inv.id} 
                    className={cn(
                      "group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none",
                      isSelected && "bg-teal/5 hover:bg-teal/10"
                    )}
                  >
                    <TableCell className="w-12 px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleInvoiceSelection(inv.id, e as any)}
                        aria-label={`Select invoice ${inv.id}`}
                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-5 font-black text-navy text-sm">#{inv.estimateNumber || inv.invoiceNumber}</TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-navy text-sm uppercase tracking-tight">{inv.customerName}</span>
                        <span className="text-[10px] font-medium text-gray-400">{inv.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-1 italic border-gray-200">
                        {inv.status || 'Saved'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500">
                      {new Date(inv.timestamp || inv.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right font-black text-navy text-sm">
                      <div className="max-w-[150px] truncate inline-block" title={`₹${inv.totalAmount?.toLocaleString('en-IN')}`}>
                        ₹{inv.totalAmount?.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl border-gray-100 font-black text-[9px] uppercase tracking-widest hover:border-teal hover:text-teal transition-all"
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                        >
                          View
                        </Button>
                        <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105" onClick={() => downloadInvoicePDF(inv)}>
                          <Download size={16} />
                        </Button>
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
                );
              })}
              {estimateInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                        <FileText size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No proforma invoices generated yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 2. Tax Invoices Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
          <div>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Tax Invoices Archive</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full Transaction History & PDF Access ({taxInvoices.length})</p>
          </div>
          {taxInvoices.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectTax}
                className={cn(
                  "rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  allTaxSelected ? "bg-teal/20 text-teal border-teal/30" : "bg-white text-navy border-gray-200"
                )}
              >
                {allTaxSelected ? <CheckSquare size={16} className="text-teal" /> : <Square size={16} className="text-gray-400" />}
                {allTaxSelected ? "Deselect Tax Invoices" : `Select All Tax (${taxInvoices.length})`}
              </Button>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none">
                <TableHead className="w-12 px-6 h-14 text-center">
                  <input 
                    type="checkbox"
                    checked={allTaxSelected}
                    onChange={toggleSelectTax}
                    aria-label="Select all tax invoices"
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Invoice No</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Customer</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxInvoices.map((inv) => {
                const isSelected = selectedInvoiceIds.includes(inv.id);
                return (
                  <TableRow 
                    key={inv.id} 
                    className={cn(
                      "group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none",
                      isSelected && "bg-teal/5 hover:bg-teal/10"
                    )}
                  >
                    <TableCell className="w-12 px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleInvoiceSelection(inv.id, e as any)}
                        aria-label={`Select invoice ${inv.id}`}
                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-5 font-black text-navy text-sm">#{inv.estimateNumber || inv.invoiceNumber}</TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-navy text-sm uppercase tracking-tight">{inv.customerName}</span>
                        <span className="text-[10px] font-medium text-gray-400">{inv.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-1 italic border-gray-200">
                        {inv.status || 'Saved'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500">
                      {new Date(inv.timestamp || inv.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right font-black text-navy text-sm">
                      <div className="max-w-[150px] truncate inline-block" title={`₹${inv.totalAmount?.toLocaleString('en-IN')}`}>
                        ₹{inv.totalAmount?.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl border-gray-100 font-black text-[9px] uppercase tracking-widest hover:border-teal hover:text-teal transition-all"
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                        >
                          View
                        </Button>
                        <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105" onClick={() => downloadInvoicePDF(inv)}>
                          <Download size={16} />
                        </Button>
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
                );
              })}
              {taxInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
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

      {/* Bulk Delete Invoices Confirmation Dialog */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-8">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">
              Delete {selectedInvoiceIds.length} Selected Invoices?
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium mt-2">
              Are you sure you want to permanently delete these <span className="font-bold text-navy">{selectedInvoiceIds.length}</span> invoice(s)? This action cannot be undone and will permanently remove all selected invoices from the database and server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
            >
              {isBulkDeleting ? 'Deleting...' : `Delete All (${selectedInvoiceIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
