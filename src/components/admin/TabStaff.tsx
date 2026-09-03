import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TabsContent } from '../ui/tabs';
import { MapPin, CheckCircle, XCircle, Unlock, LockIcon } from 'lucide-react';
import { UserProfile, Booking } from '../../types';
import { formatWhatsAppLink, maskPhone, maskEmail } from '../../lib/utils';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';

export interface TabStaffProps {
  staffFilter: 'All' | 'Pending' | 'Approved';
  setStaffFilter: (filter: 'All' | 'Pending' | 'Approved') => void;
  users: UserProfile[];
  bookings: Booking[];
  approveStaff: (uid: string) => void;
  rejectStaff: (uid: string) => void;
  viewUserHistory: (user: UserProfile) => void;
  toggleBlockUser: (uid: string, currentStatus: boolean) => void;
  confirmDelete: (user: UserProfile) => void;
  setIsManualBookingOpen: (isOpen: boolean) => void;
  setManualBookingData: React.Dispatch<React.SetStateAction<any>>;
}

export function TabStaff({
  staffFilter,
  setStaffFilter,
  users,
  bookings,
  approveStaff,
  rejectStaff,
  viewUserHistory,
  toggleBlockUser,
  confirmDelete,
  setIsManualBookingOpen,
  setManualBookingData
}: TabStaffProps) {
  return (
          <TabsContent value="staff" id="staff" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50/10 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Professional Staff Manager</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Assignments, Performance & Approval</p>
                </div>
                <div className="flex gap-4 items-center">
                              <div className="flex bg-white p-1 rounded-2xl border border-gray-200">
                                <button 
                                  onClick={() => setStaffFilter('All')} 
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${staffFilter === 'All' ? 'bg-navy text-white shadow-lg' : 'text-gray-400'}`}
                                >
                                  All
                                </button>
                                <button 
                                  onClick={() => setStaffFilter('Pending')} 
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${staffFilter === 'Pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'}`}
                                >
                                  Requests ({users.filter(u => u.isStaff && u.staffStatus === 'pending').length})
                                </button>
                                <button 
                                  onClick={() => setStaffFilter('Approved')} 
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${staffFilter === 'Approved' ? 'bg-teal text-navy shadow-lg' : 'text-gray-400'}`}
                                >
                                  Active Professional
                                </button>
                              </div>
                  <Badge className="bg-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 flex items-center">
                    {users.filter(u => u.isStaff).length} Total
                  </Badge>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users
                    .filter(u => {
                      if (!u.isStaff) return false;
                      if (staffFilter === 'Pending') return u.staffStatus === 'pending';
                      if (staffFilter === 'Approved') return u.staffStatus === 'approved';
                      return true;
                    })
                    .map(staff => {
                    const staffJobs = bookings.filter(b => b.staffId === staff.uid);
                    const completedJobs = staffJobs.filter(b => b.status === 'Completed');
                    const activeJobs = staffJobs.filter(b => b.status === 'Accepted' || b.status === 'In Progress');
                    const totalPayout = completedJobs.reduce((sum, b) => sum + (b.payoutAmount || 0), 0);

                    return (
                      <Card key={staff.uid} className={`rounded-[32px] border-none shadow-xl shadow-gray-50 p-6 bg-white hover:scale-[1.02] transition-all relative ${staff.isBlocked ? 'opacity-60 grayscale' : ''}`}>
                        {staff.isBlocked && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge className="bg-red-500 text-white border-none uppercase text-[8px] font-black tracking-widest">Blocked</Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white text-lg font-black relative">
                              {staff.name.charAt(0)}
                              {staff.staffStatus === 'pending' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white ring-1 ring-orange-500/20" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-navy uppercase tracking-tight">{staff.name}</h4>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] font-bold text-teal uppercase tracking-widest">{staff.staffCategory || 'General Service'}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <MapPin size={10} /> {staff.workArea || 'Multiple Areas'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {staff.location && !staff.isBlocked && (
                            <Badge className="bg-green-50 text-green-600 border-none animate-pulse">Live</Badge>
                          )}
                        </div>

                        <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">WhatsApp</span>
                            <a 
                              href={formatWhatsAppLink(staff.whatsappNumber || staff.phone)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-green-600 hover:underline"
                            >
                              {staff.whatsappNumber ? staff.whatsappNumber : staff.phone}
                            </a>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">Email</span>
                            <span className="text-navy truncate max-w-[140px]">{staff.email || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 p-3 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Active</p>
                            <p className="text-sm font-black text-navy">{activeJobs.length} Jobs</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Earned</p>
                            <p className="text-sm font-black text-teal">₹{totalPayout.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {staff.staffStatus === 'pending' ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                className="h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest"
                                onClick={() => approveStaff(staff.uid)}
                              >
                                <CheckCircle size={14} className="mr-2" /> Approve
                              </Button>
                              <Button 
                                className="h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase tracking-widest"
                                onClick={() => rejectStaff(staff.uid)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                className="h-10 rounded-xl bg-teal/10 hover:bg-teal text-teal hover:text-white text-[10px] font-black uppercase tracking-widest"
                                onClick={() => viewUserHistory(staff)}
                              >
                                View History
                              </Button>
                              <Button 
                                className="h-10 rounded-xl bg-navy hover:bg-navy/90 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                                onClick={() => {
                                  setManualBookingData((prev: any) => ({
                                    ...prev,
                                    staffId: staff.uid,
                                    staffName: staff.name,
                                    serviceName: staff.staffCategory || 'General Maintenance'
                                  }));
                                  setIsManualBookingOpen(true);
                                }}
                              >
                                + Assign Work
                              </Button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="ghost" 
                              className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest ${staff.isBlocked ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}
                              onClick={() => toggleBlockUser(staff.uid, !!staff.isBlocked)}
                            >
                              {staff.isBlocked ? (
                                <><Unlock size={14} className="mr-2" /> Unblock</>
                              ) : (
                                <><LockIcon size={14} className="mr-1" /> Block Staff</>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50"
                              onClick={() => confirmDelete(staff)}
                            >
                              Delete Account
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-navy"
                              onClick={async () => {
                                if (confirm('Remove this user from professional staff?')) {
                                  await dataService.updateDoc('users', staff.uid, { 
                                    isStaff: false,
                                    staffStatus: null 
                                  });
                                  toast.success('Staff role removed');
                                }
                              }}
                            >
                              Revoke Staff
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {users.filter(u => u.isStaff).length === 0 && (
                    <div className="lg:col-span-3 py-20 text-center">
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No professional staff assigned. Add from user list.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
  );
}
