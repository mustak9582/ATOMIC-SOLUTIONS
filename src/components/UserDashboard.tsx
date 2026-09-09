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
  CheckCircle2, Upload,
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
  ShieldCheck,
  Zap,
  Mail,
  Navigation,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { detectFullLocation } from '../services/locationService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import Logo from './Logo';
import { Notification, Service, Category, Booking } from '../types';
import { CORE_SERVICES, DEFAULT_CATEGORIES } from '../constants';
import { cn, formatWhatsAppLink, safeDateFormatter, safeTimeFormatter, compressImage } from '../lib/utils';
import DirectBookingModal from './DirectBookingModal';
import CategoriesModal from './CategoriesModal';
import ReportIssue from './ReportIssue';
import BookingChatModal from './BookingChatModal';

export default function UserDashboard({ initialSection }: { initialSection?: 'bookings' | 'invoices' | 'services' | 'reports' }) {
  const { user, profile, updateProfile, logout, isPendingStaff, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activePortalTab, setActivePortalTab] = useState<'overview' | 'services' | 'settings' | 'reports' | 'staff' | 'history'>(
    initialSection === 'services' ? 'services' : 
    initialSection === 'reports' ? 'reports' : 
    'overview'
  );
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'completed' | 'invoices' | 'reports'>('all');
  const [staffEtaInputs, setStaffEtaInputs] = useState<Record<string, string>>({});

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
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  const prevBookingsRef = React.useRef<Record<string, string>>({});
  const prevNotifsCount = React.useRef<number | null>(null);
  const notificationSound = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Services related state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isDirectBookingOpen, setIsDirectBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', price?: number | string, labourPrice?: number, materialPrice?: number} | null>(null);
  
  // Profile form state
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsappNumber || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const TRACKING_STEPS = [
    { label: 'Booking Placed', desc: 'Received by Admin' },
    { label: 'Assigned', desc: 'Technician Allocated' },
    { label: 'On The Way', desc: 'Heading to Location' },
    { label: 'Arrived', desc: 'At Premises' },
    { label: 'In Progress', desc: 'Service Underway' },
    { label: 'Completed', desc: 'Work Finished' },
  ];

  const getStepProgress = (status: string, stepIndex: number) => {
    const map: Record<string, number> = {
      'Pending': 1,
      'Assigned': 2,
      'Accepted': 2,
      'On the Way': 3,
      'Arrived': 4,
      'In Progress': 5,
      'Completed': 6,
    };
    const current = map[status] || 1;
    if (current > stepIndex) return 'completed';
    if (current === stepIndex) return 'current';
    return 'upcoming';
  };

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setWhatsappNumber(profile.whatsappNumber || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (location.state?.tab) {
      setActivePortalTab(location.state.tab as any);
    }
    if (location.state?.selectedBookingId && bookings.length > 0) {
      const found = bookings.find(b => b.id === location.state.selectedBookingId);
      if (found) {
        setSelectedBooking(found);
      }
    }
  }, [location.state, bookings]);

  useEffect(() => {
    if (user) {
      const unsubBookings = dataService.subscribe('bookings', (data) => {
        setConnectionStatus('syncing');
        setTimeout(() => setConnectionStatus('online'), 1000);

        try {
          const sorted = (data as any[]).sort((a,b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
          });

          // Detect status changes
          sorted.forEach(booking => {
            const prevStatus = prevBookingsRef.current[booking.id];
            if (prevStatus && prevStatus !== booking.status) {
              toast(`Booking ${booking.status}!`, {
                description: `Your booking for ${booking.serviceName} is now ${booking.status.toLowerCase()}.`,
                icon: <Zap className="text-teal" size={18} />,
                duration: 6000
              });
              notificationSound.current?.play().catch(() => {});
            }
            prevBookingsRef.current[booking.id] = booking.status;
          });

          setBookings(sorted);
        } catch (err) {
          console.error("Sort failed", err);
          setBookings(data as any[]);
        }
        setLoading(false);
      }, [{ field: 'userId', operator: '==', value: user.uid }], (err) => setConnectionStatus('offline'));

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
        const sortedNotifs = (data as any[]).sort((a,b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });

        if (prevNotifsCount.current !== null && sortedNotifs.length > prevNotifsCount.current) {
          const newNotif = sortedNotifs[0];
          if (!newNotif.read) {
            toast(newNotif.title, {
              description: newNotif.message,
              icon: <Bell className="text-teal" size={18} />
            });
            notificationSound.current?.play().catch(() => {});
          }
        }

        prevNotifsCount.current = sortedNotifs.length;
        setNotifications(sortedNotifs);
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

  const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice?: string | number, materialPrice?: string | number) => {
    const lPrice = Number(labourPrice) || 0;
    const mPrice = Number(materialPrice) || 0;
    const effPrice = type === 'LABOUR' ? lPrice : type === 'MATERIAL' ? mPrice : (lPrice + mPrice) || 0;
    setBookingData({ subName, type, price: effPrice, labourPrice: lPrice, materialPrice: mPrice });
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setIsChangingPassword(true);
    try {
      if (changePassword) {
        await changePassword(newPassword);
        setNewPassword('');
        toast.success('Password updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password. You may need to login again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUploadPaymentProof = async (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Uploading payment proof...');
      const base64Image = await compressImage(file, 800);
      await dataService.updateDoc('invoices', invoiceId, {
        paymentProofUrl: base64Image,
        status: 'Verification Pending',
      });
      toast.success('Payment proof uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image.');
    }
  };

  const handleUploadBookingPaymentProof = async (bookingId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Uploading payment proof...');
      const base64Image = await compressImage(file, 800);
      await dataService.updateDoc('bookings', bookingId, {
        paymentProofUrl: base64Image,
        paymentStatus: 'Verification Pending',
      });
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, paymentProofUrl: base64Image, paymentStatus: 'Verification Pending' });
      }
      toast.success('Payment proof uploaded! Admin will verify and generate the bill.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image.');
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    try {
      const pdfData: PDFInvoiceData = {
        type: invoice.type || 'Invoice',
        number: invoice.estimateNumber || invoice.invoiceNumber || 'No',
        date: invoice.date || invoice.timestamp,
        customerName: invoice.customerName || user?.displayName || 'Valued Customer',
        customerPhone: invoice.customerPhone || user?.phoneNumber || '',
        customerAddress: invoice.customerAddress || '',
        customerGSTIN: invoice.customerGSTIN || '',
        items: invoice.items.map((i: any) => ({
          name: i.name,
          description: i.description,
          quantity: i.quantity,
          rate: i.rate,
          uom: i.unit || i.uom || 'Nos',
          taxable: i.quantity * i.rate,
          amount: i.rate * i.quantity
        })),
        summary: {
          taxableAmount: invoice.subTotal - (invoice.discount || 0),
          cgstAmount: (invoice.gstAmount || 0) / 2,
          sgstAmount: (invoice.gstAmount || 0) / 2,
          igstAmount: 0,
          freightCharges: 0,
          discountAmount: invoice.discount || 0,
          roundOff: invoice.roundOff || 0
        },
        totalAmount: invoice.totalAmount,
        bankDetails: invoice.bankDetails || '',
        companyPhone: settings?.phone || '9582268658',
        companyAddress: settings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
        logoUrl: window.location.origin + '/logo.png'
      };
      
      const doc = await generateInvoicePDF(pdfData);
      const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || invoice.invoiceNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      toast.success('Invoice Downloaded Successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
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
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-24px)] max-w-md bg-navy/95 backdrop-blur-xl border border-white/10 px-2 sm:px-4 py-2.5 sm:py-3 rounded-full flex justify-around items-center shadow-2xl">
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => navigate('/')} className="text-white/60 hover:text-teal transition-colors flex flex-col items-center gap-1">
          <Home size={18} />
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Home</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('overview')} className={`${activePortalTab === 'overview' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <LayoutGrid size={18} />
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Dash</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('history')} className={`${activePortalTab === 'history' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1 relative`}>
          <Clock3 size={18} />
          {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-teal rounded-full animate-ping" />
          )}
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Bookings</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('services')} className={`${activePortalTab === 'services' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <Calendar size={18} />
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Service</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('settings')} className={`${activePortalTab === 'settings' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <User size={18} />
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Profile</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleTabChange('reports')} className={`${activePortalTab === 'reports' ? 'text-red-400' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}>
          <AlertCircle size={18} />
          <span className="text-[7px] sm:text-[8px] font-black uppercase">Report</span>
        </motion.button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pt-24 pb-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
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
              className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activePortalTab === 'history' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Clock3 size={18} className={bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length > 0 ? "text-teal" : ""} /> 
                <span className="truncate">My Bookings</span>
              </div>
              {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length > 0 && (
                <span className="bg-teal text-navy text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shrink-0 ml-1">
                  {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length} Active
                </span>
              )}
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
                      <div className="inline-flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-widest border border-teal/30">
                          <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                          Client Portal
                        </div>
                        <div className={cn(
                          "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all",
                          connectionStatus === 'online' ? "bg-white/5 border-white/10 text-white/60" :
                          connectionStatus === 'syncing' ? "bg-teal/10 border-teal/20 text-teal animate-pulse" :
                          "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                           <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", 
                            connectionStatus === 'online' ? "bg-teal" : 
                            connectionStatus === 'syncing' ? "bg-teal animate-ping" : "bg-red-500"
                          )} />
                          {connectionStatus}
                        </div>
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
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-2">
                    HELLO, <span className="text-teal">{profile?.name || user?.displayName || 'STAKEHOLDER'}</span>
                  </h1>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Mail size={12} className="text-teal" /> {user?.email || profile?.email || 'Authenticated Account'}
                  </p>
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-lg">
                    Accessing Atomic secure infrastructure via verified Google workspace credentials.
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

                {/* Active Dispatch & Live Tracking Section */}
                {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length > 0 && (
                  <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal"></span>
                        </span>
                        <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-2">
                          Live Service Tracking & Dispatch
                        </h2>
                      </div>
                      <span className="text-[9px] font-black text-teal uppercase tracking-widest bg-teal/10 px-3.5 py-1.5 rounded-full border border-teal/20">
                        Live Synchronized
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {bookings
                        .filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status))
                        .map((activeB) => {
                          const isAssigned = !!(activeB.staffId || activeB.staffName);
                          const hasGps = !!(activeB.technicianLocation?.lat && activeB.technicianLocation?.lng);
                          const gmapsUrl = hasGps 
                            ? `https://www.google.com/maps/search/?api=1&query=${activeB.technicianLocation.lat},${activeB.technicianLocation.lng}`
                            : null;

                          return (
                            <Card key={activeB.id} className="rounded-[36px] border-2 border-teal/20 bg-gradient-to-br from-white via-white to-teal/5 shadow-2xl p-6 md:p-8 relative overflow-hidden">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge className={`rounded-xl uppercase text-[10px] font-black px-3.5 py-1.5 shadow-sm ${
                                      activeB.status === 'On the Way' ? 'bg-amber-500 text-white animate-pulse' :
                                      activeB.status === 'Arrived' ? 'bg-indigo-600 text-white animate-pulse' :
                                      activeB.status === 'In Progress' ? 'bg-blue-600 text-white' :
                                      activeB.status === 'Accepted' || activeB.status === 'Assigned' ? 'bg-teal text-navy' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {activeB.status === 'On the Way' ? '🚗 Technician On The Way' :
                                       activeB.status === 'Arrived' ? '📍 Technician Arrived' :
                                       activeB.status === 'In Progress' ? '🔧 Service In Progress' :
                                       activeB.status === 'Assigned' || activeB.status === 'Accepted' ? '👤 Technician Assigned' :
                                       '⏳ Awaiting Technician Dispatch'}
                                    </Badge>

                                    {activeB.eta && (
                                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-teal/15 text-navy font-black text-[10px] tracking-wider uppercase border border-teal/30">
                                        <Clock size={12} className="text-teal" /> ETA: {activeB.eta}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-2xl font-black text-navy uppercase tracking-tight">
                                    {activeB.serviceName}
                                  </h3>
                                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                    {activeB.subCategory || 'Service'} • {activeB.appointmentDate || activeB.bookingDate || 'Today'} • {activeB.appointmentSlot || activeB.timeSlot || 'Scheduled'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={() => setSelectedBooking(activeB)}
                                    variant="outline"
                                    className="rounded-2xl border-gray-200 text-navy font-black text-[10px] uppercase tracking-widest hover:bg-navy hover:text-white transition-all h-11 px-5"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>

                              {/* Stepper Progress */}
                              <div className="py-6">
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {TRACKING_STEPS.map((step, idx) => {
                                    const state = getStepProgress(activeB.status, idx + 1);
                                    return (
                                      <div key={idx} className="flex flex-col items-center text-center">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-sm mb-2 ${
                                          state === 'completed' ? 'bg-teal text-navy' :
                                          state === 'current' ? 'bg-navy text-teal ring-4 ring-teal/20 animate-pulse' :
                                          'bg-gray-100 text-gray-400'
                                        }`}>
                                          {state === 'completed' ? <CheckCircle2 size={18} /> : (idx + 1)}
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-tight leading-tight ${
                                          state === 'current' ? 'text-navy' :
                                          state === 'completed' ? 'text-teal' : 'text-gray-300'
                                        }`}>
                                          {step.label}
                                        </p>
                                        <p className="text-[8px] font-medium text-gray-400 uppercase hidden sm:block">
                                          {step.desc}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Technician Card or Dispatch Notice */}
                              {isAssigned ? (
                                <div className="bg-navy rounded-[28px] p-6 text-white space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-teal text-navy flex items-center justify-center font-black text-2xl overflow-hidden shadow-lg border-2 border-teal shrink-0">
                                        {activeB.staffPhoto ? (
                                          <img src={activeB.staffPhoto} alt={activeB.staffName} className="w-full h-full object-cover" />
                                        ) : (
                                          activeB.staffName?.[0] || 'T'
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-base font-black uppercase tracking-tight">{activeB.staffName}</h4>
                                          <span className="inline-flex items-center gap-1 text-[8px] font-black bg-teal/20 text-teal px-2 py-0.5 rounded-full border border-teal/30 uppercase">
                                            <ShieldCheck size={10} /> Verified Expert
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-teal uppercase tracking-widest">
                                          {activeB.staffCategory || 'HVAC Technician'}
                                        </p>
                                        {activeB.staffPhone && (
                                          <p className="text-[11px] font-mono text-white/70 mt-0.5">
                                            📞 {activeB.staffPhone}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Communication Actions */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button 
                                        onClick={() => setChatBooking(activeB)}
                                        className="bg-teal hover:bg-teal/90 text-navy font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-5 shadow-lg shadow-teal/20 transition-all flex items-center gap-2"
                                      >
                                        <MessageCircle size={16} />
                                        Chat with Technician
                                      </Button>

                                      {activeB.staffPhone && (
                                        <>
                                          <a 
                                            href={`tel:${activeB.staffPhone}`}
                                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-5 transition-all border border-white/10"
                                          >
                                            <Phone size={14} className="text-teal" />
                                            Call
                                          </a>
                                          <a 
                                            href={formatWhatsAppLink(activeB.staffPhone, `Hi ${activeB.staffName}, I am reaching out regarding my ${activeB.serviceName} booking via Atomic HVAC.`)}
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-5 transition-all border border-green-500/30"
                                          >
                                            <WhatsApp size={14} className="text-green-400" />
                                            WhatsApp
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* GPS Location & Live Route Strip */}
                                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-white/80">
                                      <Navigation size={16} className={hasGps ? "text-teal animate-pulse" : "text-white/40"} />
                                      {hasGps ? (
                                        <div>
                                          <span className="font-black text-[10px] uppercase tracking-wider text-teal">Live GPS Location Active</span>
                                          {activeB.technicianLocation?.updatedAt && (
                                            <span className="text-[9px] text-white/50 ml-2">
                                              (Updated {new Date(activeB.technicianLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                          Technician live GPS will be available once en route.
                                        </span>
                                      )}
                                    </div>

                                    {hasGps && gmapsUrl && (
                                      <a 
                                        href={gmapsUrl}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal/20 hover:bg-teal text-teal hover:text-navy text-[9px] font-black uppercase tracking-widest transition-all border border-teal/30"
                                      >
                                        <MapPin size={12} /> Open Live Route on Google Maps
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-amber-50 rounded-[28px] p-6 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                                      <Clock3 size={24} className="animate-spin" style={{ animationDuration: '3s' }} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black uppercase tracking-wider">Admin is allocating nearest specialist technician</h4>
                                      <p className="text-[10px] text-amber-800/80 font-bold uppercase tracking-widest">
                                        Your request has been received. Our operations team will assign a verified technician shortly.
                                      </p>
                                    </div>
                                  </div>
                                  <a 
                                    href="tel:+919582268658"
                                    className="inline-flex items-center gap-2 bg-navy text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-teal hover:text-navy transition-all shrink-0"
                                  >
                                    <Phone size={14} /> Call Support
                                  </a>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                    </div>
                  </div>
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
                                  booking.status === 'On the Way' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  booking.status === 'Arrived' ? 'bg-indigo-100 text-indigo-800' :
                                  booking.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                  booking.status === 'Accepted' || booking.status === 'Assigned' ? 'bg-teal/20 text-navy' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {booking.status}
                                </span>
                                {(booking.status === 'Accepted' || booking.status === 'In Progress' || booking.status === 'On the Way' || booking.status === 'Arrived') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 px-2 text-[6px] font-black uppercase tracking-tighter bg-navy text-white hover:bg-teal hover:text-navy rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                    }}
                                  >
                                    Live Details
                                  </Button>
                                )}
                              </div>
                              {booking.staffName && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                  <div className="w-5 h-5 rounded-full bg-teal text-navy flex items-center justify-center text-[9px] font-black shrink-0">
                                    {booking.staffName[0]}
                                  </div>
                                  <span className="text-[10px] font-black text-navy truncate max-w-[120px]">{booking.staffName}</span>
                                  {booking.eta && (
                                    <span className="text-[8px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded">ETA: {booking.eta}</span>
                                  )}
                                  <div className="ml-auto flex items-center gap-1">
                                    <button 
                                      onClick={() => setChatBooking(booking)}
                                      className="px-2 py-1 rounded-lg bg-teal text-navy hover:bg-navy hover:text-white transition-colors text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"
                                      title="Chat with Technician"
                                    >
                                      <MessageCircle size={10} /> Chat
                                    </button>
                                    {booking.staffPhone && (
                                      <a 
                                        href={`tel:${booking.staffPhone}`}
                                        className="p-1 rounded-lg bg-gray-100 text-navy hover:bg-navy hover:text-white transition-colors"
                                        title="Call Technician"
                                      >
                                        <Phone size={10} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <ArrowRight size={16} className="text-gray-200 group-hover:text-teal transition-colors" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* Estimates Section */}
                <section id="estimates-section" className="space-y-6 scroll-mt-32">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                      <FileText className="text-teal" size={24} /> 
                      Estimates
                    </h2>
                  </div>

                  {invoices.filter(inv => inv.type === 'Estimate').length === 0 ? (
                    <div className="bg-gray-50 rounded-[32px] p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      No estimates found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {invoices.filter(inv => inv.type === 'Estimate').slice(0, 5).map((inv) => (
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
                            <div className="text-right flex flex-col md:flex-row gap-4 items-center">
                              <div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-xl font-black text-navy">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-black uppercase text-teal mt-1">{inv.status}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  onClick={() => downloadInvoicePDF(inv)}
                                  className="h-10 px-6 rounded-xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20"
                                >
                                  <Download size={14} className="mr-2" /> PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* Tax Invoices Section */}
                <section id="tax-invoices-section" className="space-y-6 scroll-mt-32">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                      <FileText className="text-teal" size={24} /> 
                      Tax Invoices
                    </h2>
                  </div>

                  {invoices.filter(inv => inv.type !== 'Estimate').length === 0 ? (
                    <div className="bg-gray-50 rounded-[32px] p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      No tax invoices found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {invoices.filter(inv => inv.type !== 'Estimate').slice(0, 5).map((inv) => (
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
                            <div className="text-right flex flex-col md:flex-row gap-4 items-center">
                              <div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-xl font-black text-navy">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-black uppercase text-teal mt-1">{inv.status}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  onClick={() => downloadInvoicePDF(inv)}
                                  className="h-10 px-6 rounded-xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20"
                                >
                                  <Download size={14} className="mr-2" /> PDF
                                </Button>
                                {inv.status !== 'Paid' && inv.status !== 'Verification Pending' && (
                                  <label className="cursor-pointer h-10 px-6 rounded-xl bg-teal/10 text-teal hover:bg-teal hover:text-navy font-black text-[10px] uppercase tracking-widest flex items-center justify-center transition-all">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleUploadPaymentProof(inv.id, e)}
                                    />
                                    <Upload size={14} className="mr-2" /> Pay / Upload
                                  </label>
                                )}
                                {inv.status === 'Verification Pending' && (
                                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-4 py-2 bg-orange-50 rounded-xl">In Review</span>
                                )}
                              </div>
                            </div>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                    <Clock3 className="text-teal" size={30} /> My Bookings & Live Status
                  </h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                    मेरी सभी बुकिंग्स, तकनीशियन स्टेटस, पहुंचने का समय और लाइव कार्य प्रगति
                  </p>
                </div>
                <Button
                  onClick={() => handleTabChange('services')}
                  className="bg-navy hover:bg-teal hover:text-navy text-white text-[10px] font-black uppercase tracking-widest rounded-2xl h-11 px-5 shadow-lg shrink-0"
                >
                  Book New Service
                </Button>
              </header>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bookings</p>
                  <p className="text-2xl font-black text-navy">{bookings.length}</p>
                </div>
                <div className="bg-teal/10 p-5 rounded-[28px] border border-teal/20 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[8px] font-black text-navy uppercase tracking-widest">Active & Tracking</p>
                    {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal animate-ping" />
                    )}
                  </div>
                  <p className="text-2xl font-black text-teal">
                    {bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed Services</p>
                  <p className="text-2xl font-black text-navy">{bookings.filter(b => b.status === 'Completed').length}</p>
                </div>
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoices & Bills</p>
                  <p className="text-2xl font-black text-navy">{invoices.length}</p>
                </div>
              </div>

              {/* Sub-Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl w-fit">
                {[
                  { id: 'all', label: 'All Bookings', count: bookings.length },
                  { id: 'active', label: 'Active & In-Progress', count: bookings.filter(b => ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length, isLive: true },
                  { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'Completed').length },
                  { id: 'invoices', label: 'Bills & Quotations', count: invoices.length },
                  { id: 'reports', label: 'Complaints', count: reports.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryFilter(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      historyFilter === tab.id 
                        ? 'bg-navy text-white shadow-md' 
                        : 'text-gray-500 hover:text-navy hover:bg-white/60'
                    }`}
                  >
                    {tab.isLive && tab.count > 0 && <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />}
                    <span>{tab.label}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      historyFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bookings View (when filter is 'all', 'active', or 'completed') */}
              {(historyFilter === 'all' || historyFilter === 'active' || historyFilter === 'completed') && (() => {
                const displayedBookings = bookings.filter(b => {
                  if (historyFilter === 'active') {
                    return ['Pending', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status);
                  }
                  if (historyFilter === 'completed') {
                    return b.status === 'Completed';
                  }
                  return true;
                });

                if (displayedBookings.length === 0) {
                  return (
                    <div className="bg-white rounded-[36px] p-16 border-2 border-dashed border-gray-100 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <Package size={32} />
                      </div>
                      <h4 className="text-sm font-black text-navy uppercase tracking-wider">
                        {historyFilter === 'active' ? 'No Active Bookings Right Now' : 
                         historyFilter === 'completed' ? 'No Completed Services Found' : 
                         'No Bookings Found'}
                      </h4>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest max-w-md mx-auto">
                        Ready to book top-tier HVAC & home maintenance services? Browse our catalog and enjoy prompt expert assistance.
                      </p>
                      <Button 
                        onClick={() => handleTabChange('services')}
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-navy hover:bg-teal hover:text-navy text-white px-6 h-11"
                      >
                        Explore Services
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-6">
                    {displayedBookings.map((b) => {
                      const isAssigned = !!(b.staffId || b.staffName);
                      const hasGps = !!(b.technicianLocation?.lat && b.technicianLocation?.lng);
                      const gmapsUrl = hasGps 
                        ? `https://www.google.com/maps/search/?api=1&query=${b.technicianLocation.lat},${b.technicianLocation.lng}`
                        : null;

                      return (
                        <Card 
                          key={b.id} 
                          className="rounded-[36px] border border-gray-100 shadow-xl shadow-gray-100/60 bg-white p-6 md:p-8 space-y-6 overflow-hidden relative"
                        >
                          {/* Top Row: Service details + Price & Status */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2.5 py-0.5 rounded-lg">
                                  #AS-{b.id ? b.id.slice(-6).toUpperCase() : 'TICKET'}
                                </span>
                                {b.bookingType && (
                                  <Badge className="bg-teal/15 text-navy text-[8px] font-black uppercase tracking-wider border border-teal/20">
                                    {b.bookingType === 'LABOUR' ? 'Labour Charges Only' : 
                                     b.bookingType === 'MATERIAL' ? 'With Material' : 
                                     b.bookingType === 'BOTH' ? 'Labour + With Material' : 
                                     'Standard'}
                                  </Badge>
                                )}
                                <span className="text-[8px] font-bold text-gray-400 uppercase">
                                  Booked: {safeDateFormatter(b.timestamp || b.bookingDate)}
                                </span>
                              </div>
                              <h3 className="text-2xl font-black text-navy uppercase tracking-tight">
                                {b.serviceName}
                              </h3>
                              <p className="text-[11px] font-bold text-teal uppercase tracking-widest">
                                {b.subCategory || 'General Service'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 self-start md:self-center">
                              <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Service Total</p>
                                <p className="text-2xl font-black text-navy font-mono">₹{b.price || b.totalAmount || 0}</p>
                              </div>
                              <Badge className={`rounded-xl uppercase text-[9px] font-black px-3.5 py-2 shadow-sm ${
                                b.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                b.status === 'In Progress' ? 'bg-blue-600 text-white animate-pulse' :
                                b.status === 'Arrived' ? 'bg-indigo-600 text-white' :
                                b.status === 'On the Way' ? 'bg-amber-500 text-white animate-pulse' :
                                b.status === 'Assigned' || b.status === 'Accepted' ? 'bg-teal text-navy' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {b.status === 'On the Way' ? '🚗 On The Way' :
                                 b.status === 'Arrived' ? '📍 Arrived' :
                                 b.status === 'In Progress' ? '🔧 In Progress' :
                                 b.status === 'Completed' ? '✅ Completed' :
                                 b.status === 'Assigned' || b.status === 'Accepted' ? '👤 Assigned' :
                                 '⏳ Pending Dispatch'}
                              </Badge>
                            </div>
                          </div>

                          {/* 6-Step Visual Progression Stepper */}
                          <div className="py-2">
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {TRACKING_STEPS.map((step, idx) => {
                                const state = getStepProgress(b.status, idx + 1);
                                return (
                                  <div key={idx} className="flex flex-col items-center text-center">
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-sm mb-1.5 ${
                                      state === 'completed' ? 'bg-teal text-navy' :
                                      state === 'current' ? 'bg-navy text-teal ring-4 ring-teal/20 animate-pulse' :
                                      'bg-gray-100 text-gray-400'
                                    }`}>
                                      {state === 'completed' ? <CheckCircle2 size={16} /> : (idx + 1)}
                                    </div>
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-tight ${
                                      state === 'current' ? 'text-navy font-black' :
                                      state === 'completed' ? 'text-teal font-black' : 'text-gray-300'
                                    }`}>
                                      {step.label}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Technician Assignment Card OR Awaiting Notice */}
                          {isAssigned ? (
                            <div className="bg-gradient-to-r from-navy via-navy to-navy/95 rounded-[28px] p-6 text-white space-y-4 shadow-xl">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-teal text-navy rounded-2xl flex items-center justify-center font-black text-2xl overflow-hidden border-2 border-teal shrink-0 shadow-lg">
                                    {b.staffPhoto ? (
                                      <img src={b.staffPhoto} alt={b.staffName} className="w-full h-full object-cover" />
                                    ) : (
                                      b.staffName?.[0] || 'T'
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-base font-black uppercase tracking-tight">{b.staffName}</h4>
                                      <span className="text-[8px] font-black bg-teal/20 text-teal px-2 py-0.5 rounded-md border border-teal/30 uppercase flex items-center gap-1">
                                        <ShieldCheck size={10} /> Verified Pro
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-teal uppercase tracking-widest mt-0.5">
                                      {b.staffCategory || 'Expert Service Specialist'}
                                    </p>
                                    <p className="text-[10px] font-mono text-white/70 mt-1">📞 {b.staffPhone || 'Direct Partner Contact'}</p>
                                  </div>
                                </div>

                                {/* Direct Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => setChatBooking(b)}
                                    className="bg-teal hover:bg-teal/90 text-navy font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-5 flex items-center gap-2 shadow-lg shadow-teal/10"
                                  >
                                    <MessageCircle size={16} /> Chat
                                  </Button>
                                  {b.staffPhone && (
                                    <>
                                      <a 
                                        href={`tel:${b.staffPhone}`}
                                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-4 transition-all border border-white/10"
                                      >
                                        <Phone size={14} className="text-teal" /> Call
                                      </a>
                                      <a 
                                        href={formatWhatsAppLink(b.staffPhone, `Hi ${b.staffName}, I am reaching out regarding my ${b.serviceName} booking with Atomic Solutions.`)}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-black text-[10px] uppercase tracking-widest rounded-2xl h-11 px-4 transition-all border border-green-500/30"
                                      >
                                        <WhatsApp size={14} className="text-green-400" /> WhatsApp
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Live Route Button if GPS available */}
                              {hasGps && gmapsUrl && (
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-teal flex items-center gap-1.5">
                                    <Navigation size={12} className="animate-pulse" /> Live Technician GPS Active
                                  </span>
                                  <a 
                                    href={gmapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-black uppercase text-teal hover:text-white flex items-center gap-1 underline underline-offset-4"
                                  >
                                    <MapPin size={12} /> Open Live Route on Google Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-amber-50/80 rounded-[28px] p-6 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                                  <Clock3 size={24} className="animate-spin" style={{ animationDuration: '4s' }} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider">
                                    Admin is allocating nearest specialist technician (तकनीशियन असाइन हो रहा है)
                                  </h4>
                                  <p className="text-[10px] text-amber-800/80 font-medium leading-relaxed mt-0.5">
                                    Your service booking has been confirmed. Our operations team is assigning the best verified expert for your location.
                                  </p>
                                </div>
                              </div>
                              <a 
                                href="tel:+919582268658"
                                className="inline-flex items-center gap-2 bg-navy text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-teal hover:text-navy transition-all shrink-0"
                              >
                                <Phone size={14} /> Helpline
                              </a>
                            </div>
                          )}

                          {/* Timings Strip: Expected Reach Time / Date / Slot / Duration */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-[28px] border border-gray-100">
                            {/* Expected Arrival / Reach Time */}
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-teal uppercase tracking-widest flex items-center gap-1">
                                <Clock size={12} /> Reach Time / पहुंचने का समय
                              </p>
                              <p className="text-xs font-black text-navy">
                                {b.eta ? b.eta : (b.appointmentSlot || 'Standard Slot')}
                              </p>
                              <p className="text-[8px] font-medium text-gray-400">
                                {b.eta ? 'Configured by Admin / Partner' : 'Awaiting arrival update'}
                              </p>
                            </div>

                            {/* Scheduled Visit Date */}
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Calendar size={12} /> Scheduled Visit Date
                              </p>
                              <p className="text-xs font-black text-navy">
                                {b.appointmentDate ? safeDateFormatter(b.appointmentDate) : (b.bookingDate ? safeDateFormatter(b.bookingDate) : 'Today / Priority')}
                              </p>
                            </div>

                            {/* Scheduled Slot */}
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock3 size={12} /> Time Slot
                              </p>
                              <p className="text-xs font-black text-navy truncate">
                                {b.appointmentSlot || b.timeSlot || 'Priority Dispatch'}
                              </p>
                            </div>

                            {/* Estimated Work Duration */}
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <CheckSquare size={12} /> Work Duration
                              </p>
                              <p className="text-xs font-black text-navy">
                                {b.status === 'Completed' 
                                  ? `Completed on ${safeDateFormatter(b.completionDate || b.timestamp)}`
                                  : '~1 to 2 Hours (Once started)'}
                              </p>
                            </div>
                          </div>

                          {/* Footer Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-2">
                              {b.status !== 'Completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if ("geolocation" in navigator) {
                                      toast.promise(
                                        new Promise(async (resolve, reject) => {
                                          navigator.geolocation.getCurrentPosition(async (pos) => {
                                            try {
                                              const loc = {
                                                lat: pos.coords.latitude,
                                                lng: pos.coords.longitude,
                                                detectedAt: new Date().toISOString()
                                              };
                                              await dataService.updateDoc('bookings', b.id, { location: loc });
                                              resolve(true);
                                            } catch (e) { reject(e); }
                                          }, (err) => reject(err));
                                        }),
                                        {
                                          loading: 'Detecting GPS coordinates...',
                                          success: 'Doorstep GPS shared with technician!',
                                          error: 'Please allow location permission.'
                                        }
                                      );
                                    }
                                  }}
                                  className="rounded-xl text-[9px] font-black uppercase tracking-wider text-navy hover:bg-navy hover:text-white border-gray-200"
                                >
                                  <MapPin size={12} className="mr-1.5 text-teal" /> Share My GPS
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => setSelectedBooking(b)}
                                className="rounded-xl font-black text-[9px] uppercase tracking-widest bg-navy hover:bg-teal hover:text-navy text-white px-5 h-10 shadow-sm"
                              >
                                View Full Details
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Invoices View (when filter is 'invoices') */}
              {historyFilter === 'invoices' && (
                <div className="space-y-6">
                  {invoices.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                      No invoices or financial records yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {invoices.map(inv => (
                        <Card key={inv.id} className="rounded-[32px] border-none shadow-xl p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className="bg-navy p-4 rounded-2xl text-teal">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                {inv.type === 'Estimate' ? 'QUOTATION' : 'BILL / MEMO'}
                              </p>
                              <h5 className="text-sm font-black text-navy uppercase truncate">{inv.estimateNumber || inv.invoiceNumber}</h5>
                              <p className="text-[9px] font-bold text-teal uppercase tracking-tighter">{safeDateFormatter(inv.date || inv.timestamp)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                            <div>
                              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-xl font-black text-navy">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                              <p className="text-[10px] font-black uppercase text-teal mt-1">{inv.status}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                onClick={() => downloadInvoicePDF(inv)}
                                className="h-10 px-6 rounded-xl bg-navy hover:bg-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy/20"
                              >
                                <Download size={14} className="mr-2" /> PDF
                              </Button>
                              {inv.status !== 'Paid' && inv.status !== 'Verification Pending' && (
                                <label className="cursor-pointer h-10 px-6 rounded-xl bg-teal/10 text-teal hover:bg-teal hover:text-navy font-black text-[10px] uppercase tracking-widest flex items-center justify-center transition-all">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleUploadPaymentProof(inv.id, e)}
                                  />
                                  <Upload size={14} className="mr-2" /> Pay / Upload
                                </label>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reports / Complaints View (when filter is 'reports') */}
              {historyFilter === 'reports' && (
                <div className="space-y-6">
                  {reports.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                      No complaints found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reports.map(report => (
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
                              <p className="text-[7px] font-black text-teal uppercase tracking-widest mb-1">Response from Admin:</p>
                              <p className="text-[10px] font-bold text-navy leading-relaxed italic">"{report.adminNote}"</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  
                  <div className="pt-8 border-t border-gray-100">
                    <h4 className="text-[10px] font-black text-navy uppercase tracking-widest mb-4">Security Settings</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">New Password</label>
                        <input 
                          type="password"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <Button 
                        disabled={isChangingPassword || !newPassword}
                        onClick={handleChangePassword}
                        className="w-full md:w-auto px-8 bg-gray-900 hover:bg-teal text-white h-[52px] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                      >
                        {isChangingPassword ? 'Updating...' : 'Change Password'}
                      </Button>
                    </div>
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

                            {/* Flexible Reach Time (ETA) Configurator for Technician / Partner */}
                            <div className="bg-navy/5 p-4 rounded-3xl border border-navy/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
                                  <Clock size={12} className="text-teal" /> Set Reach Time / पहुंचने का समय
                                </p>
                                {job.eta && (
                                  <span className="text-[8px] font-black text-teal bg-teal/15 px-2.5 py-0.5 rounded-full border border-teal/20">
                                    Active ETA: {job.eta}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  placeholder="e.g. 1 Hour, 2 Hours, Tomorrow 11 AM, In 1-2 Days..."
                                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none focus:border-teal"
                                  value={staffEtaInputs[job.id] !== undefined ? staffEtaInputs[job.id] : (job.eta || '')}
                                  onChange={(e) => setStaffEtaInputs(prev => ({ ...prev, [job.id]: e.target.value }))}
                                />
                                <Button 
                                  size="sm"
                                  onClick={async () => {
                                    const val = staffEtaInputs[job.id] !== undefined ? staffEtaInputs[job.id] : job.eta;
                                    if (!val) {
                                      toast.error('Please enter or select reach time (e.g. 1 Hour, 2 Hours, 1 Day).');
                                      return;
                                    }
                                    await dataService.updateDoc('bookings', job.id, { eta: val });
                                    if (job.userId) {
                                      await dataService.addDoc('notifications', {
                                        userId: job.userId,
                                        title: 'Technician Arrival Update',
                                        message: `${profile?.name || 'Technician'} will reach your premises by: ${val}.`,
                                        type: 'booking_update',
                                        read: false,
                                        timestamp: new Date().toISOString(),
                                        link: '/dashboard'
                                      }).catch(() => {});
                                    }
                                    toast.success(`Arrival ETA updated! Customer notified: "${val}"`);
                                  }}
                                  className="bg-navy hover:bg-teal hover:text-navy text-white text-[9px] font-black uppercase tracking-wider rounded-xl px-4 h-9 shadow-sm"
                                >
                                  Save ETA
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {['30 mins', '1 Hour', '2 Hours', 'Today Evening', 'Tomorrow (11 AM)', 'In 1-2 Days'].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setStaffEtaInputs(prev => ({ ...prev, [job.id]: preset }))}
                                    className="text-[8px] font-black uppercase px-2 py-1 rounded-lg border bg-white hover:bg-gray-100 text-gray-600 border-gray-200 transition-all"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-52 flex flex-col gap-2.5 justify-center">
                            {(job.status === 'Assigned' || job.status === 'Accepted') && (
                              <Button 
                                onClick={async () => {
                                  await dataService.updateDoc('bookings', job.id, { status: 'On the Way' });
                                  if (job.userId) {
                                    await dataService.addDoc('notifications', {
                                      userId: job.userId,
                                      title: 'Technician On The Way!',
                                      message: `${profile?.name || 'Technician'} is on the way to your location.`,
                                      type: 'booking_update',
                                      read: false,
                                      timestamp: new Date().toISOString(),
                                      link: '/dashboard'
                                    }).catch(() => {});
                                  }
                                  toast.success('Status updated: On The Way!');
                                }}
                                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md animate-pulse"
                              >
                                🚗 I'm On The Way
                              </Button>
                            )}

                            {job.status === 'On the Way' && (
                              <Button 
                                onClick={async () => {
                                  await dataService.updateDoc('bookings', job.id, { status: 'Arrived' });
                                  if (job.userId) {
                                    await dataService.addDoc('notifications', {
                                      userId: job.userId,
                                      title: 'Technician Arrived!',
                                      message: `${profile?.name || 'Technician'} has arrived at your address.`,
                                      type: 'booking_update',
                                      read: false,
                                      timestamp: new Date().toISOString(),
                                      link: '/dashboard'
                                    }).catch(() => {});
                                  }
                                  toast.success('Status updated: Arrived at location!');
                                }}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md"
                              >
                                📍 I Have Arrived
                              </Button>
                            )}

                            {(job.status === 'Arrived' || job.status === 'Accepted' || job.status === 'On the Way') && (
                              <Button 
                                onClick={async () => {
                                  await dataService.updateDoc('bookings', job.id, { status: 'In Progress' });
                                  if (job.userId) {
                                    await dataService.addDoc('notifications', {
                                      userId: job.userId,
                                      title: 'Service In Progress',
                                      message: `Your ${job.serviceName} service has started. ${profile?.name || 'Technician'} is on the job.`,
                                      type: 'booking_update',
                                      read: false,
                                      timestamp: new Date().toISOString(),
                                      link: '/dashboard'
                                    }).catch(() => {});
                                  }
                                  toast.success('Service started!');
                                }}
                                className="w-full h-11 bg-blue-600 hover:bg-navy text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md"
                              >
                                🔧 Start Service
                              </Button>
                            )}

                            {job.status === 'In Progress' && (
                              <Button 
                                onClick={async () => {
                                  await dataService.updateDoc('bookings', job.id, { status: 'Completed', completionDate: new Date().toISOString() });
                                  if (job.userId) {
                                    await dataService.addDoc('notifications', {
                                      userId: job.userId,
                                      title: 'Service Completed',
                                      message: `Your ${job.serviceName} service has been completed. Thank you for choosing Atomic Solutions!`,
                                      type: 'booking_update',
                                      read: false,
                                      timestamp: new Date().toISOString(),
                                      link: '/dashboard'
                                    }).catch(() => {});
                                  }
                                  toast.success('Marked as Completed!');
                                }}
                                className="w-full h-11 bg-green-600 hover:bg-navy text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md animate-pulse"
                              >
                                ✅ Mark as Completed
                              </Button>
                            )}

                            {/* In-App Direct Chat with Customer */}
                            <Button 
                              onClick={() => setChatBooking(job)}
                              className="w-full h-11 bg-teal hover:bg-navy hover:text-white text-navy rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              <MessageCircle size={14} className="mr-1.5" /> Chat with Customer
                            </Button>

                            <div className="flex gap-2">
                              {job.userPhone && (
                                <a 
                                  href={`tel:${job.userPhone}`}
                                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-navy font-black text-[9px] uppercase tracking-wider rounded-xl inline-flex items-center justify-center gap-1"
                                >
                                  <Phone size={12} /> Call
                                </a>
                              )}
                              <Button 
                                onClick={() => {
                                  const text = `Hi ${job.userName}, I am reaching out regarding your ${job.serviceName} service.`;
                                  window.open(formatWhatsAppLink(job.whatsappNumber || job.userPhone, text), '_blank');
                                }}
                                variant="outline" 
                                className="flex-1 h-10 border-gray-200 hover:bg-green-50 hover:text-green-600 text-[9px] font-black uppercase tracking-wider rounded-xl inline-flex items-center justify-center gap-1"
                              >
                                <WhatsApp size={12} className="text-green-600" /> WhatsApp
                              </Button>
                            </div>
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

                     {(selectedBooking.staffId || selectedBooking.staffName) && (
                       <div className="p-5 bg-navy rounded-3xl text-white space-y-4 shadow-xl">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-teal text-navy rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden border-2 border-teal shrink-0">
                               {selectedBooking.staffPhoto ? (
                                 <img src={selectedBooking.staffPhoto} alt={selectedBooking.staffName} className="w-full h-full object-cover" />
                               ) : (
                                 selectedBooking.staffName?.[0] || 'T'
                               )}
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                 <p className="text-sm font-black uppercase tracking-tight">{selectedBooking.staffName || 'Technician'}</p>
                                 <span className="text-[7px] font-black bg-teal/20 text-teal px-1.5 py-0.5 rounded border border-teal/30 uppercase flex items-center gap-0.5">
                                   <ShieldCheck size={8} /> Verified
                                 </span>
                               </div>
                               <p className="text-[9px] font-bold text-teal uppercase tracking-widest leading-none mt-0.5">
                                 {selectedBooking.staffCategory || 'HVAC Specialist'}
                               </p>
                               {selectedBooking.staffPhone && (
                                 <p className="text-[10px] font-mono text-white/70 mt-1">📞 {selectedBooking.staffPhone}</p>
                               )}
                             </div>
                           </div>
                           {selectedBooking.eta && (
                             <span className="text-[8px] font-black uppercase tracking-wider bg-teal/20 text-teal border border-teal/30 px-2 py-1 rounded-lg flex items-center gap-1">
                               <Clock size={10} /> ETA {selectedBooking.eta}
                             </span>
                           )}
                         </div>

                         {/* Quick Action buttons */}
                         <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                           <Button 
                             size="sm"
                             onClick={() => {
                               setChatBooking(selectedBooking);
                               setSelectedBooking(null);
                             }}
                             className="bg-teal hover:bg-teal/90 text-navy font-black text-[9px] uppercase tracking-widest rounded-xl h-9 px-4 flex items-center gap-1.5"
                           >
                             <MessageCircle size={14} /> Chat with Technician
                           </Button>
                           {selectedBooking.staffPhone && (
                             <>
                               <a 
                                 href={`tel:${selectedBooking.staffPhone}`}
                                 className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest rounded-xl h-9 px-3 border border-white/10 transition-colors"
                               >
                                 <Phone size={12} className="text-teal" /> Call
                               </a>
                               <a 
                                 href={formatWhatsAppLink(selectedBooking.staffPhone, `Hi ${selectedBooking.staffName}, reaching out regarding my booking ${selectedBooking.serviceName} at Atomic Solutions.`)}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="inline-flex items-center gap-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-black text-[9px] uppercase tracking-widest rounded-xl h-9 px-3 border border-green-500/30 transition-colors"
                               >
                                 <WhatsApp size={12} className="text-green-400" /> WhatsApp
                               </a>
                             </>
                           )}
                         </div>

                         {/* Live GPS Route */}
                         {selectedBooking.technicianLocation?.lat && selectedBooking.technicianLocation?.lng && (
                           <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                             <span className="text-[9px] font-bold text-teal flex items-center gap-1">
                               <Navigation size={12} className="animate-pulse" /> Live GPS Signal Active
                             </span>
                             <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${selectedBooking.technicianLocation.lat},${selectedBooking.technicianLocation.lng}`}
                               target="_blank"
                               rel="noreferrer"
                               className="text-[8px] font-black uppercase text-white bg-teal/20 hover:bg-teal hover:text-navy px-2.5 py-1 rounded-lg transition-colors border border-teal/30"
                             >
                               View on Map
                             </a>
                           </div>
                         )}
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
                        {selectedBooking.status === 'Completed' && selectedBooking.paymentStatus !== 'Received' && (
                          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
                            <div className="bg-teal/5 p-4 rounded-2xl border border-teal/10">
                              <p className="text-xs font-black text-navy uppercase tracking-widest text-center mb-4">Pay Online via QR Code</p>
                              <div className="flex justify-center mb-4">
                                <img 
                                  src="/qr.jpg" 
                                  alt="Scan QR to Pay" 
                                  className="w-32 h-32 object-cover rounded-xl border border-teal/20 shadow-sm"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                              {selectedBooking.paymentStatus === 'Verification Pending' ? (
                                <div className="text-center bg-orange-50 text-orange-600 font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl border border-orange-100">
                                  Screenshot Uploaded - Awaiting Verification
                                </div>
                              ) : (
                                <label className="flex items-center justify-center gap-2 w-full h-12 bg-white border border-teal/20 text-teal hover:bg-teal hover:text-white transition-all rounded-xl cursor-pointer font-black text-[10px] uppercase tracking-widest shadow-sm">
                                  <Upload size={16} /> Upload Payment Screenshot
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleUploadBookingPaymentProof(selectedBooking.id, e)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedBooking.paymentStatus === 'Received' && (
                           <div className="mt-4 text-center bg-green-50 text-green-600 font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                             <CheckCircle2 size={16} /> Payment Received
                           </div>
                        )}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-navy text-sm uppercase tracking-tight truncate pr-2">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-teal rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                      <div className="flex gap-2 shrink-0">
                        {!notif.read && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-teal hover:bg-teal/5" onClick={(e) => { e.stopPropagation(); markNotifRead(notif.id); }}>Clear</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-red-500 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}>Delete</Button>
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
          price={bookingData.price}
          labourPrice={bookingData.labourPrice}
          materialPrice={bookingData.materialPrice}
          staffCategory={selectedService.staffCategory}
          whatsapp="+919582268658"
        />
      )}

      {/* Real-time In-App Chat Modal with Assigned Technician */}
      {chatBooking && user && (
        <BookingChatModal 
          isOpen={!!chatBooking}
          onClose={() => setChatBooking(null)}
          booking={chatBooking}
          currentUserId={user.uid}
          currentUserName={profile?.name || user.displayName || 'Customer'}
          currentUserRole="customer"
        />
      )}
    </div>
  );
}
