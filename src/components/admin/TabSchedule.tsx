import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { ArrowLeft, Calendar, Plus, Clock, UserCircle, MapPin, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';

export interface TabScheduleProps {
  handleTabChange: (tab: string) => void;
  setIsManualBookingOpen: (isOpen: boolean) => void;
  bookings: Booking[];
  todayStr: string;
  setSelectedBookingForDetails: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
}

export function TabSchedule({
  handleTabChange,
  setIsManualBookingOpen,
  bookings,
  todayStr,
  setSelectedBookingForDetails,
  updateBooking
}: TabScheduleProps) {
  return (
                  <TabsContent value="schedule" id="schedule">
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost"
                    onClick={() => handleTabChange('stats')}
                    className="p-3 hover:bg-gray-50 rounded-2xl"
                  >
                    <ArrowLeft size={20} className="text-navy" />
                  </Button>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                      Visit Center
                      <Badge className="bg-indigo-50 text-indigo-600 border-none font-black px-3 py-1 rounded-lg">LIVE</Badge>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage all active and requested field visits</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl">
                      <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2">
                        <Calendar size={14} /> Schedule
                      </div>
                      <div className="px-5 py-2.5 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-navy cursor-pointer transition-colors" onClick={() => handleTabChange('bookings')}>Requests</div>
                   </div>
                   <Button 
                      onClick={() => setIsManualBookingOpen(true)}
                      className="bg-navy hover:bg-teal text-white h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy/20 transition-all flex items-center gap-2"
                   >
                     <Plus size={18} /> Create Manual Visit
                   </Button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Left Column: Today & Pending */}
                 <div className="lg:col-span-4 space-y-8">
                    {/* Today's Stats */}
                    <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-200 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Today's Visits</p>
                          <h4 className="text-4xl font-black">{bookings.filter(b => b.appointmentDate === todayStr).length}</h4>
                       </div>
                       <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center backdrop-blur-sm">
                          <Clock size={32} />
                       </div>
                    </div>

                    {/* Pending Confirmation (User Created) */}
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-navy uppercase tracking-widest px-2 flex items-center justify-between">
                          <span>Awaiting Approval</span>
                          <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px]">{bookings.filter(b => b.status === 'Pending').length}</Badge>
                       </h3>
                       <div className="space-y-3">
                          {bookings.filter(b => b.status === 'Pending').length === 0 ? (
                            <div className="bg-gray-50/50 p-8 rounded-[32px] border border-dashed border-gray-200 text-center">
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">No new requests</p>
                            </div>
                          ) : (
                            bookings
                              .filter(b => b.status === 'Pending')
                              .slice(0, 5)
                              .map(req => (
                                <div key={req.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:border-teal/30 transition-all cursor-pointer group" onClick={() => setSelectedBookingForDetails(req)}>
                                   <div className="flex items-center gap-4 mb-4">
                                      <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
                                         <UserCircle size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[11px] font-black text-navy uppercase tracking-tight truncate">{req.userName}</p>
                                         <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                                            <Calendar size={10} /> {req.appointmentDate || 'No Date set'}
                                         </div>
                                      </div>
                                      <Badge className="bg-teal text-navy text-[8px] font-black px-2 py-0.5 rounded-md uppercase">Pending</Badge>
                                   </div>
                                   <div className="flex gap-2">
                                      <Button 
                                         className="flex-1 h-9 rounded-xl bg-teal/10 hover:bg-teal text-teal hover:text-white text-[9px] font-black uppercase transition-all"
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBookingForDetails(req);
                                         }}
                                      >
                                         Review & Approve
                                      </Button>
                                   </div>
                                </div>
                              ))
                          )}
                          {bookings.filter(b => b.status === 'Pending').length > 5 && (
                             <Button variant="ghost" className="w-full text-[9px] font-black uppercase text-gray-400 hover:text-navy" onClick={() => handleTabChange('bookings')}>View All Requests</Button>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Timeline */}
                 <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-sm font-black text-navy uppercase tracking-widest px-2 flex items-center gap-3">
                       Confirmed Schedule
                       <div className="h-px flex-1 bg-gray-100" />
                    </h3>
                    
                    <div className="bg-white rounded-[40px] shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden">
                       <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                          <div className="flex gap-4">
                             <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-[10px] font-black text-navy uppercase tracking-widest">Upcoming</div>
                             <div className="px-5 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-navy cursor-pointer transition-colors">By Pro</div>
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total: {bookings.filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected').length} Confirmed</div>
                       </div>
                       
                       <Table>
                          <TableHeader className="bg-white">
                             <TableRow className="hover:bg-transparent border-b-gray-50">
                                <TableHead className="text-[10px] font-black uppercase px-8 h-12">Client & Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase h-12">Schedule</TableHead>
                                <TableHead className="text-[10px] font-black uppercase h-12">Assigned To</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right px-8 h-12">Action</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {bookings
                               .filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected')
                               .sort((a,b) => {
                                 const tA = new Date(a.appointmentDate || 0).getTime();
                                 const tB = new Date(b.appointmentDate || 0).getTime();
                                 return tA - tB;
                               })
                               .map(visit => (
                                 <TableRow key={visit.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer border-b-gray-50/50" onClick={() => setSelectedBookingForDetails(visit)}>
                                    <TableCell className="px-8 py-7">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${visit.status === 'In Progress' ? 'bg-blue-600 animate-pulse shadow-lg shadow-blue-200' : 'bg-navy shadow-sm'}`}>
                                             {visit.status === 'In Progress' ? <Clock size={18} /> : <Calendar size={18} />}
                                          </div>
                                          <div className="min-w-0">
                                             <div className="font-black text-navy text-sm uppercase tracking-tight truncate max-w-[150px]">{visit.serviceName || 'Maintenance Job'}</div>
                                             <div className="text-[10px] text-teal font-bold uppercase tracking-widest mt-0.5">{visit.userName}</div>
                                             <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1">
                                                <MapPin size={8} /> {visit.userAddress}
                                             </div>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="space-y-1.5">
                                          <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] px-3 py-1 uppercase rounded-lg">
                                             {new Date(visit.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </Badge>
                                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{visit.appointmentSlot}</div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       {visit.staffName ? (
                                          <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 rounded-lg bg-teal text-navy flex items-center justify-center font-black text-[9px]">{visit.staffName?.[0]}</div>
                                             <div className="text-[10px] font-black text-navy uppercase truncate max-w-[100px]">{visit.staffName}</div>
                                          </div>
                                       ) : (
                                          <Badge variant="outline" className="text-[8px] font-black uppercase text-red-400 border-red-100">Unassigned</Badge>
                                       )}
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                       <div className="flex justify-end gap-2 px-1">
                                          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-xl text-gray-300 hover:text-indigo-600 hover:bg-white shadow-sm border border-transparent hover:border-gray-100" title="Reschedule">
                                             <Clock size={16} />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-xl text-gray-300 hover:text-teal hover:bg-white shadow-sm border border-transparent hover:border-gray-100" onClick={(e) => {
                                             e.stopPropagation();
                                             updateBooking(visit.id, { status: 'Completed' });
                                          }} title="Complete">
                                             <CheckCircle size={16} />
                                          </Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ))
                             }
                             {bookings.filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected').length === 0 && (
                               <TableRow>
                                 <TableCell colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-10">
                                       <Calendar size={64} className="text-navy" />
                                       <p className="text-lg font-black uppercase tracking-[0.4em]">Schedule Clear</p>
                                    </div>
                                 </TableCell>
                               </TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </div>
                 </div>
              </div>
            </div>
          </TabsContent>
  );
}
