import React from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Briefcase, 
  IndianRupee, 
  Layers, 
  Grid, 
  Star, 
  AlertTriangle, 
  Image as ImageIcon, 
  Settings,
  X,
  LayoutDashboard,
  Home,
  Clock,
  FileText,
  ArrowLeft,
  MessageCircle,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  onClose?: () => void;
}

const navItems = [
  { id: 'stats', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'schedule', label: 'Visit Schedule', icon: Clock },
  { id: 'invoices', label: 'Invoice Archive', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'billing', label: 'Billing Center', icon: IndianRupee },
  { id: 'pricing', label: 'Pricing', icon: Layers },
  { id: 'staff', label: 'Staff Portal', icon: Briefcase },
  { id: 'gallery', label: 'Media Hub', icon: ImageIcon },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'reports', label: 'Reports', icon: AlertTriangle },
  { id: 'store', label: 'Store Manager', icon: ShoppingCart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar = ({ activeTab, onTabChange, className, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { toggleAdminView, viewAsCustomer } = useAuth();

  return (
    <div className={cn("flex flex-col h-full bg-[#001f3f] text-white", className)}>
      <div className="p-8 pb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal flex items-center justify-center shadow-lg shadow-teal/20">
            <Layers className="text-navy" size={22} />
          </div>
          <div>
            <span className="block font-black uppercase tracking-tight text-lg leading-none">Atomic Solutions Admin</span>
            <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-teal mt-1">Professional Solutions</span>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-white hover:bg-white/10 rounded-xl">
            <X size={20} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
        <div className="mb-6">
          <button
            onClick={() => {
              if (!viewAsCustomer) toggleAdminView();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-teal font-black bg-teal/10 border border-teal/30 hover:bg-teal hover:text-navy group shadow-sm"
            title="Preview website exactly as customers see it"
          >
            <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center text-teal group-hover:bg-navy group-hover:text-teal transition-colors">
              <Eye size={18} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-widest leading-none mb-1">Preview Website</span>
              <span className="block text-[8px] font-bold text-teal/70 group-hover:text-navy/70 uppercase tracking-wider">Customer View</span>
            </div>
          </button>
        </div>
        
        <div className="px-4 py-2 mb-2 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-teal">Management Systems</p>
          <div className="h-px flex-1 bg-teal/10 ml-3" />
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              if (onClose) onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-teal text-navy font-black shadow-xl shadow-teal/10 translate-x-2" 
                : "text-gray-400 hover:text-white hover:bg-white/5 font-bold"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-transform duration-300",
              activeTab === item.id ? "text-navy scale-110" : "group-hover:text-teal group-hover:scale-110"
            )} />
            <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-navy shadow-sm" />
            )}
          </button>
        ))}
      </div>


    </div>
  );
};
