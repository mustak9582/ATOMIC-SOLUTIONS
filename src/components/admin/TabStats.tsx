import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TabsContent } from '../ui/tabs';
import { motion } from 'motion/react';
import { Users, Calendar, Clock, IndianRupee, FileText, Layers, Briefcase, ImageIcon, Settings, TrendingUp, ChevronRight, ShoppingCart } from 'lucide-react';
import { UserProfile, Booking } from '../../types';
import { maskPhone } from '../../lib/utils';

export function AdminTile({ title, desc, icon, color, onClick, badge }: { title: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void; badge?: number }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-8 rounded-[40px] shadow-xl shadow-navy/5 border border-gray-100 flex flex-col items-start text-left group cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden"
    >
      <div className={`w-16 h-16 rounded-3xl ${color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-navy/10`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-2">{title}</h3>
      <p className="text-xs font-medium text-gray-400 leading-relaxed">{desc}</p>
      
      {badge ? (
        <span className="absolute top-8 right-8 w-8 h-8 bg-orange-500 text-white text-xs font-black rounded-2xl flex items-center justify-center border-4 border-white shadow-lg animate-pulse">
          {badge}
        </span>
      ) : null}

      <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-teal uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Manage Now <ChevronRight size={12} />
      </div>
      
      <div className={`absolute bottom-0 left-0 h-1 ${color} w-0 group-hover:w-full transition-all duration-500`} />
    </motion.div>
  );
}

export function StatCard({ title, value, icon, change, color, onClick }: { title: string, value: string | number, icon: React.ReactNode, change?: string, color?: string, onClick?: () => void }) {
  return (
    <Card 
      onClick={onClick}
      className={`rounded-[32px] border-none shadow-xl shadow-navy/5 p-6 bg-white flex items-center gap-5 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-navy tracking-tighter mt-1 leading-none">{value}</p>
        {change && (
          <span className="text-[10px] font-bold text-teal mt-2 block">{change}</span>
        )}
      </div>
    </Card>
  );
}

export interface TabStatsProps {
  users: UserProfile[];
  bookings: Booking[];
  allInvoices: any[];
  setUserRoleFilter: (filter: 'All' | 'Admin' | 'Staff' | 'Customer') => void;
  setStatusFilter: (filter: any) => void;
  handleTabChange: (tab: string) => void;
  setSelectedUserForHistory: (user: UserProfile) => void;
  setIsHistoryModalOpen: (isOpen: boolean) => void;
}

export function TabStats({
  users,
  bookings,
  allInvoices,
  setUserRoleFilter,
  setStatusFilter,
  handleTabChange,
  setSelectedUserForHistory,
  setIsHistoryModalOpen
}: TabStatsProps) {
  return (
            <TabsContent value="stats" className="space-y-10 m-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Active Users" value={users.length} icon={<Users />} color="bg-blue-600" onClick={() => { setUserRoleFilter('All'); handleTabChange('users'); }} />
                <StatCard title="Total Orders" value={bookings.length} icon={<Calendar />} color="bg-navy" onClick={() => { setStatusFilter('All'); handleTabChange('bookings'); }} />
                <StatCard title="Pending Review" value={bookings.filter(b => b.status === 'Pending').length} icon={<Clock />} color="bg-teal" onClick={() => { setStatusFilter('Pending'); handleTabChange('bookings'); }} />
                <StatCard title="Live Revenue" value={`₹${allInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString('en-IN')}`} icon={<IndianRupee />} color="bg-green-600" onClick={() => handleTabChange('billing')} />
              </div>

              {/* Action Tiles Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 <AdminTile 
                    title="Invoice Builder" 
                    desc="Billing Tool"
                    icon={<FileText className="w-5 h-5" />}
                    color="bg-navy"
                    onClick={() => handleTabChange('billing')}
                 />
                 <AdminTile 
                    title="Service Pricing" 
                    desc="Rates Mgmt"
                    icon={<Layers className="w-5 h-5" />}
                    color="bg-teal"
                    onClick={() => handleTabChange('pricing')}
                 />
                 <AdminTile 
                    title="Staff Portal" 
                    desc="Manage Team"
                    icon={<Briefcase className="w-5 h-5" />}
                    color="bg-blue-600"
                    onClick={() => handleTabChange('staff')}
                 />
                 <AdminTile 
                    title="Users" 
                    desc="Profiles"
                    icon={<Users className="w-5 h-5" />}
                    color="bg-orange-500"
                    onClick={() => handleTabChange('users')}
                 />
                 <AdminTile 
                    title="Media" 
                    desc="Showcase"
                    icon={<ImageIcon className="w-5 h-5" />}
                    color="bg-rose-500"
                    onClick={() => handleTabChange('gallery')}
                 />
                 <AdminTile 
                    title="Settings" 
                    desc="App Config"
                    icon={<Settings className="w-5 h-5" />}
                    color="bg-gray-600"
                    onClick={() => handleTabChange('settings')}
                 />
                 <AdminTile 
                    title="Store" 
                    desc="E-commerce"
                    icon={<ShoppingCart className="w-5 h-5" />}
                    color="bg-purple-600"
                    onClick={() => handleTabChange('store')}
                 />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[40px] border-none shadow-2xl shadow-gray-200/50 p-8 bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <TrendingUp size={24} className="text-teal" /> Revenue & Booking Trends
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-3 px-4">
                      {[35, 45, 30, 60, 80, 55, 90, 45, 70, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-teal/5 rounded-t-2xl relative group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05 }}
                            className="absolute bottom-0 left-0 right-0 bg-teal rounded-t-2xl group-hover:bg-navy transition-all duration-500 shadow-sm"
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-navy text-white text-[8px] font-black px-2 py-1 rounded-md">
                            {h}% Growth
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 border-t border-gray-50 pt-4">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[40px] border-none shadow-2xl shadow-gray-200/50 p-8 bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                      <Users size={24} className="text-blue-600" /> New Users
                    </h3>
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-teal hover:bg-teal/5" onClick={() => handleTabChange('users')}>View All</Button>
                  </div>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-gray-100 rounded-3xl transition-all border border-transparent hover:border-gray-100 group">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-105 transition-transform">{u.name[0]}</div>
                           <div>
                             <div className="text-sm font-black text-navy uppercase tracking-tight">{u.name}</div>
                             <div className="text-[11px] font-bold text-gray-400 mt-0.5 tracking-tight">{u.phone || 'Registration pending'}</div>
                           </div>
                         </div>
                         <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 hover:bg-blue-50 text-blue-600" onClick={() => {
                           setSelectedUserForHistory(u);
                           setIsHistoryModalOpen(true);
                         }}><ChevronRight size={18} /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
  );
}
