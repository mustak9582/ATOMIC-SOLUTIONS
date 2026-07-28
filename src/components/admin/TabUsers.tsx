import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { ArrowLeft, Search, MapPin, CheckCircle, XCircle, ShieldCheck, LockIcon, Edit, FileText, Trash2, Users, MessageCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { maskPhone, maskEmail, safeDateFormatter } from '../../lib/utils';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';

export interface TabUsersProps {
  users: UserProfile[];
  userSearchTerm: string;
  setUserSearchTerm: (val: string) => void;
  userRoleFilter: 'All' | 'Admin' | 'Staff' | 'Customer';
  setUserRoleFilter: (val: 'All' | 'Admin' | 'Staff' | 'Customer') => void;
  handleTabChange: (tab: string) => void;
  viewUserHistory: (user: UserProfile) => void;
  approveStaff: (uid: string) => void;
  rejectStaff: (uid: string) => void;
  toggleBlockUser: (uid: string, currentStatus: boolean) => void;
  handleEditUser: (user: UserProfile) => void;
  confirmDelete: (user: UserProfile) => void;
}

export function TabUsers({
  users,
  userSearchTerm,
  setUserSearchTerm,
  userRoleFilter,
  setUserRoleFilter,
  handleTabChange,
  viewUserHistory,
  approveStaff,
  rejectStaff,
  toggleBlockUser,
  handleEditUser,
  confirmDelete
}: TabUsersProps) {
  return (
          <TabsContent value="users" id="users">
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
              <Button 
                variant="outline"
                onClick={() => handleTabChange('stats')}
                className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest bg-white"
              >
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search users by name, phone or email..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
                {(['All', 'Admin', 'Staff', 'Customer'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      userRoleFilter === role 
                        ? 'bg-navy text-white shadow-lg' 
                        : 'text-gray-400 hover:text-navy'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                  <TableRow>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">User Details</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">Contact & Logic</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">Address & Live Spot</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 text-center">Role</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(u => {
                      const userName = u.name || '';
                      const userEmail = u.email || '';
                      const userPhone = u.phone || '';
                      
                      const matchesSearch = 
                        userName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        userPhone.includes(userSearchTerm) ||
                        userEmail.toLowerCase().includes(userSearchTerm.toLowerCase());
                      
                      const matchesRole = 
                        userRoleFilter === 'All' ||
                        (userRoleFilter === 'Admin' && u.isAdmin) ||
                        (userRoleFilter === 'Staff' && u.isStaff) ||
                        (userRoleFilter === 'Customer' && !u.isAdmin && !u.isStaff);
                      
                      return matchesSearch && matchesRole;
                    })
                    .map((user) => (
                    <TableRow 
                      key={user.uid} 
                      className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none cursor-pointer"
                      onClick={() => viewUserHistory(user)}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/5 text-navy flex items-center justify-center font-bold text-xs ring-1 ring-navy/10">
                            {(user.name || 'C')[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{user.name || 'Customer'}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              ID: {user.uid.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col text-sm font-medium text-gray-600">
                          <span className="flex items-center gap-2">{user.phone} {user.whatsappNumber && <MessageCircle size={10} className="text-green-500"/>}</span>
                          <span className="text-[11px] opacity-70 mb-1">{user.email}</span>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded">
                            Last: {safeDateFormatter(user.lastLoginAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                          <span className="text-xs font-medium text-gray-500 truncate">{user.address || 'No Address stored'}</span>
                          {user.location && (
                            <a 
                              href={`https://www.google.com/maps?q=${user.location.lat},${user.location.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[9px] font-black text-teal uppercase tracking-widest mt-1 flex items-center gap-1 hover:underline"
                            >
                              <MapPin size={10} /> View Live Spot
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex gap-2 items-center flex-wrap">
                          {user.isAdmin ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Admin</Badge> : <Badge variant="outline">User</Badge>}
                          {user.isStaff && (
                            <Badge className={`${user.staffStatus === 'approved' ? 'bg-teal text-navy' : 'bg-orange-100 text-orange-700'} hover:opacity-80`}>
                              {user.staffStatus === 'approved' ? 'Pro Staff' : 'Pending Staff'}
                            </Badge>
                          )}
                          {user.isBlocked && <Badge className="bg-red-100 text-red-700">Blocked</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 flex-wrap max-w-[200px] ml-auto">
                          {user.isStaff && user.staffStatus === 'pending' && (
                            <>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-green-600 hover:bg-green-50" 
                                onClick={() => approveStaff(user.uid)}
                                title="Approve Staff"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-orange-600 hover:bg-orange-50" 
                                onClick={() => rejectStaff(user.uid)}
                                title="Reject Staff"
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`${user.isStaff ? 'text-teal bg-teal/5' : 'text-gray-400'} hover:bg-teal/10`} 
                            onClick={async () => {
                              try {
                                await dataService.updateDoc('users', user.uid, { 
                                  isStaff: !user.isStaff,
                                  staffStatus: !user.isStaff ? 'pending' : null 
                                });
                                toast.success(user.isStaff ? 'Removed from staff' : 'Marked as professional staff');
                              } catch (e) {
                                toast.error('Check your internet connection or firestore setup');
                              }
                            }}
                            title={user.isStaff ? "Remove from Staff" : "Mark as Staff"}
                          >
                            <ShieldCheck size={16} />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`${user.isBlocked ? 'text-red-600 bg-red-50' : 'text-gray-400'} hover:bg-red-100`} 
                            onClick={() => toggleBlockUser(user.uid, !!user.isBlocked)}
                            title={user.isBlocked ? "Unblock User" : "Block User"}
                          >
                            <LockIcon size={16} />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-navy hover:bg-gray-100" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            }}
                            title="Edit Profile"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-blue-600 hover:bg-blue-50" 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewUserHistory(user);
                            }}
                            title="View History"
                          >
                            <FileText size={16} />
                          </Button>
                          {!user.isAdmin && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-600 hover:bg-red-50" 
                              onClick={() => confirmDelete(user)}
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                            <Users size={32} />
                          </div>
                          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No users discovered yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
  );
}
