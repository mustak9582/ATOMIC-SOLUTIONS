import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  User, 
  MapPin, 
  Phone as WhatsApp,
  Phone,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Package,
  ArrowRight,
  Briefcase,
  X,
  Bell,
  Star,
  CheckSquare,
  Home,
  LayoutGrid,
  Info,
  Video as VideoIcon,
  LogOut,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import Logo from './Logo';
import { Notification, Service, Category } from '../types';
import { CORE_SERVICES, DEFAULT_CATEGORIES } from '../constants';
import { formatWhatsAppLink, safeDateFormatter, safeTimeFormatter } from '../lib/utils';
import DirectBookingModal from './DirectBookingModal';
import CategoriesModal from './CategoriesModal';
import ReportIssue from './ReportIssue';

export default function UserDashboard({ initialSection }: { initialSection?: 'bookings' | 'invoices' | 'services' | 'reports' }) {
  const { user, profile, updateProfile, logout, isPendingStaff } = useAuth();
  const navigate = useNavigate();
  const [activePortalTab, setActivePortalTab] = useState<'overview' | 'services' | 'settings' | 'reports' | 'staff' | 'history'>(
    initialSection === 'services' ? 'services' : 
    initialSection === 'reports' ? 'reports' : 
    'overview'
  );

  const handleTabChange = (tab: 'overview' | 'services' | 'settings' | 'reports' | 'staff' | 'history') => {
    setActivePortalTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [bookings, setBookings] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Services related state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isDirectBookingOpen, setIsDirectBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL'} | null>(null);
  
  // Profile form state
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsappNumber || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setWhatsappNumber(profile.whatsappNumber || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      const unsubBookings = dataService.subscribe('bookings', (data) => {
        try {
          const sorted = (data as any[]).sort((a,b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
          });
          setBookings(sorted);
        } catch (err) {
          console.error("Sort failed", err);
          setBookings(data as any[]);
        }
        setLoading(false);
      }, [{ field: 'userId', operator: '==', value: user.uid }]);

      // Safety timeout for bookings loading
      const bookingTimeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      let unsubStaffJobs = () => {};
      if (profile?.isStaff) {
        unsubStaffJobs = dataService.subscribe('bookings', (data) => {
          setStaffAssignments((data as any[]).sort((a,b) => {
            const tA = new Date(a.timestamp || 0).getTime();
            const tB = new Date(b.timestamp || 0).getTime();
            return tB - tA;
          }));
        }, [{ field: 'staffId', operator: '==', value: user.uid }]);
      }

      const unsubInvoices = dataService.subscribe('invoices', (data) => {
        setInvoices((data as any[]).sort((a,b) => {
          const tA = new Date(a.date || a.timestamp || 0).getTime();
          const tB = new Date(b.date || b.timestamp || 0).getTime();
          return tB - tA;
        }));
      }, [{ field: 'userId', operator: '==', value: user.uid }]);

      const unsubNotifs = dataService.subscribe('notifications', (data) => {
        setNotifications((data as any[]).sort((a,b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        }));
      }, [{ field: 'userId', operator: '==', value: user.uid }]);

      const unsubServices = dataService.subscribe('services', (data) => {
        if (data && data.length > 0) {
          const merged = [...CORE_SERVICES];
          (data as Service[]).forEach(fsService => {
            const index = merged.findIndex(s => s.id === fsService.id);
            if (index !== -1) {
              merged[index] = { ...merged[index], ...fsService };
            } else {
              merged.push(fsService);
            }
          });
          setServices(merged);
        } else {
          setServices(CORE_SERVICES);
        }
      });

      const unsubCategories = dataService.subscribe('categories', (data) => {
        if (data && data.length > 0) {
          const merged = [...DEFAULT_CATEGORIES];
          (data as Category[]).forEach(fsCat => {
            const index = merged.findIndex(c => c.id === fsCat.id);
            if (index !== -1) {
              merged[index] = { ...merged[index], ...fsCat };
            } else {
              merged.push(fsCat);
            }
          });
          setCategories(merged);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      });

      const unsubReports = dataService.subscribe('reports', (data) => {
        setReports((data as any[]).sort((a,b) => {
          const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return tB - tA;
        }));
      }, [{ field: 'userId', operator: '==', value: user.uid }]);

      const unsubSettings = dataService.subscribe('settings', (data) => {
        if (data && data.length > 0) setSettings(data[0]);
      });

      return () => {
        unsubBookings();
        unsubStaffJobs();
        unsubInvoices();
        unsubNotifs();
        unsubServices();
        unsubCategories();
        unsubReports();
        unsubSettings();
      };
    }
  }, [user]);

  const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => {
    setBookingData({ subName, type });
    setIsCategoriesOpen(false);
    setIsDirectBookingOpen(true);
  };

  const markNotifRead = async (id: string) => {
    try {
      await dataService.updateDoc('notifications', id, { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await dataService.deleteDoc('notifications', id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (initialSection) {
      const element = document.getElementById(`${initialSection}-section`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection, loading]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({ phone, whatsappNumber, address });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    toast.info('Generating PDF...', { duration: 2000 });

    // Header Branding
    const logoUrl = settings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
    
    // Add Logo if available
    try {
      doc.addImage(logoUrl, 'PNG', 15, 12, 18, 18);
    } catch (e) {
      // Fallback logo drawing
      doc.setDrawColor(0, 31, 63);
      doc.setLineWidth(0.5);
      doc.line(15, 12, 25, 25);
      doc.line(25, 25, 35, 12);
      doc.line(15, 25, 35, 25);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const addressStr = settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
    doc.text(addressStr, pageWidth / 2, 26, { align: 'center' });
    
    if (settings?.ownerGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${settings.ownerGSTIN}`, pageWidth / 2, 31, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.text('WE BRING COMFORT LIFE', pageWidth - 20, 12, { align: 'right' });
    doc.text(`MOB:- ${settings?.phone || '9582268658'}`, pageWidth - 20, 18, { align: 'right' });

    // SL NO and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const slNoSuffix = (invoice.estimateNumber || invoice.invoiceNumber || '000-0').split('-').pop();
    const slNo = `SL NO:- ${invoice.type === 'Invoice' ? 'INV-' : 'EST-'}${slNoSuffix}`;
    doc.text(slNo, 20, 40);
    doc.text(`DATE:- ${new Date(invoice.date || invoice.timestamp).toLocaleDateString('en-IN')}`, pageWidth - 20, 40, { align: 'right' });

    // M/S Line
    doc.text(`M/S: ${invoice.customerName || '.............................................................................................................................................................................'}`, 20, 48);
    doc.line(28, 49, pageWidth - 20, 49);

    const tableData = [
      ...invoice.items.map((item: any, idx: number) => [
        idx + 1,
        item.description ? `${item.name}\n${item.description}` : item.name,
        item.quantity,
        item.rate.toLocaleString('en-IN'),
        (item.rate * item.quantity).toLocaleString('en-IN')
      ]),
      ['', 'TOTAL', '', '', (invoice.subTotal || invoice.totalAmount).toLocaleString('en-IN')]
    ];

    doc.autoTable({
      startY: 55,
      head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 4, 
        halign: 'left',
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' }
      },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (data.column.index === 1) data.cell.styles.halign = 'right';
        }
      },
      margin: { left: 15, right: 15 },
      bodyStyles: { minCellHeight: 10 }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // Table extensions
    if (finalY < pageHeight - 100) {
       const cols = [15, 30, pageWidth - 100, pageWidth - 80, pageWidth - 50, pageWidth - 15];
       cols.forEach(x => doc.line(x, finalY, x, pageHeight - 80));
       doc.line(15, pageHeight - 80, pageWidth - 15, pageHeight - 80);
       finalY = pageHeight - 80;
    }

    // Lower Section (GST & Grand Total)
    if (invoice.gstAmount || (invoice.roundOff && invoice.roundOff !== 0)) {
       let currentY = finalY + 5;
       doc.setFont('helvetica', 'bold');
       if (invoice.gstAmount) {
          doc.text(`GST (${invoice.gstPercentage}%)`, pageWidth - 50, currentY, { align: 'right' });
          doc.text(`${invoice.gstAmount.toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
          currentY += 8;
       }
       if (invoice.roundOff) {
          doc.text(`ADJUSTMENT`, pageWidth - 50, currentY, { align: 'right' });
          doc.text(`${invoice.roundOff.toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
          currentY += 8;
       }
       doc.setFontSize(11);
       doc.text(`GRAND TOTAL: ₹ ${invoice.totalAmount.toLocaleString('en-IN')}/-`, pageWidth - 20, currentY + 5, { align: 'right' });
    }

    // Footer
    const footerY = pageHeight - 50;
    
    // Draw thick border for footer
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    doc.text('BANK DETAILS:', 20, footerY);
    doc.setFont('helvetica', 'normal');
    const bankLines = doc.splitTextToSize(invoice.bankDetails || 'N/A', 80);
    doc.text(bankLines, 20, footerY + 5);

    // QR Code
    const upiID = "mustakansari9582-3@okhdfcbank";
    const qrText = `upi://pay?pa=${upiID}&pn=Mustak%20Ansari&am=${invoice.totalAmount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
    
    try {
      doc.addImage(qrUrl, 'PNG', 85, footerY - 3, 22, 22);
      doc.setFontSize(6);
      doc.text('SCAN TO PAY', 96, footerY + 22, { align: 'center' });
    } catch (e) {
      console.error('QR Code failed to load');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('FOR :- MUSTAK ANSARI', pageWidth - 20, footerY + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 25, { align: 'right' });

    const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
    doc.save(`${cleanFileName}.pdf`);
    toast.success('Invoice Downloaded Successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-navy font-bold animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 lg:pb-0">
      {/* Mobile Sidebar Toggle - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-navy/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-full flex gap-8 shadow-2xl">
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => navigate('/')} className="text-white/60 hover:text-teal transition-colors flex flex-col items-center gap-1">
          <Home size={20} />
          <span className="text-[8px] font-black uppercase">Home</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('overview')} className={`${activePortalTab === 'overview' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <LayoutGrid size={20} />
          <span className="text-[8px] font-black uppercase">Dash</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('history')} className={`${activePortalTab === 'history' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <Clock3 size={20} />
          <span className="text-[8px] font-black uppercase">Work</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('services')} className={`${activePortalTab === 'services' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <Calendar size={20} />
          <span className="text-[8px] font-black uppercase">Service</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('settings')} className={`${activePortalTab === 'settings' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <User size={20} />
          <span className="text-[8px] font-black uppercase">Profile</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('reports')} className={`${activePortalTab === 'reports' ? 'text-red-400' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <AlertCircle size={20} />
          <span className="text-[8px] font-black uppercase">Report</span>
        </motion.button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 space-y-8 sticky top-24 h-fit">
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-100 border border-gray-50 flex flex-col gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-navy/40 hover:bg-gray-50 hover:text-navy transition-all font-black text-[10px] uppercase tracking-widest border border-dashed border-gray-100 mb-2"
            >
              <ArrowLeft size={18} /> Go Back
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-navy transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <Home size={18} /> Home
            </button>
            <div className="h-px bg-gray-50 mx-4 my-2" />
            <button 
              onClick={() => handleTabChange('overview')}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'overview' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
              }`}
            >
              <LayoutGrid size={18} /> Dashboard
            </button>
            <button 
              onClick={() => handleTabChange('history')}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'history' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
              }`}
            >
              <FileText size={18} /> Work History
            </button>
            <button 
              onClick={() => handleTabChange('services')}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'services' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
              }`}
            >
              <Calendar size={18} /> Services
            </button>
            {profile?.isStaff && (
              <button 
                onClick={() => handleTabChange('staff')}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  activePortalTab === 'staff' ? 'bg-teal text-navy shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
                }`}
              >
                <CheckSquare size={18} /> My Assignments
              </button>
            )}
            <button 
              onClick={() => handleTabChange('settings')}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'settings' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
              }`}
            >
              <User size={18} /> Profile
            </button>
            <button 
              onClick={() => handleTabChange('reports')}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'reports' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-red-500'
              }`}
            >
              <AlertCircle size={18} /> Support/Complain
            </button>
            <div className="h-px bg-gray-50 mx-4 my-2" />
            <button 
              onClick={logout}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="bg-navy rounded-[32px] p-8 text-white space-y-4">
            <h5 className="text-[10px] font-black text-teal uppercase tracking-widest">Need help?</h5>
            <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase">
              Contact our 24/7 support for any issues.
            </p>
            <a 
              href="tel:+919582268658"
              className="inline-flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest hover:text-teal transition-colors mt-2"
            >
              Call Expert <ArrowRight size={14} />
            </a>
          </div>
        </aside>

        <main className="flex-1 space-y-12">
          {activePortalTab === 'overview' && (
            <>
              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-navy rounded-[40px] p-8 md:p-12 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 w-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => navigate(-1)}
                        className="lg:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
                      >
                        <ArrowLeft size={20} />
                      </motion.button>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-widest border border-teal/30">
                        <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                        Client Portal
                      </div>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.8 }}
                      onClick={() => navigate('/')}
                      className="lg:hidden text-white/40 hover:text-white transition-colors"
                    >
                      <Home size={20} />
                    </motion.button>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4">
                    HELLO, <span className="text-teal">{profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Customer'}</span>
                  </h1>
                  <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
                    Welcome back to Atomic Solutions. Track your services below.
                  </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsNotifOpen(true)}
                      className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group"
                    >
                      <Bell className="text-teal group-hover:scale-110 transition-transform" size={24} />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-3 right-3 w-4 h-4 bg-red-500 border-2 border-navy rounded-full text-[8px] font-black flex items-center justify-center text-white animate-pulse">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </motion.button>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivePortalTab('overview')}
                    className="bg-white/5 border border-white/10 backdrop-blur-sm p-6 rounded-3xl text-center min-w-[120px] hover:bg-white/10 transition-all cursor-pointer group"
                  >
                     <div className="text-2xl font-black text-teal mb-1 group-hover:scale-110 transition-transform">{bookings.length}</div>
                     <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Total<br/>Bookings</div>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivePortalTab('overview')}
                    className="bg-white/5 border border-white/10 backdrop-blur-sm p-6 rounded-3xl text-center min-w-[120px] hover:bg-white/10 transition-all cursor-pointer group"
                  >
                     <div className="text-2xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{invoices.length}</div>
                     <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Bills<br/>Received</div>
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Staff Application Card - Only for non-staff customers */}
                {!profile?.isStaff && (
                  <Card className="rounded-[40px] border-none shadow-2xl p-8 bg-gradient-to-br from-navy to-[#0a2e52] text-white relative overflow-hidden xl:col-span-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-20 h-20 rounded-[28px] bg-teal flex items-center justify-center text-navy shrink-0 shadow-xl shadow-teal/20">
                        <Briefcase size={32} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Join Our Professional Team</h3>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xl">
                          Are you a skilled technician or engineer? Join Atomic Solutions as a partner and get access to high-quality service leads and professional assignments.
                        </p>
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            await updateProfile({ 
                              isStaff: true, 
                              staffStatus: 'pending',
                              appliedAt: new Date().toISOString()
                            });
                            toast.success('Application submitted! Admin will review and approve your account shortly.');
                          } catch (e) {
                            toast.error('Failed to submit application.');
                          }
                        }}
                        className="h-16 px-10 rounded-2xl bg-teal text-navy hover:bg-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal/10"
                      >
                        Apply for Jobs
                      </Button>
                    </div>
                  </Card>
                )}

                {isPendingStaff && (
                  <Card className="rounded-[40px] border-none shadow-2xl p-8 bg-amber-50 border-2 border-amber-100 text-amber-900 relative overflow-hidden xl:col-span-2">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                      <div className="w-20 h-20 rounded-[28px] bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock3 size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Application Pending</h3>
                        <p className="text-amber-800/60 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xl">
                          Your request to join the professional team is currently being reviewed by our administration. Once approved, you'll get access to the staff portal and job assignments.
                        </p>
                      </div>
                      <div className="px-6 py-3 rounded-2xl bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest border border-amber-200">
                        In Review
                      </div>
                    </div>
                  </Card>
                )}

                {/* Bookings Section */}
                <section id="bookings-section" className="space-y-6 scroll-mt-32">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                      <Calendar className="text-teal" size={24} /> 
                      Recent Bookings
                    </h2>
                  </div>
                  
                  {bookings.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-gray-100 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <Package size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No service bookings yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActivePortalTab('services')}
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        Explore Services
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <Card 
                          key={booking.id} 
                          className="rounded-[32px] border-none shadow-xl shadow-gray-100 overflow-hidden group hover:shadow-2xl transition-all cursor-pointer"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <CardContent className="p-6 flex items-center gap-6">
                            <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px]">
                              {booking.bookingDate || booking.timestamp ? (
                                <>
                                  <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(booking.bookingDate || booking.timestamp).toLocaleDateString('en-US', { month: 'short' })}</span>
                                  <span className="text-lg font-black text-navy">{new Date(booking.bookingDate || booking.timestamp).getDate()}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[8px] font-black text-gray-400 uppercase">Visit</span>
                                  <span className="text-[10px] font-black text-teal">PENDING</span>
                                </>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-black text-navy uppercase tracking-tight truncate">{booking.serviceName}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.subCategory || 'General Service'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${
                                  booking.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                  booking.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {booking.status}
                                </span>
                                {(booking.status === 'Accepted' || booking.status === 'In Progress') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 px-2 text-[6px] font-black uppercase tracking-tighter bg-navy text-white hover:bg-teal hover:text-navy rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                    }}
                                  >
                                    Update & Visit Detail
                                  </Button>
                                )}
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-200 group-hover:text-teal transition-colors" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* Invoices Section */}
                <section id="invoices-section" className="space-y-6 scroll-mt-32">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                      <FileText className="text-teal" size={24} /> 
                      Recent Billing
                    </h2>
                  </div>

                  {invoices.length === 0 ? (
                    <div className="bg-gray-50 rounded-[32px] p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      No invoices found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {invoices.slice(0, 5).map((inv) => (
                        <Card key={inv.id} className="rounded-[32px] border-none shadow-md p-6 bg-white flex items-center justify-between group hover:border-teal/20 transition-all border border-transparent">
                          <div className="flex items-center gap-4">
                            <div className="bg-teal/10 p-3 rounded-2xl text-teal">
                              <FileText size={20} />
                            </div>
                            <div>
                               <h5 className="text-xs font-black text-navy uppercase truncate w-32">{inv.estimateNumber}</h5>
                               <p className="text-[8px] font-bold text-gray-300 uppercase">{new Date(inv.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <p className="text-sm font-black text-navy">₹{inv.totalAmount.toLocaleString()}</p>
                            <Button 
                              onClick={() => downloadInvoicePDF(inv)}
                              variant="ghost"
                              className="h-10 w-10 p-0 rounded-xl hover:bg-navy hover:text-white"
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {activePortalTab === 'history' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header className="space-y-1">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Activity & Work Hub</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Track every detail of your services, reports, and payments</p>
              </header>

              <div className="grid grid-cols-1 gap-12">
                {/* Completed Work / Bookings */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                    <CheckCircle2 className="text-teal" size={24} /> Service History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookings.filter(b => b.status === 'Completed').length === 0 ? (
                      <div className="md:col-span-2 bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                        No completed services found
                      </div>
                    ) : (
                      bookings.filter(b => b.status === 'Completed').map(booking => (
                        <Card key={booking.id} className="rounded-[32px] border-none shadow-xl shadow-gray-50 p-6 bg-white overflow-hidden relative">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-2xl -mr-16 -mt-16" />
                           <div className="flex justify-between items-start mb-4">
                             <div>
                               <p className="text-[8px] font-black text-teal uppercase tracking-widest mb-1">{booking.subCategory || 'Service'}</p>
                               <h4 className="text-lg font-black text-navy uppercase tracking-tight leading-none">{booking.serviceName}</h4>
                             </div>
                             <Badge className="bg-green-100 text-green-700 uppercase text-[8px] font-black">COMPLETED</Badge>
                           </div>
                           <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-6">
                             <div className="flex items-center gap-1"><Calendar size={12}/> {safeDateFormatter(booking.completionDate || booking.timestamp)}</div>
                             <div className="flex items-center gap-1 font-mono text-navy">₹{booking.price || '0'}</div>
                           </div>
                           <Button 
                             onClick={() => setSelectedBooking(booking)}
                             className="w-full h-10 rounded-xl bg-gray-50 hover:bg-navy hover:text-white text-navy font-black text-[9px] uppercase tracking-widest transition-all"
                           >
                             View Full Details
                           </Button>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                    <FileText className="text-teal" size={24} /> Financial Records
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                     {invoices.length === 0 ? (
                       <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                         No financial records yet
                       </div>
                     ) : (
                       invoices.map(inv => (
                        <Card key={inv.id} className="rounded-[32px] border-none shadow-xl p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-teal/20 transition-all border border-transparent">
                          <div className="flex items-center gap-6">
                            <div className="bg-navy p-4 rounded-2xl text-teal">
                              <FileText size={24} />
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{inv.type === 'Estimate' ? 'QUOTATION' : 'BILL / MEMO'}</p>
                               <h5 className="text-sm font-black text-navy uppercase truncate">{inv.estimateNumber || inv.invoiceNumber}</h5>
                               <p className="text-[9px] font-bold text-teal uppercase tracking-tighter">{safeDateFormatter(inv.date || inv.timestamp)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                            <div className="text-right">
                              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-xl font-black text-navy">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <Button 
                              onClick={() => downloadInvoicePDF(inv)}
                              className="h-14 px-8 rounded-2xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20"
                            >
                              <Download size={18} className="mr-2" /> GET PDF
                            </Button>
                          </div>
                        </Card>
                       ))
                     )}
                  </div>
                </div>

                {/* Past Complains/Reports */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} /> Complain Log
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {reports.length === 0 ? (
                       <div className="md:col-span-2 bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                         No complaints found
                       </div>
                     ) : (
                       reports.map(report => (
                        <Card key={report.id} className="rounded-[32px] border-none shadow-xl p-8 bg-white space-y-4">
                           <div className="flex justify-between items-start">
                             <Badge className={`${
                               report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                               report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                               'bg-red-100 text-red-700'
                             } uppercase text-[8px] font-black px-3 py-1 rounded-lg`}>
                               {report.status}
                             </Badge>
                             <span className="text-[8px] font-bold text-gray-400 uppercase">{safeDateFormatter(report.createdAt || report.timestamp)}</span>
                           </div>
                           <h4 className="text-sm font-black text-navy uppercase tracking-tight leading-tight">{report.title}</h4>
                           <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{report.description}</p>
                           {report.adminNote && (
                              <div className="p-4 bg-teal/5 rounded-2xl border border-teal/10 mt-4">
                                <p className="text-[7px] font-black text-teal uppercase tracking-widest mb-1">Resolution Note:</p>
                                <p className="text-[10px] font-bold text-navy leading-relaxed italic">"{report.adminNote}"</p>
                              </div>
                           )}
                        </Card>
                       ))
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activePortalTab === 'services' && (
            <div className="space-y-12">
              <header className="space-y-2">
                <h2 className="text-4xl font-black text-navy uppercase tracking-tighter">Service Catalog</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Compare transparent rates and book directly</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="rounded-[40px] border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={service.image || `https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&h=200&auto=format&fit=crop`} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-navy/40 group-hover:bg-navy/20 transition-colors" />
                      <div className="absolute bottom-6 left-6">
                        <Badge className="bg-teal text-navy font-black text-[8px] uppercase px-3 py-1 mb-2">
                          {service.category}
                        </Badge>
                        <h3 className="text-white text-xl font-black uppercase tracking-tight">{service.name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-8">
                      <p className="text-gray-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
                        Professional {service.name} services with certified experts and standard tools.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => {
                            setSelectedService(service);
                            setIsCategoriesOpen(true);
                          }}
                          className="flex-[2] h-12 rounded-2xl bg-teal hover:bg-navy text-navy hover:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-teal/10"
                        >
                          Book Now
                        </Button>
                        <Button 
                          onClick={() => navigate(`/service/${service.id.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex-1 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Info size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-navy uppercase tracking-tighter">Pricing Disclaimer</h4>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Important information regarding rates</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 text-xs font-medium text-gray-500 leading-relaxed">
                  <p>
                    Prices listed in the catalog are for standard service calls and general maintenance. Labour prices cover the technician's time and basic tools required for the task.
                  </p>
                  <p>
                    Material costs are estimated and may vary based on market rates or specific brand requirements. A detailed estimate will be provided after on-site inspection if complex parts are needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePortalTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-12">
               <header className="space-y-1">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Profile Settings</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Manage your personal and billing information</p>
              </header>

              {(!profile?.phone || !profile?.address) && (
                <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[32px] flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-navy uppercase tracking-tight">Incomplete Profile</h4>
                    <p className="text-xs text-orange-700 font-medium">Please add your phone number and address to book services faster.</p>
                  </div>
                </div>
              )}

              <Card className="rounded-[40px] border-none shadow-2xl p-8 md:p-12 bg-white flex flex-col items-center">
                <div className="w-24 h-24 bg-navy rounded-[32px] flex items-center justify-center text-white mb-8 shadow-xl">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-[32px]" />
                    ) : (
                      <User size={32} />
                    )}
                </div>
                
                <div className="w-full space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                      <div className="p-4 bg-gray-50 rounded-2xl font-black text-navy text-sm border border-gray-100">{profile?.name}</div>
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Last Secure Login</label>
                      <div className="p-4 bg-gray-50 rounded-2xl font-black text-navy text-sm border border-gray-100 truncate">
                        {safeDateFormatter(profile?.lastLoginAt) === 'N/A' ? 'First Session' : safeDateFormatter(profile?.lastLoginAt)}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Phone size={10} className="text-navy" /> Phone Number
                        </label>
                        <input 
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                          placeholder="+91 XXXXX XXXXX"
                          value={phone || ""}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1 text-[#25D366]">
                          <WhatsApp size={10} /> WhatsApp Number
                        </label>
                        <input 
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                          placeholder="+91 XXXXX XXXXX"
                          value={whatsappNumber || ""}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                        />
                      </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <MapPin size={10} className="text-teal" /> Default Service Address
                    </label>
                    <textarea 
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none"
                      placeholder="Street address, landmark, pin code..."
                      value={address || ""}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    {profile?.location && (
                      <p className="text-[9px] text-teal mt-2 font-bold px-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <ShieldCheck size={10} /> GPS Coordinates captured for faster technician routing.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      disabled={isUpdating}
                      onClick={handleUpdateProfile}
                      className="w-full bg-navy hover:bg-teal text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/10 transition-all font-sans"
                    >
                      {isUpdating ? 'Saving...' : 'Update Records'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        toast.promise(
                          (async () => {
                            const loc = await detectFullLocation();
                            const locationData = {
                              lat: loc.lat,
                              lng: loc.lng,
                              address: loc.address || address,
                              timestamp: new Date().toISOString()
                            };
                            
                            // If we found an address, update state
                            if (loc.address) {
                              setAddress(loc.address);
                            }
                            
                            await updateProfile({ 
                              location: locationData,
                              // Also sync address if we haven't already
                              ...( (!address && loc.address) ? { address: loc.address } : {} )
                            });
                            return true;
                          })(),
                          {
                            loading: 'Detecting precise location...',
                            success: (data) => 'Location and address synced to your profile!',
                            error: 'Location detection failed. Please check permissions.'
                          }
                        );
                      }}
                      className="w-full border-gray-100 hover:bg-teal hover:border-teal rounded-2xl h-16 font-black text-xs uppercase tracking-widest"
                    >
                      <MapPin size={16} className="mr-2" /> Share Current Spot
                    </Button>
                  </div>
                  
                  <div className="pt-8 border-t border-gray-100 flex flex-col items-center">
                    <button 
                      onClick={logout}
                      className="inline-flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                      <LogOut size={14} /> Request Session Termination (Logout)
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {activePortalTab === 'staff' && profile?.isStaff && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">My Assignments</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Track and manage your active service jobs</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-teal text-navy px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                    {staffAssignments.filter(b => b.status === 'Accepted' || b.status === 'In Progress').length} Active Jobs
                  </Badge>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="rounded-[40px] border-none shadow-2xl p-8 bg-navy text-white relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal/10 rounded-full blur-3xl" />
                    <div className="relative z-10 space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-teal uppercase tracking-widest mb-2">Earnings Balance</p>
                        <h3 className="text-4xl font-black">₹{staffAssignments.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.payoutAmount || 0), 0).toLocaleString()}</h3>
                      </div>
                      <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Jobs Done</p>
                          <p className="text-xl font-black">{staffAssignments.filter(b => b.status === 'Completed').length}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Rating</p>
                          <p className="text-xl font-black flex items-center gap-1">5.0 <Star size={14} className="text-teal fill-teal" /></p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-[40px] border-none shadow-xl p-8 bg-blue-50/50 border border-blue-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                           <MapPin size={20} />
                        </div>
                        <h4 className="text-xs font-black text-navy uppercase tracking-widest">Share Location</h4>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        Keep your location active during transit to help admin track job deployment and estimated arrival.
                      </p>
                      <Button 
                        onClick={() => {
                          if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition(async (pos) => {
                              try {
                                await dataService.updateDoc('users', user?.uid!, {
                                  location: {
                                    lat: pos.coords.latitude,
                                    lng: pos.coords.longitude,
                                    timestamp: new Date().toISOString()
                                  }
                                });
                                toast.success('Location Shared!');
                              } catch (e) {
                                toast.error('Failed to sync location');
                              }
                            });
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-navy text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                      >
                        Share My Current Spot
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Job List */}
                <div className="lg:col-span-2 space-y-6">
                  {staffAssignments.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-24 border-2 border-dashed border-gray-100 text-center">
                       <CheckSquare size={64} className="text-gray-100 mx-auto mb-6" />
                       <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No assigned jobs found at the moment.</p>
                    </div>
                  ) : (
                    staffAssignments.map(job => (
                      <Card key={job.id} className="rounded-[40px] border-none shadow-xl shadow-gray-50 p-8 bg-white border border-gray-50 group transition-all hover:scale-[1.01]">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <Badge className={`rounded-lg uppercase text-[9px] font-black px-3 py-1 mb-2 ${
                                  job.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                  job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-teal/20 text-navy'
                                }`}>
                                  {job.status}
                                </Badge>
                                <h4 className="text-xl font-black text-navy uppercase tracking-tight">{job.serviceName}</h4>
                                <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em]">{job.subCategory}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Payout</p>
                                <p className="text-2xl font-black text-navy font-mono">₹{job.payoutAmount || 0}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-navy shadow-sm ring-1 ring-black/5">
                                    <Calendar size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Scheduled For</p>
                                    <p className="text-xs font-black text-navy">{job.appointmentDate ? new Date(job.appointmentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'ASAP'}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-navy shadow-sm ring-1 ring-black/5">
                                    <Clock size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Time Slot</p>
                                    <p className="text-xs font-black text-navy">{job.appointmentSlot || 'Urgent'}</p>
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex items-start gap-4 p-5 bg-navy/5 rounded-3xl border border-navy/10 group-hover:bg-navy/10 transition-colors">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-navy/5">
                                    <MapPin size={18} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-navy uppercase tracking-widest mb-1">Deployment Location</p>
                                     <p className="text-xs font-bold text-gray-600 leading-relaxed">{job.userAddress}</p>
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="w-full md:w-48 flex flex-col gap-3 justify-center">
                             {job.status === 'Accepted' && (
                               <Button 
                                 onClick={async () => {
                                   await dataService.updateDoc('bookings', job.id, { status: 'In Progress' });
                                   await dataService.addDoc('notifications', {
                                     userId: job.userId,
                                     title: 'Service Started',
                                     message: `Your ${job.serviceName} service has started. ${profile?.name || 'Technician'} is on the job.`,
                                     type: 'booking_update',
                                     read: false,
                                     timestamp: new Date().toISOString(),
                                     link: '/dashboard'
                                   });
                                 }}
                                 className="w-full h-14 bg-blue-600 hover:bg-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                               >Start Job</Button>
                             )}
                             {job.status === 'In Progress' && (
                               <Button 
                                 onClick={async () => {
                                   await dataService.updateDoc('bookings', job.id, { status: 'Completed', completionDate: new Date().toISOString() });
                                   await dataService.addDoc('notifications', {
                                     userId: job.userId,
                                     title: 'Service Completed',
                                     message: `Your ${job.serviceName} service has been completed. Thank you for choosing Atomic Solutions!`,
                                     type: 'booking_update',
                                     read: false,
                                     timestamp: new Date().toISOString(),
                                     link: '/dashboard'
                                   });
                                 }}
                                 className="w-full h-14 bg-green-600 hover:bg-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-100 animate-pulse"
                               >Mark as Completed</Button>
                             )}
                             <Button 
                               onClick={() => {
                                 const text = `Hi ${job.userName}, I am on my way for your ${job.serviceName} service.`;
                                 window.open(formatWhatsAppLink(job.whatsappNumber || job.userPhone, text), '_blank');
                               }}
                               variant="outline" 
                               className="w-full h-14 border-gray-100 hover:bg-teal hover:text-navy hover:border-teal rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                             >
                                <WhatsApp size={16} className="mr-2" /> Contact Customer
                             </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {activePortalTab === 'reports' && (
            <div className="space-y-12">
              <header className="space-y-1">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Support & Complaints</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Report issues or track your submitted complaints</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <ReportIssue />
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-lg font-black text-navy uppercase tracking-tighter">Your Reports</h3>
                  </div>

                  <div className="space-y-4">
                    {reports.length === 0 ? (
                      <div className="bg-white rounded-[32px] p-20 border-2 border-dashed border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No issues reported yet</p>
                      </div>
                    ) : (
                      reports.map(report => (
                        <div key={report.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg mb-2 ${
                                report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {report.status}
                              </Badge>
                              <h4 className="text-sm font-black text-navy uppercase tracking-tight">{report.title}</h4>
                            </div>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <p className="text-xs text-gray-600 leading-relaxed mb-4">{report.description}</p>
                          
                          {report.attachments && report.attachments.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {report.attachments.map((file: any, i: number) => (
                                <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                  {file.type === 'image' ? (
                                    <img src={file.url} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-navy text-teal"><VideoIcon size={16} /></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {report.adminNote && (
                            <div className="mt-4 p-4 bg-teal/5 rounded-2xl border border-teal/10">
                              <p className="text-[8px] font-black text-teal uppercase tracking-widest mb-1">Response from Admin:</p>
                              <p className="text-xs font-medium text-navy leading-relaxed">{report.adminNote}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[40px] p-0 overflow-hidden border-none shadow-2xl font-sans">
          {selectedBooking && (
            <div className="flex flex-col">
               <div className="bg-navy p-8 text-white relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Logo size="lg" />
                 </div>
                 <div className="flex items-center gap-2 mb-4">
                    <Badge className={`rounded-xl uppercase text-[10px] font-black px-3 py-1 shadow-lg ${
                      selectedBooking.status === 'Completed' ? 'bg-green-500' : 
                      selectedBooking.status === 'Accepted' ? 'bg-teal text-navy' : 
                      selectedBooking.status === 'In Progress' ? 'bg-indigo-500' :
                      selectedBooking.status === 'Rejected' ? 'bg-red-500' : 'bg-orange-500'
                    }`}>
                      {selectedBooking.status}
                    </Badge>
                 </div>
                 <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{selectedBooking.serviceName}</h2>
                 <p className="text-teal font-black uppercase tracking-[0.2em] text-[10px] opacity-80">{selectedBooking.tier || 'Standard'} PACKAGE</p>
               </div>

               <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                   {selectedBooking.type === 'PLANNING_REQUEST' ? (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-teal/5 p-4 rounded-3xl border border-teal/10">
                              <p className="text-[10px] font-black text-teal uppercase tracking-widest mb-1 text-center">Plot Size</p>
                              <p className="text-sm font-black text-navy text-center">{selectedBooking.details?.plotSize}</p>
                           </div>
                           <div className="bg-teal/5 p-4 rounded-3xl border border-teal/10">
                              <p className="text-[10px] font-black text-teal uppercase tracking-widest mb-1 text-center">Total Area</p>
                              <p className="text-sm font-black text-navy text-center">{selectedBooking.details?.sqft ? `${selectedBooking.details.sqft} Sq. Ft.` : 'N/A'}</p>
                           </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[32px] italic text-gray-500 text-xs">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 not-italic">Requirements:</p>
                           "{selectedBooking.details?.description || 'No special requirements provided.'}"
                        </div>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-3xl">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Visit Date</p>
                           <p className="text-sm font-black text-navy text-center">
                             {selectedBooking.appointmentDate 
                               ? new Date(selectedBooking.appointmentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) 
                               : (selectedBooking.bookingDate || selectedBooking.timestamp ? new Date(selectedBooking.bookingDate || selectedBooking.timestamp).toLocaleDateString() : 'ASAP')}
                           </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Time Slot</p>
                           <p className="text-[10px] font-black text-teal uppercase text-center tracking-tight">
                             {selectedBooking.appointmentSlot || selectedBooking.timeSlot || 'Urgent Call'}
                           </p>
                        </div>
                     </div>
                   )}

                  <div className="space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-navy shrink-0">
                           <User size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                           <p className="font-bold text-navy">{selectedBooking.userName || profile?.name || 'Customer'}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-navy shrink-0">
                           <WhatsApp size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</p>
                           <p className="font-bold text-navy">{selectedBooking.whatsappNumber || selectedBooking.userPhone || profile?.whatsappNumber || profile?.phone}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-navy shrink-0">
                           <MapPin size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Address</p>
                           <p className="text-xs font-medium text-gray-500 leading-relaxed">{selectedBooking.userAddress || profile?.address || 'Address Not Provided'}</p>
                        </div>
                     </div>

                     {selectedBooking.staffId && (
                       <div className="p-4 bg-navy rounded-3xl text-white flex items-center justify-between shadow-lg">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-teal text-navy rounded-full flex items-center justify-center font-black text-lg">
                             {selectedBooking.staffName?.[0] || 'P'}
                           </div>
                           <div>
                             <p className="text-[8px] font-black text-teal uppercase tracking-widest leading-none mb-1">Professional Assigned</p>
                             <p className="text-sm font-black uppercase tracking-tight">{selectedBooking.staffName || 'Technician'}</p>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                           {selectedBooking.type === 'PLANNING_REQUEST' ? 'Estimated Rate' : 'Total Price'}
                        </span>
                        <span className="text-3xl font-black text-navy">
                           ₹{selectedBooking.type === 'PLANNING_REQUEST' 
                              ? (selectedBooking.details?.estimatedPrice?.toLocaleString('en-IN') || '0') 
                              : (selectedBooking.price || 'TBD')}
                        </span>
                     </div>
                     
                    <div className="flex flex-col gap-3">
                        {(selectedBooking.status === 'Accepted' || selectedBooking.status === 'In Progress') && (
                          <Button 
                            onClick={async () => {
                              if ("geolocation" in navigator) {
                                toast.promise(
                                  new Promise(async (resolve, reject) => {
                                    navigator.geolocation.getCurrentPosition(async (pos) => {
                                      try {
                                        const location = {
                                          lat: pos.coords.latitude,
                                          lng: pos.coords.longitude,
                                          detectedAt: new Date().toISOString()
                                        };
                                        await dataService.updateDoc('bookings', selectedBooking.id, { location });
                                        resolve(true);
                                      } catch (e) { reject(e); }
                                    }, (err) => reject(err));
                                  }),
                                  {
                                    loading: 'Pinpointing location...',
                                    success: 'Live location shared with your technician!',
                                    error: 'Please enable location permissions.'
                                  }
                                );
                              }
                            }}
                            className="w-full h-14 bg-teal text-navy hover:bg-navy hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal/10"
                          >
                            <MapPin size={14} className="mr-2" /> Send My Live Location to Technician
                          </Button>
                        )}
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 h-14 rounded-2xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest"
                            onClick={() => {
                              const text = `Hi Atomic Solutions, regarding my booking for ${selectedBooking.serviceName}...`;
                              window.open(formatWhatsAppLink('9582268658', text), '_blank');
                            }}
                          >
                            Need Help? Chat
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="h-14 w-14 rounded-2xl bg-gray-50 text-navy"
                            onClick={() => setSelectedBooking(null)}
                          >
                            <X size={20} />
                          </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] p-0 overflow-hidden outline-none font-sans border-none shadow-2xl">
          <div className="bg-navy p-8 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Bell className="text-teal" /> Updates
              </DialogTitle>
              <DialogDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Stay informed about your requests
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto text-navy/20">
                  <Bell size={32} />
                </div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No updates found</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                    notif.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-teal/10 shadow-md ring-1 ring-teal/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.read ? 'bg-gray-100 text-gray-400' : 'bg-teal/10 text-teal'
                  }`}>
                    <CheckSquare size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-navy text-sm uppercase tracking-tight">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-teal rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                      <div className="flex gap-2">
                        {!notif.read && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-teal hover:bg-teal/5" onClick={() => markNotifRead(notif.id)}>Clear</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-red-500 hover:bg-red-50" onClick={() => deleteNotif(notif.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-white border-t border-gray-100">
            <Button onClick={() => setIsNotifOpen(false)} className="w-full h-12 rounded-xl bg-navy hover:bg-navy/90 text-white font-black text-[10px] uppercase tracking-widest font-sans">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories & Booking Flows */}
      {selectedService && (
        <CategoriesModal 
          isOpen={isCategoriesOpen}
          onClose={() => setIsCategoriesOpen(false)}
          service={selectedService}
          whatsapp="+919582268658"
          onBook={handleBook}
        />
      )}

      {bookingData && selectedService && (
        <DirectBookingModal 
          isOpen={isDirectBookingOpen}
          onClose={() => {
            setIsDirectBookingOpen(false);
            setBookingData(null);
          }}
          serviceName={selectedService.name}
          subCategoryName={bookingData.subName}
          bookingType={bookingData.type}
          whatsapp="+919582268658"
        />
      )}
    </div>
  );
}
