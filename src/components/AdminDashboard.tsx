import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { dataService, safeStringify } from '../services/firebaseService';
import { CORE_SERVICES, WHATSAPP_NUMBER, DEFAULT_CATEGORIES } from '../constants';
import { Booking, UserProfile, Service, BookingStatus, Category, AppSettings, Notification } from '../types';
import { calculateDistance } from '../services/locationService';
import { cn, formatWhatsAppLink, maskEmail, maskPhone, compressImage, safeDateFormatter, safeTimeFormatter } from '../lib/utils';
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
  Menu,
  ChevronRight,
  TrendingUp,
  Search,
  IndianRupee,
  Plus,
  Star,
  Zap,
  AlertTriangle,
  AlertCircle,
  Bell,
  MapPin,
  Layers,
  Edit,
  Grid,
  ShieldCheck,
  ShieldAlert,
  Save,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Navigation,
  FileText,
  Copy,
  Share2,
  Phone,
  MessageCircle,
  UserCircle,
  Home,
  Briefcase,
  Award,
  LogOut,
  LayoutDashboard,
  Unlock,
  Lock as LockIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';
import BillingCenter from './BillingCenter';
import { Button } from './ui/button';
import { TabGallery } from './admin/TabGallery';
import { TabBilling } from './admin/TabBilling';
import { TabInvoices } from './admin/TabInvoices';
import { TabSchedule } from './admin/TabSchedule';
import { TabStats } from './admin/TabStats';
import { TabReports } from './admin/TabReports';
import { TabCategories } from './admin/TabCategories';
import { TabStaff } from './admin/TabStaff';
import { TabPricing } from './admin/TabPricing';
import { TabBookings } from './admin/TabBookings';
import { TabUsers } from './admin/TabUsers';
import { TabMessages } from './admin/TabMessages';
import { TabSettings } from './admin/TabSettings';
import TabStore from './admin/TabStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { AdminSidebar } from './AdminSidebar';
import Logo from './Logo';
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
  const { user, profile, isAdmin, toggleAdminView, viewAsCustomer, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(propInitialTab || 'bookings');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'Admin' | 'Staff' | 'Customer'>('All');
  const [staffFilter, setStaffFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
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
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [userEditForm, setUserEditForm] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    email: ''
  });

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserProfile | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editSlot, setEditSlot] = useState('Morning (10 AM - 1 PM)');

  useEffect(() => {
    if (selectedBookingForDetails) {
      setEditDate(selectedBookingForDetails.appointmentDate || new Date().toISOString().split('T')[0]);
      setEditSlot(selectedBookingForDetails.appointmentSlot || 'Morning (10 AM - 1 PM)');
    }
  }, [selectedBookingForDetails]);
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | null>(null);
  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const [dirtyServices, setDirtyServices] = useState<Record<string, boolean>>({});
  const [isAutoSave, setIsAutoSave] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    userName: '',
    userPhone: '',
    userAddress: '',
    serviceName: 'General Maintenance',
    subCategory: 'Standard',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentSlot: 'Morning (10 AM - 1 PM)',
    price: 0,
    tier: 'LABOUR' as 'LABOUR' | 'MATERIAL',
    status: 'Accepted' as BookingStatus,
    staffId: '',
    staffName: ''
  });

  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Booking[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<Booking | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);

  // Get today's date string in local time (YYYY-MM-DD)
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();

  const prevBookingsCount = useRef<number | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'syncing' | 'offline'>('online');

  useEffect(() => {
    // Initialize notification sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationSound.current = audio;

    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const bookingName = booking.userName || '';
    const bookingService = booking.serviceName || '';
    const matchesSearch = bookingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookingService.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    console.log("[AdminDashboard] Auth State:", { isAdmin, user: user?.email });
    if (isAdmin) {
      const unsubUsers = dataService.subscribe('users', (data) => {
        console.log("[AdminDashboard] Users received:", data.length);
        setUsers(data as UserProfile[]);
      }, [], (err) => console.error("[AdminDashboard] Users sub error:", err));
      
      const unsubInvoices = dataService.subscribe('invoices', (data) => {
        console.log("[AdminDashboard] Invoices received:", data.length);
        const sorted = (data as any[]).sort((a,b) => {
          const tA = new Date(a.timestamp || a.date || 0).getTime();
          const tB = new Date(b.timestamp || b.date || 0).getTime();
          return tB - tA;
        });
        setAllInvoices(sorted);
      }, [], (err) => console.error("[AdminDashboard] Invoices sub error:", err));
      
      const unsubBookings = dataService.subscribe('bookings', (data) => {
        console.log("[AdminDashboard] Bookings received:", data.length);
        setConnectionStatus('syncing');
        setTimeout(() => setConnectionStatus('online'), 1000);

        const sorted = (data as Booking[]).sort((a,b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });
        
        // Detect new bookings
        if (prevBookingsCount.current !== null && sorted.length > prevBookingsCount.current) {
          // Find newly added bookings (the ones not in our previous set)
          // For simplicity, we toast for the most recent one if it's 'Pending'
          const newBooking = sorted[0]; 
          if (newBooking && newBooking.status === 'Pending') {
            toast(`New Order: ${newBooking.serviceName}`, {
              description: `Customer: ${newBooking.userName} (${newBooking.userPhone})`,
              icon: <Zap className="text-teal animate-pulse" size={18} />,
              duration: 8000,
              action: {
                label: 'View Order',
                onClick: () => {
                  setSelectedBookingForDetails(newBooking);
                  setActiveTab('bookings');
                }
              }
            });
            notificationSound.current?.play().catch(e => console.log('Audio blocked'));
          }
        }
        
        prevBookingsCount.current = sorted.length;
        setBookings(sorted);
      }, [], (err) => {
        console.error("[AdminDashboard] Bookings sub error:", err);
        setConnectionStatus('offline');
      });
      
      const unsubServices = dataService.subscribe('services', (data) => {
        if (data.length > 0) {
          setServices(current => {
            const merged = [...CORE_SERVICES];
            (data as Service[]).forEach(fsService => {
              const index = merged.findIndex(s => s.id === fsService.id);
              if (index !== -1) {
                // Only update if NOT dirty
                if (!dirtyServices[fsService.id]) {
                  merged[index] = { ...merged[index], ...fsService };
                } else {
                  // Keep current local state for dirty service
                  const currentLocal = current.find(s => s.id === fsService.id);
                  if (currentLocal) merged[index] = currentLocal;
                  else merged[index] = { ...merged[index], ...fsService };
                }
              } else {
                merged.push(fsService);
              }
            });
            return merged;
          });
        }
      });
      const unsubCategories = dataService.subscribe('categories', (data) => {
        if (data.length > 0) {
          // Merge DEFAULT_CATEGORIES with Firestore data
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
        }
      });
      const unsubReports = dataService.subscribe('reports', (data) => {
        const sorted = (data as any[]).sort((a,b) => {
          const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return tB - tA;
        });
        setReports(sorted);
      });
      const unsubNotifs = dataService.subscribe('notifications', (data) => {
        setNotifications((data as Notification[]).sort((a,b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        }));
      }, [{ field: 'userId', operator: '==', value: 'admin' }]);
      const unsubSettings = dataService.subscribe('settings', (data) => {
        if (data && data.length > 0) {
          setAppSettings(prev => ({ ...prev, ...(data[0] as AppSettings) }));
        }
      });
      setLoading(false);

      return () => {
        unsubUsers();
        unsubBookings();
        unsubInvoices();
        unsubServices();
        unsubCategories();
        unsubReports();
        unsubNotifs();
        unsubSettings();
      };
    } else {
      console.warn("[AdminDashboard] Access blocked: user is not admin");
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (propInitialTab) {
      setActiveTab(propInitialTab);
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['bookings', 'users', 'pricing', 'categories', 'reviews', 'billing', 'settings', 'reports', 'staff', 'reviews-share', 'invoices'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, [propInitialTab]);

  if (authLoading) return <div className="flex h-screen items-center justify-center font-sans">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-teal animate-bounce" />
      <p className="text-[10px] font-black uppercase tracking-widest text-navy animate-pulse">Initializing Control Panel...</p>
    </div>
  </div>;

  if (!isAdmin) return <Navigate to="/" />;

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    
    // Smooth scroll to top when changing tabs
    const container = document.querySelector('main');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    const routeMap: Record<string, string> = {
      'stats': '/admin/dashboard',
      'bookings': '/admin/bookings',
      'invoices': '/admin/invoices',
      'billing': '/admin/invoice-generator',
      'pricing': '/admin/services',
      'gallery': '/admin/gallery',
      'staff': '/admin#staff',
      'settings': '/admin#settings'
    };
    if (routeMap[val]) {
      navigate(routeMap[val]);
    } else {
      window.location.hash = val;
    }
  };

  const updateBooking = async (id: string, updates: any) => {
    console.log(`Attempting to update booking ${id}:`, updates);
    try {
      const booking = bookings.find(b => b.id === id);
      await dataService.updateDoc('bookings', id, updates);
      
      // Update local state immediately
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      if (selectedBookingForDetails?.id === id) {
        setSelectedBookingForDetails({ ...selectedBookingForDetails, ...updates });
      }

      // Create notification for user
      if (booking) {
        let title = 'Booking Updated';
        let message = `Your booking for ${booking.serviceName} has been updated.`;
        
        if (updates.status) {
           title = `Booking ${updates.status}`;
           message = `Your booking for ${booking.serviceName} has been marked as ${updates.status}.`;
        }
        
        if (updates.appointmentDate) {
           title = 'Visit Scheduled';
           const slotText = updates.appointmentSlot || booking.appointmentSlot || '';
           message = `Your visit for ${booking.serviceName} has been scheduled for ${updates.appointmentDate} ${slotText ? `during ${slotText}` : ''}.`;
        }

        await dataService.addDoc('notifications', {
          userId: booking.userId,
          title,
          message,
          type: 'booking_update',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/dashboard'
        }).catch(e => console.warn('User notification failed', e));
      }
      
      toast.success(updates.status === 'Accepted' ? 'Booking Accepted!' : 'Status Updated');

      // Trigger prompt for WhatsApp if accepted and info exists
      if (updates.status === 'Accepted' && booking) {
        toast('Send WhatsApp Confirmation?', {
          action: {
            label: 'Send Now',
            onClick: () => sendWhatsAppConfirmation({ ...booking, ...updates })
          },
          duration: 10000,
        });
      }
    } catch (e) {
      console.error('Update failed:', e);
      toast.error('Update failed');
    }
  };

  const sendWhatsAppConfirmation = (booking: Booking) => {
    if (!booking.userPhone && !booking.whatsappNumber) {
      toast.error('No contact number found for this customer');
      return;
    }

    const date = booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : 'TBD';
    
    const message = `*Booking Confirmed - Atomic Solutions*

Hello *${booking.userName}*,

Your booking for *${booking.serviceName} (${booking.subCategory})* has been confirmed.

*Visit Details:*
📅 Date: ${date}
🕒 Time: ${booking.appointmentSlot}
${booking.staffName ? `🛠️ Technician: ${booking.staffName}\n` : ''}📍 Address: ${booking.userAddress}

By: *Atomic Solutions*`;
    
    window.open(formatWhatsAppLink(booking.whatsappNumber || booking.userPhone, message), '_blank');
  };

  const handleCreateManualVisit = async () => {
    if (!manualBookingData.userName || !manualBookingData.userPhone) {
      toast.error('Please enter name and phone');
      return;
    }

    try {
      setLoading(true);
      const newBooking = {
        ...manualBookingData,
        userId: 'admin-manual',
        userEmail: 'admin-manual@atomic.com',
        timestamp: new Date().toISOString(),
        assignedStaff: manualBookingData.staffId ? [manualBookingData.staffId] : [],
        details: {
          description: 'Manually created by Admin'
        }
      };

      setIsManualBookingOpen(false);
      toast.success('Manual visit scheduled successfully');
      
      // Execute in background
      dataService.addDoc('bookings', newBooking).catch(e => {
        console.error('Failed to save manual visit:', e);
        toast.error('Sync failed: Manual visit not saved to database');
      });

      setManualBookingData({
        userName: '',
        userPhone: '',
        userAddress: '',
        serviceName: 'General Maintenance',
        subCategory: 'Standard',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentSlot: 'Morning (10 AM - 1 PM)',
        price: 0,
        tier: 'LABOUR',
        status: 'Accepted',
        staffId: '',
        staffName: ''
      });
    } catch (e) {
      console.error('Operation failed:', e);
      toast.error('Could not process request');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDeleteId) return;
    
    const booking = bookings.find(b => b.id === bookingToDeleteId);
    try {
      setIsDeleting(true);
      await dataService.deleteDoc('bookings', bookingToDeleteId);
      setBookings(prev => prev.filter(b => b.id !== bookingToDeleteId));
      toast.success('Booking permanently removed');
      
      if (booking && booking.userId) {
        await dataService.addDoc('notifications', {
          userId: booking.userId,
          title: 'Booking Removed',
          message: `Your booking for ${booking.serviceName} has been archived by administration.`,
          type: 'alert',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/dashboard'
        }).catch(e => console.warn('User delete notification failed', e));
      }
    } catch (e) {
      console.error('Delete operation failed:', e);
      toast.error('Failed to delete. Please check internet connection.');
    } finally {
      setIsDeleting(false);
      setBookingToDeleteId(null);
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

  const handleEditUser = (targetUser: UserProfile) => {
    setUserToEdit(targetUser);
    setUserEditForm({
      name: targetUser.name || '',
      phone: targetUser.phone || '',
      whatsappNumber: targetUser.whatsappNumber || '',
      address: targetUser.address || '',
      email: targetUser.email || ''
    });
    setIsUserEditOpen(true);
  };

  const saveUserEdits = async () => {
    if (!userToEdit) return;
    try {
      await dataService.updateDoc('users', userToEdit.uid, {
        ...userEditForm,
        updatedAt: new Date().toISOString()
      });
      toast.success('User profile updated');
      setIsUserEditOpen(false);
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const approveStaff = async (uid: string) => {
    try {
      await dataService.updateDoc('users', uid, {
        staffStatus: 'approved',
        isStaff: true,
        updatedAt: new Date().toISOString()
      });
      toast.success('Staff member approved');
      
      // Notify user
      await dataService.addDoc('notifications', {
        userId: uid,
        title: 'Staff Application Approved',
        message: 'Your application to join the professional staff has been approved. You can now access the staff portal.',
        type: 'success',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/professional'
      });
    } catch (e) {
      toast.error('Approval failed');
    }
  };

  const rejectStaff = async (uid: string) => {
    try {
      await dataService.updateDoc('users', uid, {
        staffStatus: 'rejected',
        isStaff: false,
        updatedAt: new Date().toISOString()
      });
      toast.success('Staff application rejected');
      
      // Notify user
      await dataService.addDoc('notifications', {
        userId: uid,
        title: 'Staff Application Rejected',
        message: 'Your application to join the professional staff has been rejected. Contact administration for details.',
        type: 'alert',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/dashboard'
      });
    } catch (e) {
      toast.error('Rejection failed');
    }
  };

  const toggleBlockUser = async (uid: string, currentBlocked: boolean) => {
    try {
      await dataService.updateDoc('users', uid, {
        isBlocked: !currentBlocked,
        updatedAt: new Date().toISOString()
      });
      toast.success(currentBlocked ? 'User unblocked' : 'User blocked');
    } catch (e) {
      toast.error('Block operation failed');
    }
  };

  const handleAssignStaff = async () => {
    if (!bookingToAssign || !selectedStaffId) return;
    
    const staff = users.find(u => u.uid === selectedStaffId);
    if (!staff) return;

    try {
      await updateBooking(bookingToAssign.id, {
        staffId: staff.uid,
        staffName: staff.name,
        payoutAmount: payoutAmount,
        status: 'Assigned'
      });
      
      // Notify staff member
      await dataService.addDoc('notifications', {
        userId: staff.uid,
        title: 'New Job Assigned',
        message: `You have been assigned to ${bookingToAssign.serviceName} for ${bookingToAssign.userName}. Please Accept or Reject. Payout: ₹${payoutAmount}`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/professional'
      });

      toast.success('Staff assigned successfully');
      setIsStaffModalOpen(false);
      setBookingToAssign(null);
      setSelectedStaffId('');
    } catch (error) {
      toast.error('Failed to assign staff');
    }
  };

  const viewUserHistory = async (targetUser: UserProfile) => {
    if (!targetUser) return;
    setLoading(true);
    setSelectedUserForHistory(targetUser);
    try {
      const fetchJobs = [
        dataService.getCollection('bookings', [{ field: 'userId', operator: '==', value: targetUser.uid }]).catch(() => []),
        dataService.getCollection('invoices', [{ field: 'userId', operator: '==', value: targetUser.uid }]).catch(() => []),
        dataService.getCollection('reports', [{ field: 'userId', operator: '==', value: targetUser.uid }]).catch(() => []),
        dataService.getCollection('reviews', [{ field: 'userId', operator: '==', value: targetUser.uid }]).catch(() => [])
      ];

      // If user is staff, also fetch their assigned work
      if (targetUser.isStaff) {
        fetchJobs.push(dataService.getCollection('bookings', [{ field: 'staffId', operator: '==', value: targetUser.uid }]).catch(() => []));
      }

      const results = await Promise.all(fetchJobs);
      setUserBookings((results[0] || []) as Booking[]);
      setUserInvoices(results[1] || []);
      setUserReports(results[2] || []);
      setUserReviews(results[3] || []);
      
      if (targetUser.isStaff) {
        setStaffAssignments((results[4] || []) as Booking[]);
      } else {
        setStaffAssignments([]);
      }

      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch user history:", error);
      toast.error("Failed to fetch complete history");
      setUserBookings([]);
      setUserInvoices([]);
      // Still open modal to show profile if we have it
      setIsHistoryModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalServiceUpdate = async (serviceId: string, updates: Partial<Service>) => {
    if (!serviceId) return;
    
    try {
      setServices(current => {
        if (!Array.isArray(current)) return [];
        return current.map(s => {
          if (s.id === serviceId) {
            return { ...s, ...updates };
          }
          return s;
        });
      });

      setDirtyServices(prev => ({ ...prev, [serviceId]: true }));
      
      if (isAutoSave) {
        try {
          // We use the updates directly. If updateService needs full service, we'll provide it.
          await updateService(serviceId, updates);
          setDirtyServices(prev => {
            const next = { ...prev };
            delete next[serviceId];
            return next;
          });
        } catch (err) {
          console.error("Auto-sync failed for service:", serviceId, err);
          toast.error("Auto-sync failed. Saved locally.");
        }
      }
    } catch (err) {
      console.error("Local update error:", err);
    }
  };

  const handleFeaturedImageUpload = async (serviceId: string, file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      updateService(serviceId, { featuredImage: compressed });
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    if (!serviceId) return;
    
    try {
      const existing = await dataService.getDoc('services', serviceId).catch(err => {
        console.warn("Firestore access error during check:", err);
        return null;
      });
      
      const dataToSync = JSON.parse(safeStringify(updates));
      
      if (!existing) {
        const fullService = services.find(s => s.id === serviceId);
        if (fullService) {
          const dataToSave = JSON.parse(safeStringify({ ...fullService, ...updates }));
          await dataService.setDoc('services', serviceId, dataToSave);
        } else {
          console.error("Service not found locally for sync:", serviceId);
          throw new Error("Service not found");
        }
      } else {
        await dataService.updateDoc('services', serviceId, dataToSync);
      }
      // Only toast on success if NOT auto-saving or if explicitly requested
      if (!isAutoSave) toast.success('Changes synced to cloud');
    } catch (e: any) {
      console.error('Update service error:', e);
      const msg = e?.message || "Unknown error";
      toast.error(`Update failed: ${msg.substring(0, 40)}`);
      throw e;
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

  const confirmDeleteCategory = async () => {
    if (!categoryToDeleteId) return;
    try {
      setIsDeleting(true);
      await dataService.deleteDoc('categories', categoryToDeleteId);
      toast.success('Category deleted');
    } catch (e) {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
      setCategoryToDeleteId(null);
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

  const [uploadProgress, setUploadProgress] = useState<{ active: boolean, percent: number, fileName: string }>({ active: false, percent: 0, fileName: '' });
  const cancelUploadRef = React.useRef(false);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      await dataService.setDoc('settings', 'main', { ...appSettings, ...updates });
      toast.success('Settings updated');
    } catch (e) {
      toast.error('Failed to update settings');
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    try {
      const pdfData: PDFInvoiceData = {
        type: invoice.type || 'Invoice',
        number: invoice.estimateNumber || invoice.invoiceNumber || 'No',
        date: invoice.date || invoice.timestamp,
        customerName: invoice.customerName || invoice.userName || 'Valued Customer',
        customerPhone: invoice.customerPhone || invoice.userPhone || '',
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
        companyPhone: appSettings?.phone || '9582268658',
        companyAddress: appSettings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
        logoUrl: window.location.origin + '/logo.png'
      };
      
      const doc = generateInvoicePDF(pdfData);
      const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || invoice.invoiceNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
      doc.save(`${cleanFileName}.pdf`);
      toast.success('Invoice Downloaded Successfully');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!invoiceId) {
      toast.error("Invalid invoice ID - cannot delete");
      return;
    }
    setInvoiceToDeleteId(invoiceId);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDeleteId) return;
    
    setIsDeleting(true);
    try {
      console.log(`[AdminDashboard] Deleting invoice: ${invoiceToDeleteId}`);
      await dataService.deleteDoc('invoices', invoiceToDeleteId);
      toast.success("Invoice deleted successfully");
      
      // Update local states manually for immediate feedback
      setAllInvoices(prev => prev.filter(inv => inv.id !== invoiceToDeleteId));
      setUserInvoices(prev => prev.filter(inv => inv.id !== invoiceToDeleteId));
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice. Check console for details.");
    } finally {
      setIsDeleting(false);
      setInvoiceToDeleteId(null);
    }
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


  const markAllNotifsRead = async () => {
    try {
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount === 0) return;
      
      const promises = notifications
        .filter(n => !n.read)
        .map(n => dataService.updateDoc('notifications', n.id, { read: true }));
      
      await Promise.all(promises);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const clearAllNotifs = async () => {
    if (!confirm('Clear all notifications forever?')) return;
    try {
      const promises = notifications.map(n => dataService.deleteDoc('notifications', n.id));
      await Promise.all(promises);
      toast.success('All notifications cleared');
    } catch (err) {
      toast.error('Failed to clear notifications');
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

  const confirmDeleteService = async () => {
    if (!serviceToDeleteId) return;
    try {
      setIsDeleting(true);
      await dataService.deleteDoc('services', serviceToDeleteId);
      toast.success('Service deleted');
    } catch (e) {
      toast.error('Failed to delete service');
    } finally {
      setIsDeleting(false);
      setServiceToDeleteId(null);
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
      const normalizeId = (name: string) => name.trim().toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')     // Space to dash
        .replace(/-+/g, '-');     // Multiple dashes to one

      const id = editingService.id || normalizeId(editingService.name);
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

  
  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb] font-sans selection:bg-teal/30">
      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} className="hidden lg:flex w-72 flex-shrink-0" />
      
      <main className="relative flex-1 overflow-y-auto bg-[#f6f8fb] custom-scrollbar">
        {/* Modern Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/92 p-4 backdrop-blur-xl md:px-8 md:py-5">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-navy hover:text-blue-600 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-white shadow-sm border border-gray-100" />}>
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-none w-72">
                <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-3">
              <Logo size="sm" className="hidden sm:block" />
              <div className="hidden sm:block">
                <h2 className="text-xl font-extrabold text-navy leading-none">
                  Workspace
                </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={12} className="text-teal" /> 
                  {activeTab === 'stats' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} • Control Hub
                </p>
                <div className="h-3 w-px bg-gray-200" />
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all",
                  connectionStatus === 'online' ? "bg-green-50 border-green-100 text-green-600" :
                  connectionStatus === 'syncing' ? "bg-blue-50 border-blue-100 text-blue-600 animate-pulse" :
                  "bg-red-50 border-red-100 text-red-600"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", 
                    connectionStatus === 'online' ? "bg-green-500" : 
                    connectionStatus === 'syncing' ? "bg-blue-500" : "bg-red-500"
                  )} />
                  {connectionStatus}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick Stats Search */}
            <div className="hidden xl:flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                  <span className="text-[10px] font-black text-navy uppercase tracking-widest">₹{bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()} Revenue</span>
               </div>
               <div className="w-px h-3 bg-gray-200" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bookings.filter(b => b.status === 'Pending').length} Pending</span>
            </div>

            <div className="flex items-center gap-2">
               <div className="relative">
                 <Button 
                   variant="ghost" 
                   size="icon"
                   className="h-11 w-11 rounded-xl bg-white border border-gray-100 shadow-sm text-navy hover:text-blue-600 hover:bg-blue-50 transition-all"
                   onClick={() => setIsNotifOpen(true)}
                 >
                   <Bell size={20} />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[9px] font-black flex items-center justify-center text-white">
                       {notifications.filter(n => !n.read).length}
                     </span>
                   )}
                 </Button>
               </div>
               
               <div className="w-px h-6 bg-gray-100 mx-1 hidden sm:block" />

               <Button 
                variant="ghost" 
                className="group flex items-center gap-3 bg-white border border-gray-100 px-4 py-2.5 rounded-2xl shadow-sm hover:border-teal transition-all"
                onClick={toggleAdminView}
               >
                  <UserCircle size={20} className="text-gray-400 group-hover:text-teal transition-colors" />
                  <span className="text-[10px] font-black text-navy uppercase tracking-widest hidden md:block">User View</span>
               </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 md:p-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
            {/* Overview Section */}
          <TabStats
            users={users}
            bookings={bookings}
            allInvoices={allInvoices}
            setUserRoleFilter={setUserRoleFilter}
            setStatusFilter={setStatusFilter}
            handleTabChange={setActiveTab}
            setSelectedUserForHistory={setSelectedUserForHistory}
            setIsHistoryModalOpen={setIsHistoryModalOpen}
          />

          <TabBookings
            handleTabChange={setActiveTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredBookings={filteredBookings}
            users={users}
            setSelectedBookingForDetails={setSelectedBookingForDetails}
            setBookingToAssign={setBookingToAssign}
            setPayoutAmount={setPayoutAmount}
            setIsStaffModalOpen={setIsStaffModalOpen}
            updateBooking={updateBooking}
            setBookingToDeleteId={setBookingToDeleteId}
            setIsManualBookingOpen={setIsManualBookingOpen}
          />

          <TabSchedule
            handleTabChange={setActiveTab}
            setIsManualBookingOpen={setIsManualBookingOpen}
            bookings={bookings}
            todayStr={todayStr}
            setSelectedBookingForDetails={setSelectedBookingForDetails}
            updateBooking={updateBooking}
          />

          <TabUsers
            users={users}
            userSearchTerm={userSearchTerm}
            setUserSearchTerm={setUserSearchTerm}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            handleTabChange={setActiveTab}
            viewUserHistory={viewUserHistory}
            approveStaff={approveStaff}
            rejectStaff={rejectStaff}
            toggleBlockUser={toggleBlockUser}
            handleEditUser={handleEditUser}
            confirmDelete={confirmDelete}
          />

          <TabInvoices
            allInvoices={allInvoices}
            navigate={navigate}
            downloadInvoicePDF={downloadInvoicePDF}
            handleDeleteInvoice={handleDeleteInvoice}
          />

          <TabStaff
            staffFilter={staffFilter}
            setStaffFilter={setStaffFilter}
            users={users}
            bookings={bookings}
            approveStaff={approveStaff}
            rejectStaff={rejectStaff}
            viewUserHistory={viewUserHistory}
            toggleBlockUser={toggleBlockUser}
            confirmDelete={confirmDelete}
            setIsManualBookingOpen={setIsManualBookingOpen}
            setManualBookingData={setManualBookingData}
          />

          <TabReports
            reports={reports}
            updateReport={updateReport}
            deleteReport={deleteReport}
          />

          <TabMessages users={users} />

          <TabPricing
            isAutoSave={isAutoSave}
            setIsAutoSave={setIsAutoSave}
            setActiveTab={setActiveTab}
            categories={categories}
            setEditingService={setEditingService}
            setIsServiceModalOpen={setIsServiceModalOpen}
            services={services}
            moveService={moveService}
            updateService={updateService}
            setServiceToDeleteId={setServiceToDeleteId}
            dirtyServices={dirtyServices}
            setDirtyServices={setDirtyServices}
            handleLocalServiceUpdate={handleLocalServiceUpdate}
            handleFeaturedImageUpload={handleFeaturedImageUpload}
          />

          <TabCategories
            categories={categories}
            openCategoryModal={openCategoryModal}
            setCategoryToDeleteId={setCategoryToDeleteId}
          />

          <TabBilling
            services={services}
            appSettings={appSettings}
          />

          <TabGallery
            appSettings={appSettings}
            updateSettings={updateSettings}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
            cancelUploadRef={cancelUploadRef}
          />

          <TabsContent value="settings">
            <TabSettings
              user={user}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
              clearAllNotifs={clearAllNotifs}
              updateSettings={updateSettings}
            />
          </TabsContent>
          <TabStore />
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBookingForDetails} onOpenChange={() => setSelectedBookingForDetails(null)}>
        <DialogContent className="sm:max-w-2xl max-w-2xl w-full rounded-[32px] p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-navy p-8 text-white relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Request Details</DialogTitle>
            <DialogDescription className="text-teal font-bold uppercase tracking-widest text-[10px] mt-1">
              Internal Ticket: #{selectedBookingForDetails?.id ? selectedBookingForDetails.id.slice(-8).toUpperCase() : 'N/A'}
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
                  <div className="font-black text-navy">{selectedBookingForDetails?.userName || users.find(u => u.uid === selectedBookingForDetails?.userId)?.name || 'Customer'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Phone</div>
                  <div className="font-black text-navy">{selectedBookingForDetails?.userPhone || users.find(u => u.uid === selectedBookingForDetails?.userId)?.phone || ''}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">WhatsApp</div>
                  <div className="font-black text-teal">{selectedBookingForDetails?.whatsappNumber || users.find(u => u.uid === selectedBookingForDetails?.userId)?.whatsappNumber || selectedBookingForDetails?.userPhone || 'N/A'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Email</div>
                  <div className="font-black text-navy text-xs truncate">{selectedBookingForDetails?.userEmail || users.find(u => u.uid === selectedBookingForDetails?.userId)?.email || 'N/A'}</div>
                </div>
              </div>
              <div className="p-4 bg-navy/5 border border-navy/10 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[8px] font-black text-navy uppercase">Service Address</div>
                  {selectedBookingForDetails?.location && (
                     <a 
                       href={`https://www.google.com/maps?q=${selectedBookingForDetails.location.lat},${selectedBookingForDetails.location.lng}`}
                       target="_blank"
                       rel="noreferrer"
                       className="text-[8px] font-black text-teal uppercase flex items-center gap-1 hover:underline"
                     >
                       <MapPin size={10} /> View Live Location
                     </a>
                  )}
                </div>
                <div className="font-bold text-navy text-sm">{selectedBookingForDetails?.userAddress || users.find(u => u.uid === selectedBookingForDetails?.userId)?.address || 'Address Not Provided'}</div>
              </div>
            </div>

            {/* Specialized Planning Details */}
            {selectedBookingForDetails?.type === 'PLANNING_REQUEST' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-teal uppercase tracking-[0.2em] px-1">House Planning Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl overflow-hidden">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Plot Size</div>
                    <div className="font-black text-navy truncate">{selectedBookingForDetails?.details?.plotSize}</div>
                  </div>
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Sq. Ft.</div>
                    <div className="font-black text-navy">{selectedBookingForDetails?.details?.sqft || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-teal/5 border border-teal/10 rounded-2xl">
                    <div className="text-[8px] font-black text-teal uppercase mb-1">Expected Rate</div>
                    <div className="font-black text-teal">₹ {selectedBookingForDetails?.details?.estimatedPrice?.toLocaleString('en-IN') || '0'}</div>
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

            {/* Payment Information */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Status</div>
                  <div className="font-black text-navy">{selectedBookingForDetails?.paymentStatus || 'Pending'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Amount</div>
                  <div className="font-black text-teal">₹{selectedBookingForDetails?.price || 0}</div>
                </div>
                {selectedBookingForDetails?.paymentProofUrl && (
                  <div className="col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="text-[8px] font-black text-blue-400 uppercase mb-1">Payment Proof</div>
                      <div className="font-bold text-navy text-xs">Screenshot Uploaded</div>
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); setPreviewImage(selectedBookingForDetails.paymentProofUrl); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      View Proof
                    </button>
                  </div>
                )}
                
                {selectedBookingForDetails?.paymentStatus === 'Verification Pending' && (
                   <div className="col-span-2 flex gap-3">
                     <Button
                       onClick={async () => {
                         try {
                           await dataService.updateDoc('bookings', selectedBookingForDetails.id, { paymentStatus: 'Received' });
                           setSelectedBookingForDetails({ ...selectedBookingForDetails, paymentStatus: 'Received' });
                           toast.success('Payment marked as received!');
                         } catch (e) {
                           toast.error('Failed to update payment status');
                         }
                       }}
                       className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px]"
                     >
                       <CheckCircle size={14} className="mr-2" /> Mark as Payment Received
                     </Button>
                   </div>
                )}

                {selectedBookingForDetails?.paymentStatus === 'Received' && (
                   <div className="col-span-2 flex gap-3">
                     <div className="flex-1 text-center bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                       <CheckCircle size={14} /> Payment Received
                     </div>
                     <Button
                       onClick={() => {
                         navigate('/admin/invoice-generator', { state: { booking: selectedBookingForDetails } });
                       }}
                       className="flex-1 bg-navy hover:bg-teal text-white font-black uppercase tracking-widest text-[10px]"
                     >
                       <FileText size={14} className="mr-2" /> Generate Invoice
                     </Button>
                   </div>
                )}
              </div>
            </div>

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

            {/* Appointment Scheduling */}
            <div className="space-y-4 p-6 bg-blue-50 rounded-[28px] border border-blue-100">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Schedule Visit</h4>
                <div className="flex gap-2">
                   {selectedBookingForDetails?.staffName && (
                      <Badge className="bg-teal text-navy text-[8px] px-2 py-0.5">Assigned: {selectedBookingForDetails.staffName}</Badge>
                   )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:border-blue-500"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Time Slot</label>
                  <select 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:border-blue-500"
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                  >
                    <option>Morning (10 AM - 1 PM)</option>
                    <option>Afternoon (1 PM - 4 PM)</option>
                    <option>Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>
                    <div className="flex gap-2">
                      {selectedBookingForDetails?.status === 'Pending' ? (
                        <Button 
                          onClick={() => selectedBookingForDetails && updateBooking(selectedBookingForDetails.id, { status: 'Accepted', appointmentDate: editDate, appointmentSlot: editSlot })}
                          className="flex-[3] bg-teal hover:bg-navy text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal/20"
                        >
                          Confirm & Schedule
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => selectedBookingForDetails && updateBooking(selectedBookingForDetails.id, { appointmentDate: editDate, appointmentSlot: editSlot })}
                          className="flex-[2] bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100"
                        >
                          Update Visit Details
                        </Button>
                      )}
                      
                      {selectedBookingForDetails?.staffId ? (
                        <div className="flex-1 bg-teal/5 border border-teal/10 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">{selectedBookingForDetails.staffName?.[0]}</div>
                            <div>
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned Pro</p>
                               <p className="text-sm font-black text-navy">{selectedBookingForDetails.staffName}</p>
                            </div>
                          </div>
                          <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-8 px-2 text-[8px] font-black uppercase text-blue-600 hover:bg-blue-50"
                             onClick={() => {
                               setBookingToAssign(selectedBookingForDetails);
                               setPayoutAmount(selectedBookingForDetails.payoutAmount || Math.round(selectedBookingForDetails.price * 0.4));
                               setIsStaffModalOpen(true);
                             }}
                          >Re-assign</Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => {
                            setBookingToAssign(selectedBookingForDetails);
                            setPayoutAmount(Math.round(selectedBookingForDetails.price * 0.4));
                            setIsStaffModalOpen(true);
                          }}
                          className="flex-1 bg-navy hover:bg-teal text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                        >
                          Assign Staff
                        </Button>
                      )}
                    </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Management</h4>
              <div className="flex flex-wrap gap-2">
                {(['Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateBooking(selectedBookingForDetails.id, { status })}
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
              
              {selectedBookingForDetails?.staffId && (
                <Button 
                  onClick={() => {
                    if (!selectedBookingForDetails) return;
                    const staff = users.find(u => u.uid === selectedBookingForDetails.staffId);
                    const text = `*NEW JOB: ${selectedBookingForDetails.serviceName}*\n\n📍 *Address:* ${selectedBookingForDetails.userAddress}\n📞 *Client:* ${selectedBookingForDetails.userName} (${selectedBookingForDetails.userPhone})\n📅 *Date:* ${selectedBookingForDetails.appointmentDate || 'TBD'}\n⏰ *Time:* ${selectedBookingForDetails.appointmentSlot || 'TBD'}\n💰 *Payout:* ₹${selectedBookingForDetails.payoutAmount || 0}`;
                    window.open(formatWhatsAppLink(staff?.phone || staff?.whatsappNumber || '', text), '_blank');
                  }}
                  className="w-full bg-teal text-navy hover:bg-navy hover:text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-teal/20 transition-all mt-4"
                >
                  <Share2 size={16} /> Share Details with Assigned Staff (WhatsApp)
                </Button>
              )}
            </div>
          </div>
          
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
            <Button 
              className={`flex-[2] h-14 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all ${
                selectedBookingForDetails?.status === 'Accepted' || selectedBookingForDetails?.status === 'In Progress'
                  ? 'bg-indigo-600 hover:bg-navy text-white shadow-indigo-100'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
              }`}
              onClick={() => {
                if (selectedBookingForDetails) {
                  sendWhatsAppConfirmation(selectedBookingForDetails);
                }
              }}
            >
              <MessageCircle size={18} /> 
              {selectedBookingForDetails?.status === 'Accepted' || selectedBookingForDetails?.status === 'In Progress' 
                ? 'Send Schedule Confirmation' 
                : 'Send Booking Notification'}
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-14 border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl"
              onClick={() => setSelectedBookingForDetails(null)}
            >
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Assignment Dialog */}
      {/* Staff Assignment Modal */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 max-w-md overflow-hidden bg-white">
          <div className="bg-navy p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Briefcase size={80} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Assign Professional</DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2">
                Select a registered staff member for this job.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select Professional</label>
                {bookingToAssign?.category && (
                  <Badge className="bg-teal/10 text-teal text-[8px] font-black uppercase border-none">
                    Matching Category: {bookingToAssign.category}
                  </Badge>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {users.filter(u => u.isStaff && u.staffStatus === 'approved').length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">No approved staff found</p>
                  </div>
                ) : (
                  users
                    .filter(u => u.isStaff && u.staffStatus === 'approved')
                    .sort((a, b) => {
                      // Boost matching category
                      const aMatches = a.staffCategory?.toLowerCase().includes(bookingToAssign?.category?.toLowerCase() || '') || 
                                      a.staffCategory?.toLowerCase().includes(bookingToAssign?.serviceName?.toLowerCase() || '');
                      const bMatches = b.staffCategory?.toLowerCase().includes(bookingToAssign?.category?.toLowerCase() || '') || 
                                      b.staffCategory?.toLowerCase().includes(bookingToAssign?.serviceName?.toLowerCase() || '');
                      if (aMatches && !bMatches) return -1;
                      if (!aMatches && bMatches) return 1;
                      return 0;
                    })
                    .map(staff => {
                    const isRecommended = staff.staffCategory?.toLowerCase().includes(bookingToAssign?.category?.toLowerCase() || '') || 
                                         staff.staffCategory?.toLowerCase().includes(bookingToAssign?.serviceName?.toLowerCase() || '');
                    
                    return (
                    <button
                      key={staff.uid}
                      onClick={() => setSelectedStaffId(staff.uid)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedStaffId === staff.uid ? 'border-teal bg-teal/5' : 'border-gray-50 hover:border-gray-100 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white text-xs font-black relative">
                          {staff.name.charAt(0)}
                          {isRecommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal rounded-full border-2 border-white ring-1 ring-teal/20" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-navy uppercase tracking-tight">{staff.name}</p>
                            {isRecommended && <Badge className="bg-teal text-navy text-[7px] font-black px-1.5 h-3.5 uppercase border-none">Matches Job</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{staff.staffCategory || 'Generalist'}</p>
                            <p className="text-[8px] font-bold text-teal uppercase tracking-tighter flex items-center gap-1">
                              <MapPin size={8} /> {staff.workArea || 'Deoghar'}
                            </p>
                            {bookingToAssign?.location && staff.location && (
                              <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                                <Navigation size={8} /> {calculateDistance(
                                  bookingToAssign.location.lat, 
                                  bookingToAssign.location.lng, 
                                  staff.location.lat, 
                                  staff.location.lng
                               ).toFixed(1)} km
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedStaffId === staff.uid && <CheckCircle size={16} className="text-teal" />}
                    </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Payout Amount (₹)</label>
              <input 
                type="number" 
                value={isNaN(payoutAmount) ? '' : payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 font-black text-navy focus:ring-2 focus:ring-teal/20 outline-none transition-all"
              />
              <p className="text-[8px] font-medium text-gray-400 leading-relaxed italic px-1">
                * default set to 75% of booking price (25% company margin). Adjust as needed.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                onClick={handleAssignStaff}
                disabled={!selectedStaffId}
                className="w-full h-14 bg-navy hover:bg-navy/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-navy/20 disabled:opacity-50"
              >
                Confirm Assignment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isUserEditOpen} onOpenChange={setIsUserEditOpen}>
        <DialogContent className="rounded-[32px] border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-navy uppercase tracking-tighter">Edit User Profile</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Update details for {userToEdit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-xs text-navy outline-none"
                value={userEditForm?.name || ""}
                onChange={e => setUserEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-xs text-navy outline-none"
                  value={userEditForm?.phone || ""}
                  onChange={e => setUserEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">WhatsApp</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-xs text-navy outline-none"
                  value={userEditForm?.whatsappNumber || ""}
                  onChange={e => setUserEditForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-xs text-navy outline-none"
                value={userEditForm?.email || ""}
                onChange={e => setUserEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Address</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-xs text-navy outline-none min-h-[100px] resize-none"
                value={userEditForm?.address || ""}
                onChange={e => setUserEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsUserEditOpen(false)} className="rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button onClick={saveUserEdits} className="bg-navy hover:bg-navy/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest px-8">Save Changes</Button>
          </DialogFooter>
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
                placeholder="e.g. Construction & Maintenance"
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
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Bell className="text-teal" /> Notifications
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-[8px] font-black uppercase text-teal hover:text-white hover:bg-white/10 h-auto py-1.5 px-2"
                      onClick={markAllNotifsRead}
                    >
                      Mark All Read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-[8px] font-black uppercase text-red-400 hover:text-white hover:bg-red-500/20 h-auto py-1.5 px-2"
                      onClick={clearAllNotifs}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
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
                  onClick={() => {
                    if (notif.relatedId && notif.type === 'booking_new') {
                      const booking = bookings.find(b => b.id === notif.relatedId);
                      if (booking) {
                        setSelectedBookingForDetails(booking);
                        setIsNotifOpen(false);
                      } else {
                        toast.error("Booking data not found or still loading");
                      }
                    }
                    markNotifRead(notif.id);
                  }}
                  className={`p-5 rounded-2xl border transition-all flex gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    notif.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'booking_new' ? 'bg-blue-50 text-blue-600' : 'bg-teal/10 text-teal'
                  }`}>
                    {notif.type === 'booking_new' ? <Calendar size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-navy text-sm uppercase tracking-tight truncate pr-2">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {safeDateFormatter(notif.timestamp)}
                      </span>
                      <div className="flex gap-2 shrink-0">
                        {!notif.read && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); markNotifRead(notif.id); }}>Mark Read</Button>
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
            <Button onClick={() => setIsNotifOpen(false)} className="w-full h-12 rounded-xl bg-navy hover:bg-navy/90 text-white font-black text-[10px] uppercase tracking-widest">Close Panel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[90vw] w-full h-[90vh] rounded-[32px] p-0 overflow-hidden outline-none font-sans border-none shadow-2xl flex flex-col">
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
                      {(selectedUserForHistory.name || 'C')[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-navy uppercase tracking-tighter">{selectedUserForHistory.name || 'Customer'}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-bold text-gray-400">
                        <span className="flex items-center gap-1"><Phone size={12} className="text-teal" /> {maskPhone(selectedUserForHistory.phone)}</span>
                        <span className="flex items-center gap-1 font-medium">{maskEmail(selectedUserForHistory.email) || 'No email provided'}</span>
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
                    <TabsTrigger value="reports" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-teal data-[state=active]:text-navy">
                      Reports ({userReports.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-teal data-[state=active]:text-navy">
                      Reviews ({userReviews.length})
                    </TabsTrigger>
                    {selectedUserForHistory.isStaff && (
                      <TabsTrigger value="assignments" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-teal data-[state=active]:text-navy">
                        Work Done ({staffAssignments.length})
                      </TabsTrigger>
                    )}
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
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userBookings.map((b) => (
                              <TableRow key={b.id} className="border-b border-gray-50 last:border-none">
                                <TableCell className="px-6 py-4 font-bold text-navy text-sm">{b.serviceName}</TableCell>
                                <TableCell className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">{b.tier}</TableCell>
                                <TableCell className="px-6 py-4 text-xs font-medium text-gray-500">
                                  {safeDateFormatter(b.appointmentDate || b.bookingDate || b.timestamp)}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>
                                    {b.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right font-black text-navy text-sm">₹{b.price}</TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                  <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    className="inline-flex h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-white rounded-lg items-center justify-center bg-teal hover:bg-teal/90 shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBookingToAssign(b);
                                      setPayoutAmount(Math.round(b.price * 0.75));
                                      setIsStaffModalOpen(true);
                                    }}
                                  >
                                    <Briefcase size={12} className="mr-1.5" /> Assign
                                  </motion.button>
                                </TableCell>
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
                                  {inv.type || 'Invoice'} • {safeDateFormatter(inv.timestamp || inv.date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div 
                                className="font-black text-navy mb-2 text-xs max-w-[100px] truncate" 
                                title={`₹${inv.total || inv.totalAmount}`}
                              >
                                ₹{inv.total || inv.totalAmount}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[8px] font-black uppercase rounded-lg px-2 border-gray-200"
                                  onClick={() => navigate(`/invoice/${inv.id}`)}
                                >
                                  View PDF
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

                  <TabsContent value="reports" className="m-0 space-y-4">
                    {(userReports || []).length > 0 ? (
                      <div className="space-y-3">
                        {userReports.map((report: any) => (
                          <div key={report.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] uppercase">{report.category || 'Issue'}</Badge>
                              <span className="text-[10px] font-bold text-gray-400">{safeDateFormatter(report.createdAt)}</span>
                            </div>
                            <h4 className="font-bold text-navy text-sm mb-1">{report.subject}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                            <div className="mt-3 flex items-center justify-between text-[10px]">
                              <span className={`font-black uppercase tracking-widest ${report.status === 'Resolved' ? 'text-green-500' : 'text-amber-500'}`}>
                                {report.status || 'Open'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                        <AlertCircle className="mx-auto text-gray-200" size={48} />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No reports filed by this user</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="m-0 space-y-4">
                    {userReviews.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {userReviews.map((review) => (
                          <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} className={i < review.rating ? "fill-teal text-teal" : "text-gray-200"} />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {safeDateFormatter(review.timestamp || review.date)}
                              </span>
                            </div>
                            <p className="text-sm font-black text-navy uppercase tracking-tight">{review.serviceName}</p>
                            <p className="text-xs text-gray-500 italic leading-relaxed">"{review.comment}"</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                        <Star className="mx-auto text-gray-200" size={48} />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No reviews written by this user</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="assignments" className="m-0 space-y-4">
                    {staffAssignments.length > 0 ? (
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Client</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Service</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10">Date</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10 text-center">Status</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest px-6 h-10 text-right">Earning</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staffAssignments.map((b) => (
                              <TableRow key={b.id} className="border-b border-gray-50 last:border-none">
                                <TableCell className="px-6 py-4 font-bold text-navy text-xs">{b.userName}</TableCell>
                                <TableCell className="px-6 py-4 text-xs font-medium text-gray-600">{b.serviceName}</TableCell>
                                <TableCell className="px-6 py-4 text-[10px] font-medium text-gray-500">
                                  {safeDateFormatter(b.completionDate || b.appointmentDate)}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>
                                    {b.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right font-black text-green-600 text-xs">₹{b.payoutAmount || 0}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                        <Briefcase className="mx-auto text-gray-200" size={48} />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No work history found for this staff member</p>
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

      {/* Manual Visit Creation Dialog */}
      <Dialog open={isManualBookingOpen} onOpenChange={setIsManualBookingOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
          <DialogHeader className="bg-navy p-10 text-white relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Create Manual Visit</DialogTitle>
            <DialogDescription className="text-teal font-bold uppercase tracking-widest text-[10px] mt-1">
              Add a visit directly to the schedule for offline or phone bookings
            </DialogDescription>
            <button onClick={() => setIsManualBookingOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
              <XCircle size={32} />
            </button>
          </DialogHeader>

          <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
             {/* Customer Details */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Customer Name</label>
                   <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:border-indigo-600 transition-all"
                      value={manualBookingData.userName}
                      onChange={e => setManualBookingData(prev => ({ ...prev, userName: e.target.value }))}
                      placeholder="Enter Name"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                   <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:border-indigo-600 transition-all"
                      value={manualBookingData.userPhone}
                      onChange={e => setManualBookingData(prev => ({ ...prev, userPhone: e.target.value }))}
                      placeholder="Mobile Number"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Detailed Address</label>
                <input 
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm text-navy outline-none focus:border-indigo-600 transition-all"
                   value={manualBookingData.userAddress}
                   onChange={e => setManualBookingData(prev => ({ ...prev, userAddress: e.target.value }))}
                   placeholder="Full address of visit"
                />
             </div>

             {/* Service & Price */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Type</label>
                   <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none"
                      value={manualBookingData.serviceName}
                      onChange={e => setManualBookingData(prev => ({ ...prev, serviceName: e.target.value }))}
                   >
                      {CORE_SERVICES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      <option value="General Maintenance">General Maintenance</option>
                      <option value="Emergency Repair">Emergency Repair</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assign Professional (Optional)</label>
                   <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none"
                      value={manualBookingData.staffId}
                      onChange={e => {
                        const sId = e.target.value;
                        const sName = users.find(u => u.uid === sId)?.name || '';
                        setManualBookingData(prev => ({ ...prev, staffId: sId, staffName: sName }));
                      }}
                   >
                      <option value="">-- No Professional Unassigned --</option>
                      {users.filter(u => u.isStaff).map(staff => (
                        <option key={staff.uid} value={staff.uid}>{staff.name} - {staff.staffCategory || 'Staff'}</option>
                      ))}
                   </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tier / Material Booking</label>
                   <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none"
                      value={manualBookingData.tier}
                      onChange={e => setManualBookingData(prev => ({ ...prev, tier: e.target.value as any }))}
                   >
                      <option value="LABOUR">Service Labour Only</option>
                      <option value="MATERIAL">Materials Included</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Agreed Price</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">₹</div>
                      <input 
                         type="number"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-8 pr-5 py-4 font-black text-sm text-navy outline-none"
                         value={(!manualBookingData.price || isNaN(manualBookingData.price)) ? '' : manualBookingData.price}
                         onChange={e => setManualBookingData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      />
                   </div>
                </div>
             </div>

             {/* Appointment */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Visit Date</label>
                   <input 
                      type="date"
                      className="w-full bg-white border border-indigo-100 rounded-2xl px-5 py-4 font-black text-sm text-navy outline-none"
                      value={manualBookingData.appointmentDate}
                      onChange={e => setManualBookingData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Visit Slot</label>
                   <select 
                      className="w-full bg-white border border-indigo-100 rounded-2xl px-4 py-4 font-black text-xs text-navy outline-none"
                      value={manualBookingData.appointmentSlot}
                      onChange={e => setManualBookingData(prev => ({ ...prev, appointmentSlot: e.target.value }))}
                   >
                      <option>Morning (10 AM - 1 PM)</option>
                      <option>Afternoon (1 PM - 4 PM)</option>
                      <option>Evening (4 PM - 7 PM)</option>
                   </select>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <Button 
                   variant="outline" 
                   className="flex-1 h-16 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-gray-400 border-gray-200"
                   onClick={() => setIsManualBookingOpen(false)}
                >
                   Discard
                </Button>
                <Button 
                   className="flex-[2] h-16 rounded-[24px] bg-indigo-600 hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                   onClick={handleCreateManualVisit}
                >
                   <CheckCircle size={18} /> Confirm & Schedule Visit
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!bookingToDeleteId} onOpenChange={(open) => !open && setBookingToDeleteId(null)}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">Confirm Removal</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Are you sure you want to permanently delete this booking? This action cannot be undone and will remove the record from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex flex-row">
            <Button 
              variant="outline" 
              onClick={() => setBookingToDeleteId(null)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteBooking}
              disabled={isDeleting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Delete Confirmation Dialog */}
      <Dialog open={!!serviceToDeleteId} onOpenChange={(open) => !open && setServiceToDeleteId(null)}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">Delete Service?</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Are you sure you want to delete this service and all its sub-categories? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex flex-row">
            <Button 
              variant="outline" 
              onClick={() => setServiceToDeleteId(null)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteService}
              disabled={isDeleting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation Dialog */}
      <Dialog open={!!categoryToDeleteId} onOpenChange={(open) => !open && setCategoryToDeleteId(null)}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">Delete Category?</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Are you sure you want to delete this category? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex flex-row">
            <Button 
              variant="outline" 
              onClick={() => setCategoryToDeleteId(null)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
              disabled={isDeleting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Delete Confirmation Dialog */}
      <Dialog open={!!invoiceToDeleteId} onOpenChange={(open) => !open && setInvoiceToDeleteId(null)}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-navy uppercase tracking-tighter">Delete Invoice?</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Are you sure you want to delete this invoice permanently? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex flex-row">
            <Button 
              variant="outline" 
              onClick={() => setInvoiceToDeleteId(null)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteInvoice}
              disabled={isDeleting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </main>
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl border-none shadow-none bg-transparent flex items-center justify-center">
          <img src={previewImage || ''} alt="Payment Proof" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
        </DialogContent>
      </Dialog>
    </div>
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
