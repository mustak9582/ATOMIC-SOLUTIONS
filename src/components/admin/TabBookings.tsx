import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { ArrowLeft, Search, Phone, MessageCircle, FileText, Briefcase, CheckCircle, Clock, XCircle, Trash2, Calendar, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Booking, UserProfile, BookingStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { cn, maskPhone, formatWhatsAppLink, safeDateFormatter } from '../../lib/utils';
import { toast } from 'sonner';

// Helper for status colors
const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export interface TabBookingsProps {
  handleTabChange: (tab: string) => void;
  statusFilter: BookingStatus | 'All';
  setStatusFilter: (status: BookingStatus | 'All') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredBookings: Booking[];
  users: UserProfile[];
  setSelectedBookingForDetails: (booking: Booking | null) => void;
  setBookingToAssign: (booking: Booking | null) => void;
  setPayoutAmount: (amount: number) => void;
  setIsStaffModalOpen: (isOpen: boolean) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  setBookingToDeleteId: (id: string | null) => void;
  setIsManualBookingOpen: (isOpen: boolean) => void;
  handleBulkDeleteBookings?: (ids: string[]) => Promise<void> | void;
}

export function TabBookings({
  handleTabChange,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  filteredBookings,
  users,
  setSelectedBookingForDetails,
  setBookingToAssign,
  setPayoutAmount,
  setIsStaffModalOpen,
  updateBooking,
  setBookingToDeleteId,
  setIsManualBookingOpen,
  handleBulkDeleteBookings
}: TabBookingsProps) {
  const navigate = useNavigate();
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const allFilteredSelected = filteredBookings.length > 0 && filteredBookings.every(b => selectedBookingIds.includes(b.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect only those in current filtered list
      const filteredIds = new Set(filteredBookings.map(b => b.id));
      setSelectedBookingIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      // Add all filtered bookings
      const newIds = new Set([...selectedBookingIds, ...filteredBookings.map(b => b.id)]);
      setSelectedBookingIds(Array.from(newIds));
    }
  };

  const toggleBookingSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBookingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedBookingIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      if (handleBulkDeleteBookings) {
        await handleBulkDeleteBookings(selectedBookingIds);
      }
      setSelectedBookingIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Bulk delete failed');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <TabsContent value="bookings" id="bookings">
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden mb-8">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-teal/5 gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative">
            <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Customer Bookings</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage & Assign Incoming Customer Bookings</p>
          </div>
          
          {/* Quick Select All / Action Controls */}
          {filteredBookings.length > 0 && (
            <div className="relative z-10 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className={cn(
                  "rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  allFilteredSelected ? "bg-teal/20 text-teal border-teal/30" : "bg-white text-navy border-gray-200 hover:border-teal"
                )}
              >
                {allFilteredSelected ? <CheckSquare size={16} className="text-teal" /> : <Square size={16} className="text-gray-400" />}
                {allFilteredSelected ? "Deselect All" : `Select All (${filteredBookings.length})`}
              </Button>
              {selectedBookingIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete Selected ({selectedBookingIds.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedBookingIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 bg-red-50/90 backdrop-blur-md border-2 border-red-200 rounded-[24px] p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-red-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              {selectedBookingIds.length}
            </div>
            <div>
              <span className="text-xs font-black text-red-950 uppercase tracking-tight block">
                {selectedBookingIds.length} Booking{selectedBookingIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Ready for permanent deletion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBookingIds([])}
              className="h-10 px-4 rounded-xl border-red-200 text-red-800 hover:bg-red-100 font-black text-[9px] uppercase tracking-widest bg-white"
            >
              Cancel Selection
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-300 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete Permanently ({selectedBookingIds.length})
            </Button>
          </div>
        </motion.div>
      )}

      <div className="mb-8 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <Button 
            variant="outline"
            onClick={() => handleTabChange('stats')}
            className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest bg-white shadow-sm hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          
          <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
            {(['All', 'Pending', 'Accepted', 'Completed', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === status 
                    ? 'bg-navy text-white shadow-lg' 
                    : 'text-gray-400 hover:text-navy hover:bg-gray-50'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto ml-auto">
          <Button 
             onClick={() => setIsManualBookingOpen(true)}
             className="bg-navy hover:bg-teal text-white h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Briefcase size={16} /> Create Manual Visit
          </Button>
        </div>

        <div className="relative flex-1 w-full xl:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search bookings by customer, phone or service..."
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm shadow-sm focus:ring-4 focus:ring-navy/5 outline-none transition-all placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-100">
            <TableRow>
              {/* Select All Checkbox Column */}
              <TableHead className="w-12 px-4 h-12 text-center">
                <input 
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all bookings"
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                />
              </TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Customer</TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Service</TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Price</TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Appointment</TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12 text-center">Status</TableHead>
              <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => {
              const userProfile = users.find(u => u.uid === booking.userId);
              const displayName = booking.userName || userProfile?.name || 'Customer';
              const displayPhone = booking.userPhone || userProfile?.phone || '';
              const displayWhatsapp = booking.whatsappNumber || userProfile?.whatsappNumber || displayPhone;
              const displayAddress = booking.userAddress || userProfile?.address || 'No Address Provided';
              const isSelected = selectedBookingIds.includes(booking.id);

              return (
                <TableRow 
                  key={booking.id} 
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none cursor-pointer",
                    isSelected && "bg-teal/5 hover:bg-teal/10"
                  )}
                  onClick={() => setSelectedBookingForDetails(booking)}
                >
                  {/* Row Checkbox */}
                  <TableCell className="w-12 px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleBookingSelection(booking.id, e as any)}
                      aria-label={`Select booking ${booking.id}`}
                      className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal accent-teal focus:ring-teal cursor-pointer transition-all"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-normal min-w-[200px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 leading-tight mb-1">{displayName}</span>
                      <div className="flex items-center gap-2 mb-1">
                         <a 
                           href={`tel:${displayPhone}`} 
                           onClick={(e) => e.stopPropagation()}
                           className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                         >
                           <Phone size={10} /> {displayPhone}
                         </a>
                         {(displayWhatsapp) && (
                           <a 
                             href={formatWhatsAppLink(displayWhatsapp)} 
                             onClick={(e) => e.stopPropagation()}
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1"
                           >
                             <MessageCircle size={10} /> WhatsApp
                           </a>
                         )}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px] font-medium">{displayAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-normal min-w-[150px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 leading-tight">{booking.serviceName}</span>
                      <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1">{booking.tier}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-black text-navy">₹{booking.price}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      {booking.appointmentDate ? (
                        <>
                          <span className="text-xs font-black text-navy">{safeDateFormatter(booking.appointmentDate || booking.timestamp)}</span>
                          <span className="text-[10px] font-bold text-teal uppercase tracking-tight">{booking.appointmentSlot}</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-start">
                          <Badge variant="outline" className="text-[8px] font-black uppercase text-amber-600 border-amber-200 bg-amber-50 animate-pulse mb-1">
                            ⚠️ Schedule Pending
                          </Badge>
                          <span className="text-[9px] text-gray-400 uppercase">Booked: {safeDateFormatter(booking.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge className={`rounded-lg uppercase text-[9px] font-black px-2 py-1 shadow-sm ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right whitespace-normal" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap justify-end gap-2 min-w-[140px]">
                       <motion.button 
                         whileTap={{ scale: 0.9 }}
                         className="h-8 w-8 text-navy rounded-lg flex items-center justify-center bg-teal/20"
                         onClick={(e) => {
                           e.stopPropagation();
                           navigate('/admin/invoice-generator', { state: { booking: booking } });
                         }}
                         title="Generate Invoice"
                       >
                         <FileText size={14} />
                       </motion.button>

                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          className="h-8 w-8 text-blue-600 rounded-lg flex items-center justify-center bg-blue-50"
                          onClick={() => setSelectedBookingForDetails(booking)}
                          title="View Details"
                        >
                          <FileText size={14} />
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-white rounded-lg flex items-center justify-center bg-teal hover:bg-teal/90 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingToAssign(booking);
                            setPayoutAmount(Math.round(booking.price * 0.75));
                            setIsStaffModalOpen(true);
                          }}
                          title="Assign Staff"
                        >
                          <Briefcase size={12} className="mr-1.5" /> Assign
                        </motion.button>
                       <motion.button 
                         whileTap={{ scale: 0.9 }}
                         className="h-8 w-8 text-green-600 rounded-lg flex items-center justify-center bg-green-50"
                         onClick={() => {
                           const text = `Hi ${booking.userName}, regarding your booking for ${booking.serviceName} on ${booking.appointmentDate || 'ASAP'}...`;
                           window.open(formatWhatsAppLink(booking.whatsappNumber || booking.userPhone, text), '_blank');
                         }}
                       >
                         <MessageCircle size={14} />
                       </motion.button>
                       {booking.status === 'Pending' && (
                         <>
                           <button 
                             className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer" 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (!booking.appointmentDate) {
                                 setSelectedBookingForDetails(booking);
                                 toast.info('Please set a visit date first');
                               } else {
                                 updateBooking(booking.id, { status: 'Accepted' });
                               }
                             }} 
                             title="Accept"
                           >
                             <CheckCircle size={16} />
                           </button>
                           <button className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'In Progress' }); }} title="Start Work"><Clock size={16} /></button>
                           <button className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'Rejected' }); }} title="Reject"><XCircle size={16} /></button>
                         </>
                       )}
                       {['Accepted', 'In Progress'].includes(booking.status) && (
                         <div className="flex gap-1">
                           {booking.status === 'Accepted' && (
                             <button className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'In Progress' }); }} title="In Progress"><Clock size={16} /></button>
                           )}
                           <button className="h-8 px-3 border border-navy/20 text-navy font-black text-[10px] uppercase rounded-lg hover:bg-navy hover:text-white transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'Completed' }); }}>Done</button>
                         </div>
                       )}
                       <button 
                         className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-red-50 transition-colors cursor-pointer" 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           setBookingToDeleteId(booking.id);
                         }} 
                         title="Delete"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                      <Calendar size={32} />
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No bookings found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-8">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">
              Delete {selectedBookingIds.length} Selected Bookings?
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium mt-2">
              Are you sure you want to permanently delete these <span className="font-bold text-navy">{selectedBookingIds.length}</span> booking(s)? This action cannot be undone and will permanently remove all selected records from the database and server.
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
              {isBulkDeleting ? 'Deleting...' : `Delete All (${selectedBookingIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
