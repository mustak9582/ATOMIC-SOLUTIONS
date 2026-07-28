import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, Clock, FileText, Home, Image as ImageIcon, IndianRupee, Layers, LayoutDashboard, MessageCircle, Settings, ShoppingCart, Users, Briefcase, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  onClose?: () => void;
}

const navItems = [
  { id: 'stats', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'schedule', label: 'Visit schedule', icon: Clock },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'users', label: 'Customers', icon: Users },
  { id: 'staff', label: 'Professionals', icon: Briefcase },
  { id: 'billing', label: 'Billing', icon: IndianRupee },
  { id: 'pricing', label: 'Services & pricing', icon: Layers },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'store', label: 'Store', icon: ShoppingCart },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'reports', label: 'Reports', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar = ({ activeTab, onTabChange, className, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  return (
    <aside className={cn('flex h-full flex-col border-r border-slate-200 bg-white text-navy', className)}>
      <div className="flex items-center justify-between px-6 pb-5 pt-7">
        <div className="min-w-0"><Logo size="sm" /></div>
        {onClose && <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden"><X size={19} /></Button>}
      </div>

      <div className="px-4 pb-3"><button onClick={() => navigate('/')} className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal/10 hover:text-teal"><Home size={16} />View website</button></div>
      <div className="px-6 pb-2 pt-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Operations</div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6" aria-label="Admin navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { onTabChange(id); onClose?.(); }} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors', activeTab === id ? 'bg-teal/10 font-bold text-teal' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-navy')}><Icon size={17} strokeWidth={activeTab === id ? 2.4 : 2} />{label}</button>)}
      </nav>
      <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold text-navy">Atomic Solutions</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">Founder: Mustak Ansari</p></div>
    </aside>
  );
};
