import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { CORE_SERVICES, WHATSAPP_NUMBER, DEFAULT_CATEGORIES } from '../constants';
import { Booking, UserProfile, Service, BookingStatus, Category, Review, AppSettings, Notification } from '../types';
import { 
  Users, 
  Calendar, 
  Settings, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  ChevronRight,
  TrendingUp,
  Search,
  IndianRupee,
  Plus,
  Star,
  AlertTriangle,
  Bell,
  Layers,
  Edit,
  Grid,
  ShieldCheck,
  ShieldAlert,
  Save,
  ArrowUp,
  ArrowDown,
  FileText,
  Copy,
  Share2,
  Phone,
  MessageCircle,
  UserCircle,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import BillingCenter from './BillingCenter';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export default function AdminDashboard({ initialTab: propInitialTab }: { initialTab?: string }) {
  const { user, profile, isAdmin, toggleAdminView, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(propInitialTab || 'bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    logoUrl: '',
    whatsappNumber: WHATSAPP_NUMBER,
    phone: '',
    email: '',
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserProfile | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const prevBookingsCount = useRef<number | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (isAdmin) {
      const unsubUsers = dataService.subscribe('users', (data) => setUsers(data as UserProfile[]));
      const unsubInvoices = dataService.subscribe('invoices', (data) => {
        const sorted = (data as any[]).sort((a,b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setAllInvoices(sorted);
      });
      const unsubBookings = dataService.subscribe('bookings', (data) => {
        const sorted = (data as Booking[]).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Detect new bookings
        if (prevBookingsCount.current !== null && sorted.length > prevBookingsCount.current) {
          const newBooking = sorted[0]; // Since it matches sorted by time desc
          if (newBooking.status === 'Pending') {
            toast(`New Booking Received!`, {
              description: `${newBooking.userName} booked ${newBooking.serviceName}`,
              icon: <Bell className="text-blue-600" size={18} />,
              duration: 5000,
            });
            notificationSound.current?.play().catch(e => console.log('Audio disabled by browser policy'));
          }
        }
        
        prevBookingsCount.current = sorted.length;
        setBookings(sorted);
      });
      const unsubServices = dataService.subscribe('services', (data) => {
        if (data.length > 0) {
          setServices(data as Service[]);
        }
      });
      const unsubCategories = dataService.subscribe('categories', (data) => {
        if (data.length > 0) {
          setCategories(data as Category[]);
        }
      });
      const unsubReviews = dataService.subscribe('reviews', (data) => setReviews(data as Review[]));
      const unsubReports = dataService.subscribe('reports', (data) => {
        const sorted = (data as any[]).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReports(sorted);
      });
      const unsubNotifs = dataService.subscribe('notifications', (data) => {
        const adminNotifs = (data as Notification[]).filter(n => n.userId === 'admin');
        setNotifications(adminNotifs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
      const unsubSettings = dataService.subscribe('settings', (data) => {
        if (data && data.length > 0) {
          setAppSettings(data[0] as AppSettings);
        }
      });
      setLoading(false);

      return () => {
        unsubUsers();
        unsubBookings();
        unsubServices();
        unsubCategories();
        unsubReviews();
        unsubReports();
        unsubNotifs();
        unsubSettings();
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    if (propInitialTab) {
      setActiveTab(propInitialTab);
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['bookings', 'users', 'pricing', 'categories', 'reviews', 'billing', 'settings', 'reports'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, [propInitialTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const routeMap: Record<string, string> = {
      'stats': '/admin/dashboard',
      'bookings': '/admin/bookings',
      'billing': '/admin/invoice-generator',
      'pricing': '/admin/services',
      'gallery': '/admin/gallery',
      'settings': '/admin#settings'
    };
    if (routeMap[val]) {
      navigate(routeMap[val]);
    } else {
      window.location.hash = val;
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const booking = bookings.find(b => b.id === id);
      await dataService.updateDoc('bookings', id, { status });
      
      // Create notification for user
      if (booking) {
        await dataService.addDoc('notifications', {
          userId: booking.userId,
          title: `Booking Updated: ${status}`,
          message: `Your booking for ${booking.serviceName} has been marked as ${status}.`,
          type: 'booking_update',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/dashboard'
        });
      }
      
      toast.success(`Booking ${status}`);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const deleteBooking = async (id: string) => {
    if (confirm('Are you sure you want to delete this booking record?')) {
      try {
        await dataService.deleteDoc('bookings', id);
        toast.success('Booking deleted');
      } catch (e) {
        toast.error('Delete failed');
      }
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await dataService.deleteDoc('users', userToDelete.uid);
      toast.success(`User ${userToDelete.name} deleted successfully`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const confirmDelete = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const viewUserHistory = async (targetUser: UserProfile) => {
    setLoading(true);
    setSelectedUserForHistory(targetUser);
    try {
      const [bookingsData, invoicesData] = await Promise.all([
        dataService.getCollection('bookings', [{ field: 'userId', operator: '==', value: targetUser.uid }]),
        dataService.getCollection('invoices', [{ field: 'userId', operator: '==', value: targetUser.uid }])
      ]);
      setUserBookings(bookingsData as Booking[]);
      setUserInvoices(invoicesData);
      setIsHistoryModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch user history");
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturedImageUpload = (serviceId: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateService(serviceId, { featuredImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const existing = await dataService.getDoc('services', serviceId);
      if (!existing) {
        const fullService = services.find(s => s.id === serviceId);
        if (fullService) {
          await dataService.setDoc('services', serviceId, { ...fullService, ...updates });
        }
      } else {
        await dataService.updateDoc('services', serviceId, updates);
      }
      toast.success('Service updated');
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    
    try {
      if (editingCategory) {
        await dataService.updateDoc('categories', editingCategory.id, categoryForm);
        toast.success('Category updated');
      } else {
        const id = categoryForm.name.toLowerCase().replace(/\s+/g, '-');
        await dataService.setDoc('categories', id, { id, ...categoryForm });
        toast.success('Category added');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await dataService.deleteDoc('categories', id);
        toast.success('Category deleted');
      } catch (e) {
        toast.error('Delete failed');
      }
    }
  };

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      await dataService.updateDoc('reviews', id, updates);
      toast.success('Review updated');
    } catch (e) {
      toast.error('Failed to update review');
    }
  };

  const deleteReview = async (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await dataService.deleteDoc('reviews', id);
        toast.success('Review deleted');
      } catch (e) {
        toast.error('Failed to delete review');
      }
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      await dataService.setDoc('settings', 'main', { ...appSettings, ...updates });
      toast.success('Settings updated');
    } catch (e) {
      toast.error('Failed to update settings');
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    toast.info('Generating PDF...', { duration: 2000 });

    // Header Branding
    const logoUrl = appSettings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
    
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
    const addressStr = appSettings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
    doc.text(addressStr, pageWidth / 2, 26, { align: 'center' });
    
    if (appSettings?.ownerGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${appSettings.ownerGSTIN}`, pageWidth / 2, 31, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.text('WE BRING COMFORT LIFE', pageWidth - 20, 12, { align: 'right' });
    doc.text(`MOB:- ${appSettings?.phone || '9582268658'}`, pageWidth - 20, 18, { align: 'right' });

    // SL NO and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const slNoSuffix = invoice.estimateNumber.split('-').pop();
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

    autoTable(doc, {
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

  const updateReport = async (reportId: string, updates: any) => {
    try {
      const report = reports.find(r => r.id === reportId);
      await dataService.updateDoc('reports', reportId, { 
        ...updates,
        updatedAt: new Date().toISOString()
      });

      if (updates.status === 'Resolved' && report) {
        await dataService.addDoc('notifications', {
          userId: report.userId,
          title: 'Issue Resolved!',
          message: `Your issue regarding "${report.title}" has been marked as Resolved. Check details in dashboard.`,
          type: 'INFO',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/dashboard'
        });
      }

      toast.success('Report updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update report');
    }
  };

  const deleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await dataService.deleteDoc('reports', id);
        toast.success('Report deleted');
      } catch (e) {
        toast.error('Failed to delete report');
      }
    }
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

  const deleteService = async (id: string) => {
    if (confirm('Delete this service and all its sub-categories?')) {
      try {
        await dataService.deleteDoc('services', id);
        toast.success('Service deleted');
      } catch (e) {
        toast.error('Failed to delete service');
      }
    }
  };

  const moveService = async (index: number, direction: 'up' | 'down') => {
    const sortedServices = [...services].sort((a,b) => (a.sequence || 0) - (b.sequence || 0));
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sortedServices.length) return;
    
    const current = sortedServices[index];
    const other = sortedServices[targetIndex];
    
    const currentSeq = current.sequence || 0;
    const otherSeq = other.sequence || 0;
    
    await Promise.all([
      updateService(current.id, { sequence: otherSeq }),
      updateService(other.id, { sequence: currentSeq })
    ]);
  };

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const handleSaveService = async () => {
    if (!editingService?.name) {
      toast.error('Service name is required');
      return;
    }

    try {
      const id = editingService.id || editingService.name.toLowerCase().replace(/\s+/g, '-');
      const serviceData = {
        ...editingService,
        id,
        sequence: editingService.sequence || services.length,
        images: editingService.images || [],
        subCategories: editingService.subCategories || []
      };

      if (editingService.id) {
        await dataService.updateDoc('services', editingService.id, serviceData);
        toast.success('Service updated');
      } else {
        await dataService.setDoc('services', id, serviceData);
        toast.success('Service added');
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
    } catch (e) {
      toast.error('Failed to save service');
    }
  };

  const [newReview, setNewReview] = useState({ userName: '', comment: '', rating: 5, date: new Date().toISOString() });
  
  const addReview = async () => {
    if (!newReview.userName || !newReview.comment) {
      toast.error("Please fill name and comment");
      return;
    }
    try {
      await dataService.addDoc('reviews', { ...newReview, isApproved: true, date: new Date().toISOString() });
      toast.success("Review published!");
      setNewReview({ userName: '', comment: '', rating: 5, date: new Date().toISOString() });
    } catch (e) {
      toast.error("Failed to publish review");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 px-4 sm:px-6 lg:px-8 pb-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 font-sans">
          <div>
            <h1 className="text-4xl font-black text-navy tracking-tighter uppercase leading-none mb-2 flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/')}
                className="text-navy hover:text-blue-600 transition-colors"
                title="Go to Website"
              >
                <Home size={28} />
              </motion.button>
              Hello, <span className="text-blue-600">{profile?.name?.split(' ')[0] || 'Mushtak'}</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal" /> 
              Atomic Solutions • Control Panel
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white px-6 py-4 rounded-[24px] border border-gray-100 shadow-xl shadow-navy/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Live Revenue</div>
                  <div className="text-2xl font-black text-navy leading-none">₹{bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}</div>
                </div>
             </div>
             {/* Admin Profile/Settings Button */}
             <div className="flex items-center gap-2">
               <div className="relative">
                 <Button 
                   variant="ghost" 
                   className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-lg text-navy hover:text-blue-600"
                   onClick={() => setIsNotifOpen(true)}
                 >
                   <Bell size={24} />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute top-3 right-3 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[8px] font-black flex items-center justify-center text-white animate-pulse">
                       {notifications.filter(n => !n.read).length}
                     </span>
                   )}
                 </Button>
               </div>
               <Button 
                 variant="ghost" 
                 className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-lg text-navy hover:text-teal"
                 onClick={() => handleTabChange('settings')}
               >
                 <Settings size={24} />
               </Button>
             </div>
          </div>
        </header>

        {/* Global Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard title="Active Users" value={users.length} icon={<Users />} color="bg-blue-500" />
          <StatCard title="Total Orders" value={bookings.length} icon={<Calendar />} color="bg-teal" />
          <StatCard title="Pending" value={bookings.filter(b => b.status === 'Pending').length} icon={<Clock />} color="bg-orange-500" />
          <StatCard title="Reviews" value={reviews.length} icon={<Star />} color="bg-purple-500" />
        </div>

        {/* The Power Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tile A: Dashboard Summary */}
          <AdminTile 
            title="Business Dashboard" 
            desc="Today's stats, revenue trends, and quick summaries."
            icon={<Grid className="w-8 h-8" />}
            color="bg-blue-600"
            onClick={() => navigate('/admin/dashboard')}
          />

          {/* Tile B: Invoice Builder */}
          <AdminTile 
            title="Invoice Builder" 
            desc="Create professional invoices or estimates and share via WhatsApp."
            icon={<FileText className="w-8 h-8" />}
            color="bg-navy"
            onClick={() => navigate('/admin/invoice-generator')}
          />

          {/* Tile C: Manage Bookings */}
          <AdminTile 
            title="Manage Bookings" 
            desc="View, confirm, or cancel customer service requests."
            icon={<Calendar className="w-8 h-8" />}
            color="bg-teal"
            onClick={() => navigate('/admin/bookings')}
            badge={bookings.filter(b => b.status === 'Pending').length}
          />

          {/* Tile D: Service Manager */}
          <AdminTile 
            title="Service Manager" 
            desc="Add, edit, or remove services and categories from rate list."
            icon={<Layers className="w-8 h-8" />}
            color="bg-purple-600"
            onClick={() => navigate('/admin/services')}
          />

          {/* Tile E: Media Gallery */}
          <AdminTile 
            title="Media Gallery" 
            desc="Upload photos, videos and manage your showcase."
            icon={<ImageIcon className="w-8 h-8" />}
            color="bg-rose-500"
            onClick={() => navigate('/admin/gallery')}
          />

          {/* Tile F: Invoice Archive */}
          <AdminTile 
            title="Invoice Archive" 
            desc="View, manage and download all past invoices and estimates."
            icon={<FileText className="w-8 h-8" />}
            color="bg-teal"
            onClick={() => navigate('/admin/invoices')}
          />

          {/* Tile H: Reports Archive */}
          <AdminTile 
            title="Customer Complaints" 
            desc="Manage and resolve customer reported problems/issues."
            icon={<AlertTriangle className="w-8 h-8" />}
            color="bg-red-500"
            onClick={() => setActiveTab('reports')}
            badge={reports.filter(r => r.status === 'Pending').length}
          />

          {/* Tile G: Review Share */}
          <AdminTile 
            title="Review Request" 
            desc="Get your public review link and QR code to share with clients."
            icon={<Star className="w-8 h-8" />}
            color="bg-gold"
            onClick={() => setActiveTab('reviews-share')}
          />

        </div>

        {/* User View Toggle - Separate below grid */}
        <div className="flex justify-center mb-12">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleAdminView}
            className="group flex flex-col md:flex-row items-center gap-6 bg-white hover:bg-gray-50 px-12 py-6 rounded-[32px] shadow-xl shadow-navy/5 border border-gray-100 transition-all border-b-4 border-b-gray-200 hover:border-b-teal"
          >
             <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-navy group-hover:bg-teal group-hover:text-white transition-colors">
               <UserCircle size={28} />
             </div>
             <div className="text-left">
               <h3 className="text-lg font-black text-navy uppercase tracking-tighter leading-tight">Switch to Customer View</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Review the website as a normal visitor</p>
             </div>
             <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-teal uppercase tracking-widest ml-12 opacity-0 group-hover:opacity-100 transition-all">
               Switch Now <ChevronRight size={14} />
             </div>
          </motion.button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tabs Content Sections */}
          <TabsContent value="stats">
             {/* Stats Summary View */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="rounded-[40px] border-none shadow-xl p-8 bg-white">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-teal" /> Booking Trends
                  </h3>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[35, 45, 30, 60, 80, 55, 90].map((h, i) => (
                      <div key={i} className="flex-1 bg-teal/10 rounded-t-xl relative group">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="absolute bottom-0 left-0 right-0 bg-teal rounded-t-xl group-hover:bg-navy transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
               </Card>
               <Card className="rounded-[40px] border-none shadow-xl p-8 bg-white">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-6 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" /> Quick User List
                  </h3>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold">{u.name[0]}</div>
                           <div>
                             <div className="text-sm font-black text-navy">{u.name}</div>
                             <div className="text-[10px] font-bold text-gray-400">{u.phone}</div>
                           </div>
                         </div>
                         <Button size="icon" variant="ghost" className="rounded-lg h-8 w-8"><ChevronRight size={16} /></Button>
                      </div>
                    ))}
                  </div>
               </Card>
             </div>
          </TabsContent>

          <TabsContent value="bookings">
             <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search bookings by customer or service..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm flex-wrap">
                {(['All', 'Pending', 'Accepted', 'Completed', 'Rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === status 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'text-gray-400 hover:text-navy'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                  <TableRow>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Customer</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Service</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Price</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12">Appointment</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12 text-center">Status</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight mb-1">{booking.userName}</span>
                          <div className="flex items-center gap-2 mb-1">
                             <a href={`tel:${booking.userPhone}`} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                               <Phone size={10} /> {booking.userPhone}
                             </a>
                             {booking.whatsappNumber && (
                               <a href={`https://wa.me/${booking.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1">
                                 <MessageCircle size={10} /> WhatsApp
                               </a>
                             )}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px] font-medium">{booking.userAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
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
                              <span className="text-xs font-black text-navy">{new Date(booking.appointmentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="text-[10px] font-bold text-teal uppercase tracking-tight">{booking.appointmentSlot}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-gray-500">{new Date(booking.timestamp).toLocaleDateString()}</span>
                              <span className="text-[9px] text-gray-400 uppercase">ASAP Request</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge className={`rounded-lg uppercase text-[9px] font-black px-2 py-1 shadow-sm ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
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
                             className="h-8 w-8 text-green-600 rounded-lg flex items-center justify-center bg-green-50"
                             onClick={() => {
                               const text = `Hi ${booking.userName}, regarding your booking for ${booking.serviceName} on ${booking.appointmentDate || 'ASAP'}...`;
                               window.open(`https://wa.me/${booking.whatsappNumber || booking.userPhone}?text=${encodeURIComponent(text)}`, '_blank');
                             }}
                           >
                             <MessageCircle size={14} />
                           </motion.button>
                           {booking.status === 'Pending' && (
                             <>
                               <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center" onClick={() => updateBookingStatus(booking.id, 'Accepted')} title="Accept"><CheckCircle size={16} /></motion.button>
                               <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center" onClick={() => updateBookingStatus(booking.id, 'In Progress')} title="Start Work"><Clock size={16} /></motion.button>
                               <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center" onClick={() => updateBookingStatus(booking.id, 'Rejected')} title="Reject"><XCircle size={16} /></motion.button>
                             </>
                           )}
                           {['Accepted', 'In Progress'].includes(booking.status) && (
                             <div className="flex gap-1">
                               {booking.status === 'Accepted' && (
                                 <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center" onClick={() => updateBookingStatus(booking.id, 'In Progress')} title="In Progress"><Clock size={16} /></motion.button>
                               )}
                               <motion.button whileTap={{ scale: 0.9 }} size="sm" variant="outline" className="h-8 px-3 border-navy/20 text-navy font-black text-[10px] uppercase rounded-lg hover:bg-navy hover:text-white" onClick={() => updateBookingStatus(booking.id, 'Completed')}>Done</motion.button>
                             </div>
                           )}
                           <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg flex items-center justify-center" onClick={() => deleteBooking(booking.id)} title="Delete"><Trash2 size={14} /></motion.button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                  <TableRow>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">User Details</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">Contact</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6">Address</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 mx-auto">Role</TableHead>
                    <TableHead className="font-bold text-gray-900 uppercase text-[10px] tracking-widest px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                      <TableCell className="px-6 py-4 font-bold text-gray-900">{user.name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col text-sm font-medium text-gray-600">
                          <span>{user.phone}</span>
                          <span className="text-[11px] opacity-70">{user.email || 'No email'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-medium text-gray-500 max-w-xs truncate">{user.address}</TableCell>
                      <TableCell className="px-6 py-4">
                        {user.isAdmin ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Admin</Badge> : <Badge variant="outline">User</Badge>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-blue-600 hover:bg-blue-50" 
                            onClick={() => viewUserHistory(user)}
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
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Invoice Archive</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full Transaction History & PDF Access</p>
                </div>
                <div className="flex gap-2">
                   <Button 
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                    className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/admin/invoice-generator')}
                    className="bg-navy hover:bg-navy/90 text-white rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus size={16} className="text-teal" /> Create New
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Invoice No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Customer</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-right">Amount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-14 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInvoices.map((inv) => (
                      <TableRow key={inv.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                        <TableCell className="px-8 py-5 font-black text-navy text-sm">#{inv.invoiceNumber || inv.estimateNumber}</TableCell>
                        <TableCell className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-navy text-sm uppercase tracking-tight">{inv.customerName}</span>
                            <span className="text-[10px] font-medium text-gray-400">{inv.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${inv.type === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {inv.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-1 italic border-gray-200">
                            {inv.status || 'Saved'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-sm font-medium text-gray-500">
                          {new Date(inv.timestamp || inv.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right font-black text-navy text-sm">₹{inv.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-4 rounded-xl border-gray-100 font-black text-[9px] uppercase tracking-widest hover:border-teal hover:text-teal transition-all"
                               onClick={() => navigate(`/invoice/${inv.id}`)}
                             >
                               View
                             </Button>
                             <Button 
                               size="sm" 
                               className="h-9 w-9 p-0 rounded-xl bg-navy hover:bg-navy/90 text-white transition-all hover:scale-105"
                               onClick={() => downloadInvoicePDF(inv)}
                             >
                               <Download size={16} />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                              <FileText size={32} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No invoices generated yet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-red-50/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Customer Complaints</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Resolution Center & Communication</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {reports.filter(r => r.status === 'Pending').length} Pending
                  </Badge>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 gap-6">
                  {reports.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <CheckCircle size={40} />
                      </div>
                      <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No customer complaints reported yet</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 hover:border-red-100 transition-all group">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <Badge className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                                report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {report.status}
                              </Badge>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{report.id.slice(-6)}</span>
                              <span className="text-[10px] font-bold text-gray-400">• {new Date(report.createdAt).toLocaleString()}</span>
                            </div>

                            <h3 className="text-xl font-black text-navy uppercase tracking-tight mb-3">{report.title}</h3>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 bg-white p-4 rounded-2xl border border-gray-100">{report.description}</p>
                            
                            <div className="flex items-center gap-6 text-[10px] uppercase font-black tracking-widest text-navy mb-6">
                              <div className="flex items-center gap-2">
                                <UserCircle size={16} className="text-gray-300" /> {report.userName}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-300" /> {report.userPhone}
                              </div>
                            </div>

                            {report.attachments && report.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-4 mb-6">
                                {report.attachments.map((file: any, i: number) => (
                                  <div key={i} className="relative group/media cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                                      {file.type === 'image' ? (
                                        <img src={file.url} className="w-full h-full object-cover transition-transform group-hover/media:scale-110" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-navy text-teal"><VideoIcon size={32} /></div>
                                      )}
                                    </div>
                                    <div onClick={() => window.open(file.url, '_blank')} className="absolute inset-0 bg-navy/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                      <Search size={20} className="text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="lg:w-80 space-y-4">
                            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Update Status</label>
                              <div className="flex flex-wrap gap-2">
                                {['Pending', 'In Progress', 'Resolved'].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateReport(report.id, { status: s })}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                      report.status === s ? 'bg-navy text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                              
                              <div className="pt-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1 mb-2">Admin Note (Visible to Customer)</label>
                                <textarea 
                                  value={report.adminNote || ''}
                                  onChange={(e) => updateReport(report.id, { adminNote: e.target.value })}
                                  placeholder="Write a response or update here..."
                                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium text-navy outline-none focus:border-navy transition-all resize-none"
                                  rows={3}
                                />
                              </div>
                              <Button 
                                onClick={() => deleteReport(report.id)}
                                variant="ghost"
                                className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest"
                              >
                                <Trash2 size={12} className="mr-2" /> Delete Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews-share" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Review Request Tool</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Generate links and QR codes to get more feedback</p>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Link Generation */}
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Your Review Page Link</label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy text-sm shadow-inner truncate">
                          {window.location.origin}/reviews
                        </div>
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/reviews`);
                            toast.success('Link copied to clipboard!');
                          }}
                          className="h-14 w-14 rounded-2xl bg-navy text-white flex items-center justify-center shrink-0 hover:bg-teal transition-all"
                        >
                          <Copy size={20} />
                        </Button>
                      </div>
                      <p className="text-[10px] font-medium text-gray-400 mt-4 uppercase tracking-widest italic">
                        Share this link on WhatsApp, Facebook, or Instagram to collect reviews.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => {
                          const text = encodeURIComponent(`Hi! We'd love to hear your feedback on your recent service at Atomic Solutions. Please leave us a review here: ${window.location.origin}/reviews`);
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        }}
                        className="h-16 rounded-2xl bg-[#25D366] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={18} /> WhatsApp Share
                      </Button>
                      <Button 
                         onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'Review Atomic Solutions',
                              text: 'We value your feedback! Please leave us a review.',
                              url: `${window.location.origin}/reviews`
                            });
                          } else {
                            toast.info('Sharing not supported on this browser');
                          }
                        }}
                        className="h-16 rounded-2xl bg-navy text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Share2 size={18} /> Social Share
                      </Button>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-navy rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-teal/30">
                        <Star size={12} fill="currentColor" />
                        Scan to Review
                      </div>
                      
                      <div className="bg-white p-6 rounded-[32px] mb-6 shadow-2xl shadow-teal/20 border-8 border-navy/50">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/reviews')}`} 
                          alt="Review QR Code" 
                          className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                        />
                      </div>

                      <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Atomic Solutions</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Official Feedback Channel</p>

                      <Button 
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(window.location.origin + '/reviews')}`;
                          link.download = 'Review_QR_Code.png';
                          window.open(link.href, '_blank');
                        }}
                        className="rounded-xl border-white/20 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest"
                      >
                        <Download size={14} className="mr-2" /> Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Manage Services</h3>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-blue-200 text-blue-600 font-bold"
                      onClick={() => setActiveTab('categories')}
                    >
                      <Layers size={16} className="mr-2" /> Manage Categories
                    </Button>
                    <Button 
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={() => {
                        setEditingService({ name: '', category: categories[0]?.name, images: [], subCategories: [] });
                        setIsServiceModalOpen(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" /> Add Service
                    </Button>
                  </div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {services.sort((a,b) => (a.sequence || 0) - (b.sequence || 0)).map((s, index) => (
                    <div key={s.id} className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 hover:border-blue-200 transition-colors relative group">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveService(index, 'up')}><ArrowUp size={14} /></Button>
                           <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveService(index, 'down')}><ArrowDown size={14} /></Button>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center gap-3">
                              <div>
                                 <h4 className="font-black text-navy uppercase tracking-tighter text-lg">{s.name}</h4>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sequence: {s.sequence || 0}</span>
                              </div>
                              <Badge className={s.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {s.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                           </div>
                           <div className="flex items-center gap-2">
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-8 text-[10px] font-black uppercase"
                               onClick={() => updateService(s.id, { isActive: s.isActive === false })}
                             >
                               {s.isActive === false ? 'Enable' : 'Disable'}
                             </Button>
                             <select 
                               className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold"
                               value={s.category}
                               onChange={(e) => updateService(s.id, { category: e.target.value })}
                             >
                               {categories.map(c => (
                                 <option key={c.id} value={c.name}>{c.name}</option>
                               ))}
                             </select>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => deleteService(s.id)}>
                               <Trash2 size={16} />
                             </Button>
                           </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                           <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                             <div>
                                <h5 className="font-black text-blue-700 text-[10px] uppercase tracking-widest mb-1">Sub-categories & Pricing</h5>
                             </div>
                             <Button 
                                size="sm" 
                                className="rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase"
                                onClick={() => {
                                  const newSub = { id: `sub-${Date.now()}`, name: 'New Sub-category', minPrice: 0, maxPrice: 0 };
                                  updateService(s.id, { subCategories: [...(s.subCategories || []), newSub] });
                                }}
                              >
                                <Plus size={14} className="mr-1" /> Add
                              </Button>
                           </div>

                           <div className="space-y-3">
                              {(s.subCategories || []).map((sub, idx) => (
                                <div key={sub.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex gap-4 mb-3">
                                    <div className="flex-1">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Sub-category Name</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs focus:bg-white focus:border-blue-100 outline-none transition-all"
                                        value={sub.name}
                                        onChange={(e) => {
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, name: e.target.value };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                    <div className="w-24">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Unit (e.g. Sq. Ft)</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        value={sub.unit || ''}
                                        onChange={(e) => {
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, unit: e.target.value };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 mt-5"
                                      onClick={() => {
                                        const newSubs = (s.subCategories || []).filter(item => item.id !== sub.id);
                                        updateService(s.id, { subCategories: newSubs });
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                      <label className="text-[8px] font-black text-blue-400 tracking-widest uppercase block mb-1">Labour Min (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-blue-50/30 border border-blue-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-blue-200"
                                        value={sub.labourMin || 0}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, labourMin: val };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-blue-400 tracking-widest uppercase block mb-1">Labour Max (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-blue-50/30 border border-blue-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-blue-200"
                                        value={sub.labourMax || 0}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, labourMax: val };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-green-400 tracking-widest uppercase block mb-1">Mat Min (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-green-50/30 border border-green-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-green-200"
                                        value={sub.materialMin || 0}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, materialMin: val };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-green-400 tracking-widest uppercase block mb-1">Mat Max (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-green-50/30 border border-green-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-green-200"
                                        value={sub.materialMax || 0}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, materialMax: val };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Fallback Min (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        value={sub.minPrice}
                                        onChange={(e) => {
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, minPrice: Number(e.target.value) };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Fallback Max (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        value={sub.maxPrice}
                                        onChange={(e) => {
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, maxPrice: Number(e.target.value) };
                                          updateService(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1 mb-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">YouTube Video ID</label>
                          <input 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm" 
                            defaultValue={s.youtubeId} 
                            placeholder="e.g. dQw4w9WgXcQ"
                            onBlur={(e) => updateService(s.id, { youtubeId: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block text-sm">Images (URLs, one per line)</label>
                          <textarea 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-xs h-24" 
                            defaultValue={(s.images || []).join('\n')} 
                            onBlur={(e) => updateService(s.id, { images: e.target.value.split('\n').filter(l => l.trim()) })}
                          />
                        </div>

                        <div className="space-y-2 mt-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Featured Image</label>
                          <div className="flex items-center gap-4">
                            {s.featuredImage && (
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                <img src={s.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFeaturedImageUpload(s.id, e.target.files?.[0] || null)}
                                className="w-full text-xs text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-[10px] file:font-black file:uppercase file:tracking-widest
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Detailed Description (Rich Text)</label>
                          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 ql-container-hover">
                            <ReactQuill 
                              theme="snow" 
                              value={s.detailedDescription || ''} 
                              onChange={(content) => {
                                updateService(s.id, { detailedDescription: content });
                              }}
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, false] }],
                                  ['bold', 'italic', 'underline'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}],
                                  ['link', 'clean']
                                ],
                              }}
                            />
                          </div>
                        </div>
                    </div>
                  ))}
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Service Categories</h3>
                  <Button 
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    onClick={() => openCategoryModal()}
                  >
                    <Plus size={16} className="mr-2" /> Add Category
                  </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {categories.map(category => (
                   <div key={category.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-center mb-4">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                         <Grid size={24} />
                       </div>
                       <div className="flex gap-2">
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openCategoryModal(category)}>
                           <Edit size={16} />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                           <Trash2 size={16} />
                         </Button>
                       </div>
                     </div>
                     <h4 className="text-lg font-black text-navy uppercase tracking-tight mb-2">{category.name}</h4>
                     <p className="text-sm text-gray-500 line-clamp-2">{category.description || 'No description provided.'}</p>
                   </div>
                 ))}
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
               <BillingCenter services={services} whatsapp={appSettings.whatsappNumber} />
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="rounded-[40px] border-none shadow-xl shadow-navy/5 p-8 bg-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Media Showcase Manager</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Categorized Portfolio Management</p>
                </div>
                <div className="flex flex-wrap gap-3">
                   <Button 
                    variant="outline" 
                    className="rounded-2xl border-gray-200 text-navy font-black text-[10px] uppercase tracking-widest h-14 px-8 hover:bg-gray-50"
                    onClick={() => {
                      const url = prompt('Enter Video ID (YouTube):');
                      const title = prompt('Video Title:', 'Work Showcase');
                      if (url) {
                         const videos = appSettings.videos || [];
                         updateSettings({ videos: [...videos, { id: Date.now().toString(), url, title }] });
                      }
                    }}
                  >
                    <Plus size={16} className="mr-2 text-rose-500" /> Add YouTube
                  </Button>
                  <Button 
                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest h-14 px-8 shadow-xl shadow-blue-200"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const gallery = appSettings.gallery || [];
                              updateSettings({ gallery: [...gallery, reader.result as string] });
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <ImageIcon size={16} className="mr-2" /> Upload Photos
                  </Button>
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <h4 className="text-sm font-black text-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ImageIcon size={16} className="text-blue-600" /> Photo Library
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(appSettings.gallery || []).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100">
                        <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                               const newGallery = (appSettings.gallery || []).filter((_, i) => i !== idx);
                               updateSettings({ gallery: newGallery });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!appSettings.gallery || appSettings.gallery.length === 0) && (
                      <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Photos Uploaded Yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                   <h4 className="text-sm font-black text-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageCircle size={16} className="text-red-600" /> Video Showcase
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(appSettings.videos || []).map((video, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-3xl p-4 border border-gray-100 relative group">
                        <div className="aspect-video bg-navy rounded-2xl overflow-hidden mb-3">
                           <iframe 
                            src={`https://www.youtube.com/embed/${video.url}`} 
                            className="w-full h-full" 
                            allowFullScreen 
                           />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-navy uppercase tracking-tight">{video.title}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => {
                               const newVideos = (appSettings.videos || []).filter((_, i) => i !== idx);
                               updateSettings({ videos: newVideos });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
             <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="md:col-span-1 bg-navy p-8 rounded-[32px] text-white">
                      <h3 className="text-xl font-black uppercase mb-6 tracking-tighter">Add New Review</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-teal uppercase tracking-widest block mb-2">Customer Name</label>
                          <input 
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:border-teal outline-none"
                            value={newReview.userName}
                            onChange={(e) => setNewReview({...newReview, userName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-teal uppercase tracking-widest block mb-2">Rating (1-5)</label>
                          <select 
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:border-teal outline-none"
                            value={newReview.rating}
                            onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                          >
                            <option value="5" className="bg-navy">5 Stars</option>
                            <option value="4" className="bg-navy">4 Stars</option>
                            <option value="3" className="bg-navy">3 Stars</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-teal uppercase tracking-widest block mb-2">Comment</label>
                          <textarea 
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm h-32 focus:border-teal outline-none"
                            value={newReview.comment}
                            onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                          />
                        </div>
                        <Button className="w-full bg-teal hover:bg-teal/90 h-14 rounded-xl font-black tracking-widest" onClick={addReview}>
                          PUBLISH REVIEW
                        </Button>
                      </div>
                   </div>
                   <div className="md:col-span-2 space-y-4">
                       <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-6">Recent Customer Feedback</h3>
                       <div className="space-y-4">
                        {reviews.length === 0 && <p className="text-gray-400 italic">No reviews yet.</p>}
                        {reviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(review => (
                          <div key={review.id} className={`p-6 rounded-[32px] border transition-all ${review.isApproved ? 'bg-green-50/30 border-green-100' : 'bg-orange-50/30 border-orange-100'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-navy">{review.userName}</h4>
                                  <Badge className={review.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                    {review.isApproved ? 'Approved' : 'Pending Approval'}
                                  </Badge>
                                </div>
                                <div className="flex gap-1 mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-600 font-medium mb-2">{review.comment}</p>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2">
                                {!review.isApproved ? (
                                  <Button size="icon" variant="ghost" className="h-10 w-10 text-green-600 hover:bg-green-100" onClick={() => updateReview(review.id, { isApproved: true })}>
                                    <ShieldCheck size={20} />
                                  </Button>
                                ) : (
                                  <Button size="icon" variant="ghost" className="h-10 w-10 text-orange-600 hover:bg-orange-100" onClick={() => updateReview(review.id, { isApproved: false })}>
                                    <ShieldAlert size={20} />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-10 w-10 text-red-600 hover:bg-red-100" onClick={() => deleteReview(review.id)}>
                                  <Trash2 size={20} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                       </div>
                    </div>
                 </div>
              </Card>
           </TabsContent>


           <TabsContent value="settings">
              <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
                 <div className="max-w-2xl">
                    <h3 className="text-2xl font-black text-navy uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <Settings className="text-blue-600" /> General Settings
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 space-y-6">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Company Logo</label>
                              <div className="flex items-center gap-6">
                                 {appSettings.logoUrl && (
                                   <div className="w-24 h-24 bg-white rounded-2xl border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                                      <img src={appSettings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                   </div>
                                 )}
                                 <div className="flex-1">
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      className="w-full text-xs text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-[10px] file:font-black file:uppercase file:tracking-widest
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setAppSettings({ ...appSettings, logoUrl: reader.result as string });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2">Upload a business logo</p>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">WhatsApp Number (with country code)</label>
                            <div className="relative">
                              <input 
                                className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
                                value={appSettings.whatsappNumber}
                                onChange={(e) => setAppSettings({...appSettings, whatsappNumber: e.target.value})}
                                placeholder="91XXXXXXXXXX"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                                <span className="text-[8px] font-black italic">WA</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">Important: Do not add '+' or '-' or spaces.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Contact Phone</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.phone}
                                  onChange={(e) => setAppSettings({...appSettings, phone: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Support Email</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.email}
                                  onChange={(e) => setAppSettings({...appSettings, email: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Business GSTIN</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.ownerGSTIN || ''}
                                  onChange={(e) => setAppSettings({...appSettings, ownerGSTIN: e.target.value})}
                                  placeholder="e.g. 12ABCDE1234F1Z5"
                                />
                             </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Office Address</label>
                            <textarea 
                              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy h-24"
                              value={appSettings.address}
                              onChange={(e) => setAppSettings({...appSettings, address: e.target.value})}
                            />
                          </div>

                          <div className="space-y-4 pt-4 border-t border-gray-200">
                            <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Social Media Links</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[8px] font-black text-blue-600 tracking-widest uppercase">Facebook URL</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.facebookUrl || ''}
                                  onChange={(e) => setAppSettings({...appSettings, facebookUrl: e.target.value})}
                                  placeholder="https://facebook.com/..."
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[8px] font-black text-pink-600 tracking-widest uppercase">Instagram URL</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.instagramUrl || ''}
                                  onChange={(e) => setAppSettings({...appSettings, instagramUrl: e.target.value})}
                                  placeholder="https://instagram.com/..."
                                />
                              </div>
                              <div className="space-y-2 lg:col-span-2">
                                <label className="text-[8px] font-black text-red-600 tracking-widest uppercase">YouTube URL</label>
                                <input 
                                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-navy"
                                  value={appSettings.youtubeUrl || ''}
                                  onChange={(e) => setAppSettings({...appSettings, youtubeUrl: e.target.value})}
                                  placeholder="https://youtube.com/@..."
                                />
                              </div>
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-[24px] font-black tracking-widest text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                            onClick={() => updateSettings(appSettings)}
                          >
                            <Save size={20} />
                            SAVE ALL SETTINGS
                          </Button>
                       </div>
                    </div>
                 </div>
              </Card>
           </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBookingForDetails} onOpenChange={() => setSelectedBookingForDetails(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-navy p-8 text-white relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Request Details</DialogTitle>
            <DialogDescription className="text-teal font-bold uppercase tracking-widest text-[10px] mt-1">
              Internal Ticket: #{selectedBookingForDetails?.id?.slice(-8).toUpperCase()}
            </DialogDescription>
            <button 
              onClick={() => setSelectedBookingForDetails(null)}
              className="absolute top-6 right-6 text-white/40 hover:text-white"
            >
              <XCircle size={24} />
            </button>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Customer Info Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Customer Profile</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Name</div>
                  <div className="font-black text-navy">{selectedBookingForDetails?.userName}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Phone</div>
                  <div className="font-black text-navy">{selectedBookingForDetails?.userPhone}</div>
                </div>
              </div>
            </div>

            {/* Specialized Planning Details */}
            {selectedBookingForDetails?.type === 'PLANNING_REQUEST' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-teal uppercase tracking-[0.2em] px-1">House Planning Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl overflow-hidden">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Plot Size</div>
                    <div className="font-black text-navy truncate">{selectedBookingForDetails?.details?.plotSize}</div>
                  </div>
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Rooms</div>
                    <div className="font-black text-navy">{selectedBookingForDetails?.details?.rooms}</div>
                  </div>
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Type</div>
                    <div className="font-black text-navy">{selectedBookingForDetails?.subCategory}</div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 italic">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-2">Customer Requirement Message</div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">
                    "{selectedBookingForDetails?.details?.description || 'No additional notes provided'}"
                  </p>
                </div>
              </div>
            )}

            {/* Standard Service Details */}
            {selectedBookingForDetails?.type !== 'PLANNING_REQUEST' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Service Information</h4>
                <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-black text-navy text-lg">{selectedBookingForDetails?.serviceName}</div>
                      <div className="text-[10px] font-black text-teal uppercase mt-1">{selectedBookingForDetails?.subCategory}</div>
                    </div>
                    <Badge className="bg-navy text-white text-[9px] px-3 py-1 uppercase">{selectedBookingForDetails?.tier}</Badge>
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Base Price</span>
                    <span className="text-xl font-black text-navy">₹{selectedBookingForDetails?.price}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Management</h4>
              <div className="flex flex-wrap gap-2">
                {(['Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateBookingStatus(selectedBookingForDetails.id, status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedBookingForDetails?.status === status 
                        ? 'bg-navy text-white shadow-lg' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
            <Button 
              className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
              onClick={() => {
                const text = `Hi ${selectedBookingForDetails?.userName}, regarding your ${selectedBookingForDetails?.serviceName} request...`;
                window.open(`https://wa.me/${selectedBookingForDetails?.whatsappNumber || selectedBookingForDetails?.userPhone}?text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              <MessageCircle size={18} /> Contact on WhatsApp
            </Button>
            <Button 
              variant="outline"
              className="h-14 px-8 border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl"
              onClick={() => setSelectedBookingForDetails(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium mt-2">
              Are you sure you want to delete <span className="font-bold text-navy">{userToDelete?.name}</span>? This action cannot be undone and will remove all their profile data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={deleteUser}
              className="flex-1 rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
              <Layers size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Category Name</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500 transition-colors"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Building"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Description</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-xs h-32 outline-none focus:border-blue-500 transition-colors"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Briefly describe what this category includes..."
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              className="flex-1 rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service CRUD Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
              <Plus size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">
              {editingService?.id ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Service Name</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500 transition-colors"
                value={editingService?.name || ''}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                placeholder="e.g. HVAC Solutions"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Main Category</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500 transition-colors"
                value={editingService?.category || ''}
                onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">YouTube Video ID</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm"
                value={editingService?.youtubeId || ''}
                onChange={(e) => setEditingService({ ...editingService, youtubeId: e.target.value })}
                placeholder="e.g. M7lc1UVf-VE"
              />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <input 
                type="checkbox"
                id="is-active-check"
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
                checked={editingService?.isActive !== false}
                onChange={(e) => setEditingService({ ...editingService, isActive: e.target.checked })}
              />
              <label htmlFor="is-active-check" className="text-sm font-bold text-gray-700 cursor-pointer">
                Service is Active (Visible on Website)
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsServiceModalOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveService}
              className="flex-1 rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
            >
              Save Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Drawer/Modal */}
      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] p-0 overflow-hidden outline-none font-sans border-none shadow-2xl">
          <div className="bg-navy p-8 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Bell className="text-teal" /> Notifications
              </DialogTitle>
              <DialogDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Business Activity & Alerts
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto text-navy/20">
                  <Bell size={32} />
                </div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                    notif.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'booking_new' ? 'bg-blue-50 text-blue-600' : 'bg-teal/10 text-teal'
                  }`}>
                    {notif.type === 'booking_new' ? <Calendar size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-navy text-sm uppercase tracking-tight">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                      <div className="flex gap-2">
                        {!notif.read && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-blue-600 hover:bg-blue-50" onClick={() => markNotifRead(notif.id)}>Mark Read</Button>
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
            <Button onClick={() => setIsNotifOpen(false)} className="w-full h-12 rounded-xl bg-navy hover:bg-navy/90 text-white font-black text-[10px] uppercase tracking-widest">Close Panel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] rounded-[32px] p-0 overflow-hidden outline-none font-sans border-none shadow-2xl flex flex-col">
          <div className="bg-navy p-8 text-white relative shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <UserCircle className="text-teal" /> Customer History
              </DialogTitle>
              <DialogDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Profile & Full Transaction Log
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {selectedUserForHistory && (
              <div className="p-8 space-y-8">
                {/* Profile Snapshot */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-teal text-2xl font-black">
                      {selectedUserForHistory.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-navy uppercase tracking-tighter">{selectedUserForHistory.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-bold text-gray-400">
                        <span className="flex items-center gap-1"><Phone size={12} className="text-teal" /> {selectedUserForHistory.phone}</span>
                        <span className="flex items-center gap-1 font-medium">{selectedUserForHistory.email || 'No email provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Address</div>
                    <div className="text-xs font-medium text-navy bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 inline-block max-w-[250px]">
                      {selectedUserForHistory.address}
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="bookings" className="w-full">
                  <TabsList className="bg-white border border-gray-100 p-1 rounded-2xl mb-6 shadow-sm">
                    <TabsTrigger value="bookings" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-teal data-[state=active]:text-navy">
                      Bookings ({userBookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-teal data-[state=active]:text-navy">
                      Invoices ({userInvoices.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bookings" className="m-0 space-y-4">
                    {userBookings.length > 0 ? (
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Service</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Tier</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Date</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10 text-center">Status</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10 text-right">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userBookings.map((b) => (
                              <TableRow key={b.id} className="border-b border-gray-50 last:border-none">
                                <TableCell className="px-6 py-4 font-bold text-navy text-sm">{b.serviceName}</TableCell>
                                <TableCell className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">{b.tier}</TableCell>
                                <TableCell className="px-6 py-4 text-xs font-medium text-gray-500">
                                  {b.appointmentDate ? new Date(b.appointmentDate).toLocaleDateString() : 'ASAP'}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>
                                    {b.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right font-black text-navy text-sm">₹{b.price}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                        <Calendar className="mx-auto text-gray-200" size={48} />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No bookings found for this customer</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="m-0 space-y-4">
                    {userInvoices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userInvoices.map((inv) => (
                          <div key={inv.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-teal transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-navy group-hover:bg-teal group-hover:text-white transition-colors">
                                <FileText size={20} />
                              </div>
                              <div>
                                <div className="text-md font-black text-navy uppercase tracking-tighter">
                                  #{inv.invoiceNumber}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  {inv.type} • {new Date(inv.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-navy mb-2">₹{inv.total || inv.totalAmount}</div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[8px] font-black uppercase rounded-lg px-2 border-gray-200"
                                  onClick={() => navigate(`/invoice/${inv.id}`)}
                                >
                                  View PDF
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-7 w-7 p-0 rounded-lg bg-navy hover:bg-navy/90 text-white"
                                  onClick={() => downloadInvoicePDF(inv)}
                                >
                                  <Download size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                        <FileText className="mx-auto text-gray-200" size={48} />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No invoices generated for this customer</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            <Button onClick={() => setIsHistoryModalOpen(false)} className="w-full h-14 rounded-2xl bg-navy hover:bg-navy/90 text-white font-black text-[12px] uppercase tracking-widest">Close History View</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTile({ title, desc, icon, color, onClick, badge }: { title: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void; badge?: number }) {
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

function StatCard({ title, value, icon, change, color }: { title: string, value: string | number, icon: React.ReactNode, change?: string, color?: string }) {
  return (
    <Card className="rounded-[32px] border-none shadow-xl shadow-navy/5 p-6 bg-white flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl ${color || 'bg-blue-50'} flex items-center justify-center text-white shrink-0 shadow-lg`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-2xl font-black text-navy">{value}</div>
        {change && <div className="text-[9px] font-bold text-green-500 mt-1">{change}</div>}
      </div>
    </Card>
  );
}

function getStatusColor(status: BookingStatus) {
  switch (status) {
    case 'Pending': return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'Accepted': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Completed': return 'bg-green-100 text-green-700 border border-green-200';
    case 'Rejected': return 'bg-red-100 text-red-700 border border-red-200';
  }
}
