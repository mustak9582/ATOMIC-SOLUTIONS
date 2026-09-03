import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabStats.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TabsContent } from '../ui/tabs';
import { motion } from 'motion/react';
import { Users, Calendar, Clock, IndianRupee, FileText, Layers, Briefcase, ImageIcon, Settings, TrendingUp, ChevronRight } from 'lucide-react';
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
      <div className={\`w-16 h-16 rounded-3xl \${color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-navy/10\`}>
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
      
      <div className={\`absolute bottom-0 left-0 h-1 \${color} w-0 group-hover:w-full transition-all duration-500\`} />
    </motion.div>
  );
}

export function StatCard({ title, value, icon, change, color, onClick }: { title: string, value: string | number, icon: React.ReactNode, change?: string, color?: string, onClick?: () => void }) {
  return (
    <Card 
      onClick={onClick}
      className={\`rounded-[32px] border-none shadow-xl shadow-navy/5 p-6 bg-white flex items-center gap-5 \${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all' : ''}\`}
    >
      <div className={\`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg \${color}\`}>
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
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabStats.tsx', header + content + footer);
console.log('Successfully wrapped TabStats');
