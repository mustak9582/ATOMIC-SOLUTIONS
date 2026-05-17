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
import BillingCenter from './BillingCenter';
import { Button } from './ui/button';
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

  useEffect(() => {
    // Initialize notification sound
    const audio = document.createElement('audio');
    audio.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    notificationSound.current = audio;
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
        const sorted = (data as Booking[]).sort((a,b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });
        
        // Detect new bookings
        if (prevBookingsCount.current !== null && sorted.length > prevBookingsCount.current) {
          const newBooking = sorted[0]; 
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
      }, [], (err) => console.error("[AdminDashboard] Bookings sub error:", err));
      
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
    
    const message = `*Booking Confirmed - Atomic Solutions*%0A%0AHello *${booking.userName}*,%0A%0AYour booking for *${booking.serviceName} (${booking.subCategory})* has been confirmed.%0A%0A*Visit Details:*%0A📅 Date: ${date}%0A🕒 Time: ${booking.appointmentSlot}%0A${booking.staffName ? `🛠️ Technician: ${booking.staffName}` : ''}%0A📍 Address: ${booking.userAddress}%0A%0ABy: *Atomic Solutions*`;
    
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
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      toast.info('Generating PDF...', { duration: 2000 });

      // 1. Header Section (Matching Reference Image)
      const logoUrl = appSettings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";
      
      // Top row: Billing Memo and Slogan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });
      doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 12, { align: 'right' });

      // Company Name (Center, Big)
      doc.setFontSize(22);
      doc.setTextColor(20, 25, 60); // Navy
      doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 22, { align: 'center' });
      
      // Mobile (Right, below slogan)
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`MOB:- ${appSettings?.phone || '9582268658'}`, pageWidth - 15, 18, { align: 'right' });

      // Address (Centered, below name)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const addressStr = appSettings?.address || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149';
      doc.text(addressStr, pageWidth / 2, 28, { align: 'center' });

      // Logo (Left)
      try {
        doc.addImage(logoUrl, 'PNG', 15, 13, 20, 20);
      } catch (e) { console.error('Logo add failed'); }

      // 2. SL NO and DATE (with dots as per image)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const invoiceTypePrefix = invoice.type === 'Invoice' ? 'INV-' : 'EST-';
      const slNoValue = invoice.estimateNumber ? invoice.estimateNumber.split('-').pop() : '';
      doc.text(`SL NO:- ${invoiceTypePrefix}${slNoValue}`, 15, 42);
      doc.text(`DATE:- ${new Date(invoice.date || invoice.timestamp || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - 15, 42, { align: 'right' });

      // 3. M/S Line (Full width with dots)
      doc.setFont('helvetica', 'bold');
      doc.text(`M/S ${invoice.customerName || ''}`, 15, 52);
      doc.setFont('helvetica', 'normal');
      doc.text('..........................................................................................................................................................................', 24, 53);

    const tableData = [
      ...invoice.items.map((item: any, idx: number) => [
        idx + 1,
        item.description ? `${item.name}\n${item.description}` : item.name,
        item.quantity,
        item.rate.toLocaleString('en-IN'),
        (item.rate * item.quantity).toLocaleString('en-IN')
      ])
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

    // Table extensions - Connect all the way down to total row
    const footerY = pageHeight - 50;
    const totalRowY = footerY - 15;

    if (finalY < totalRowY) {
       const cols = [15, 30, pageWidth - 100, pageWidth - 80, pageWidth - 50, pageWidth - 15];
       cols.forEach(x => {
         doc.line(x, finalY, x, totalRowY);
         // Also go through the total row down to footer line
         doc.line(x, totalRowY + 10, x, footerY - 5);
       });
       doc.line(15, totalRowY, pageWidth - 15, totalRowY);
       finalY = totalRowY;
    }

    // Lower Section (GST & Grand Total) - Placed at bottom
    let currentY = footerY - 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`TOTAL: ₹ ${invoice.totalAmount.toLocaleString('en-IN')}/-`, pageWidth - 20, currentY, { align: 'right' });
    
    doc.setFontSize(9);
    if (invoice.roundOff && invoice.roundOff !== 0) {
       currentY -= 7;
       doc.text(`ADJUSTMENT`, pageWidth - 50, currentY, { align: 'right' });
       doc.text(`${invoice.roundOff.toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
    }
    if (invoice.gstAmount) {
       currentY -= 7;
       doc.text(`GST (${invoice.gstPercentage}%)`, pageWidth - 50, currentY, { align: 'right' });
       doc.text(`${invoice.gstAmount.toLocaleString('en-IN')}`, pageWidth - 20, currentY, { align: 'right' });
    }

    // Footer
    
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
    doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 20, footerY + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 25, { align: 'right' });

    const cleanFileName = `${invoice.type || 'Invoice'}_${invoice.estimateNumber || 'No'}`.replace(/[^a-z0-9_-]/gi, '_');
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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-teal/30">
      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} className="hidden lg:flex w-72 flex-shrink-0" />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]">
        {/* Modern Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 md:px-8 md:py-6 flex items-center justify-between">
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
            
            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-navy uppercase tracking-tighter leading-none">
                ATOMIC SOLUTIONS ADMIN
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                <ShieldCheck size={12} className="text-teal" /> 
                {activeTab === 'stats' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} • Control Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick Stats Search */}
            <div className="hidden xl:flex items-center gap-4 bg-gray-50 border border-gray-100 px-5 py-2.5 rounded-2xl">
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

        <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
            {/* Overview Section */}
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
                             <div className="text-[11px] font-bold text-gray-400 mt-0.5 tracking-tight">{maskPhone(u.phone) || 'Registration pending'}</div>
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

          <TabsContent value="bookings" id="bookings">
            <div className="mb-8 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
              <div className="flex items-center gap-3 w-full xl:w-auto">
                <Button 
                  variant="outline"
                  onClick={() => handleTabChange('stats')}
                  className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest bg-white shadow-sm hover:translate-x-[-4px] transition-transform"
                >
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                
                <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                  {(['All', 'Pending', 'Accepted', 'Completed', 'Rejected'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        statusFilter === status 
                          ? 'bg-navy text-white shadow-lg' 
                          : 'text-gray-400 hover:text-navy hover:bg-gray-50'
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search bookings by customer, phone or service..."
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm shadow-sm focus:ring-4 focus:ring-navy/5 outline-none transition-all placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                      {filteredBookings.map((booking) => {
                        const userProfile = users.find(u => u.uid === booking.userId);
                        const displayName = booking.userName || userProfile?.name || 'Customer';
                        const displayPhone = booking.userPhone || userProfile?.phone || '';
                        const displayWhatsapp = booking.whatsappNumber || userProfile?.whatsappNumber || displayPhone;
                        const displayAddress = booking.userAddress || userProfile?.address || 'No Address Provided';

                        return (
                          <TableRow 
                            key={booking.id} 
                            className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none cursor-pointer"
                            onClick={() => setSelectedBookingForDetails(booking)}
                          >
                            <TableCell className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 leading-tight mb-1">{displayName}</span>
                                <div className="flex items-center gap-2 mb-1">
                                   <a 
                                     href={`tel:${displayPhone}`} 
                                     onClick={(e) => e.stopPropagation()}
                                     className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                   >
                                     <Phone size={10} /> {maskPhone(displayPhone)}
                                   </a>
                                   {(displayWhatsapp) && (
                                     <a 
                                       href={formatWhatsAppLink(displayWhatsapp)} 
                                       onClick={(e) => e.stopPropagation()}
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1"
                                     >
                                       <MessageCircle size={10} /> WhatsApp
                                     </a>
                                   )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px] font-medium">{displayAddress}</span>
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
                              <span className="text-xs font-black text-navy">{safeDateFormatter(booking.appointmentDate || booking.timestamp)}</span>
                              <span className="text-[10px] font-bold text-teal uppercase tracking-tight">{booking.appointmentSlot}</span>
                            </>
                          ) : (
                            <div className="flex flex-col items-start">
                              <Badge variant="outline" className="text-[8px] font-black uppercase text-amber-600 border-amber-200 bg-amber-50 animate-pulse mb-1">
                                ⚠️ Schedule Pending
                              </Badge>
                              <span className="text-[9px] text-gray-400 uppercase">Booked: {safeDateFormatter(booking.timestamp)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge className={`rounded-lg uppercase text-[9px] font-black px-2 py-1 shadow-sm ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                              className="h-8 w-8 text-teal-600 rounded-lg flex items-center justify-center bg-teal-50"
                              onClick={() => {
                                setBookingToAssign(booking);
                                setPayoutAmount(Math.round(booking.price * 0.75));
                                setIsStaffModalOpen(true);
                              }}
                              title="Assign Staff"
                            >
                              <Briefcase size={14} />
                            </motion.button>
                           <motion.button 
                             whileTap={{ scale: 0.9 }}
                             className="h-8 w-8 text-green-600 rounded-lg flex items-center justify-center bg-green-50"
                             onClick={() => {
                               const text = `Hi ${booking.userName}, regarding your booking for ${booking.serviceName} on ${booking.appointmentDate || 'ASAP'}...`;
                               window.open(formatWhatsAppLink(booking.whatsappNumber || booking.userPhone, text), '_blank');
                             }}
                           >
                             <MessageCircle size={14} />
                           </motion.button>
                           {booking.status === 'Pending' && (
                             <>
                               <motion.button 
                                 whileTap={{ scale: 0.9 }} 
                                 size="icon" 
                                 variant="ghost" 
                                 className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center" 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (!booking.appointmentDate) {
                                     setSelectedBookingForDetails(booking);
                                     toast.info('Please set a visit date first');
                                   } else {
                                     updateBooking(booking.id, { status: 'Accepted' });
                                   }
                                 }} 
                                 title="Accept"
                               >
                                 <CheckCircle size={16} />
                               </motion.button>
                               <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'In Progress' }); }} title="Start Work"><Clock size={16} /></motion.button>
                               <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'Rejected' }); }} title="Reject"><XCircle size={16} /></motion.button>
                             </>
                           )}
                           {['Accepted', 'In Progress'].includes(booking.status) && (
                             <div className="flex gap-1">
                               {booking.status === 'Accepted' && (
                                 <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'In Progress' }); }} title="In Progress"><Clock size={16} /></motion.button>
                               )}
                               <motion.button whileTap={{ scale: 0.9 }} size="sm" variant="outline" className="h-8 px-3 border-navy/20 text-navy font-black text-[10px] uppercase rounded-lg hover:bg-navy hover:text-white" onClick={(e) => { e.stopPropagation(); updateBooking(booking.id, { status: 'Completed' }); }}>Done</motion.button>
                             </div>
                           )}
                           <motion.button 
                             whileTap={{ scale: 0.9 }} 
                             className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-red-50 transition-colors" 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               setBookingToDeleteId(booking.id);
                             }} 
                             title="Delete"
                           >
                             <Trash2 size={14} />
                           </motion.button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center text-navy/20">
                            <Calendar size={32} />
                          </div>
                          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No bookings found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

                  <TabsContent value="schedule" id="schedule">
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost"
                    onClick={() => handleTabChange('stats')}
                    className="p-3 hover:bg-gray-50 rounded-2xl"
                  >
                    <ArrowLeft size={20} className="text-navy" />
                  </Button>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                      Visit Center
                      <Badge className="bg-indigo-50 text-indigo-600 border-none font-black px-3 py-1 rounded-lg">LIVE</Badge>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage all active and requested field visits</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl">
                      <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2">
                        <Calendar size={14} /> Schedule
                      </div>
                      <div className="px-5 py-2.5 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-navy cursor-pointer transition-colors" onClick={() => handleTabChange('bookings')}>Requests</div>
                   </div>
                   <Button 
                      onClick={() => setIsManualBookingOpen(true)}
                      className="bg-navy hover:bg-teal text-white h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy/20 transition-all flex items-center gap-2"
                   >
                     <Plus size={18} /> Create Manual Visit
                   </Button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Left Column: Today & Pending */}
                 <div className="lg:col-span-4 space-y-8">
                    {/* Today's Stats */}
                    <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-200 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Today's Visits</p>
                          <h4 className="text-4xl font-black">{bookings.filter(b => b.appointmentDate === todayStr).length}</h4>
                       </div>
                       <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center backdrop-blur-sm">
                          <Clock size={32} />
                       </div>
                    </div>

                    {/* Pending Confirmation (User Created) */}
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-navy uppercase tracking-widest px-2 flex items-center justify-between">
                          <span>Awaiting Approval</span>
                          <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px]">{bookings.filter(b => b.status === 'Pending').length}</Badge>
                       </h3>
                       <div className="space-y-3">
                          {bookings.filter(b => b.status === 'Pending').length === 0 ? (
                            <div className="bg-gray-50/50 p-8 rounded-[32px] border border-dashed border-gray-200 text-center">
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">No new requests</p>
                            </div>
                          ) : (
                            bookings
                              .filter(b => b.status === 'Pending')
                              .slice(0, 5)
                              .map(req => (
                                <div key={req.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:border-teal/30 transition-all cursor-pointer group" onClick={() => setSelectedBookingForDetails(req)}>
                                   <div className="flex items-center gap-4 mb-4">
                                      <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
                                         <UserCircle size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[11px] font-black text-navy uppercase tracking-tight truncate">{req.userName}</p>
                                         <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                                            <Calendar size={10} /> {req.appointmentDate || 'No Date set'}
                                         </div>
                                      </div>
                                      <Badge className="bg-teal text-navy text-[8px] font-black px-2 py-0.5 rounded-md uppercase">Pending</Badge>
                                   </div>
                                   <div className="flex gap-2">
                                      <Button 
                                         className="flex-1 h-9 rounded-xl bg-teal/10 hover:bg-teal text-teal hover:text-white text-[9px] font-black uppercase transition-all"
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBookingForDetails(req);
                                         }}
                                      >
                                         Review & Approve
                                      </Button>
                                   </div>
                                </div>
                              ))
                          )}
                          {bookings.filter(b => b.status === 'Pending').length > 5 && (
                             <Button variant="ghost" className="w-full text-[9px] font-black uppercase text-gray-400 hover:text-navy" onClick={() => handleTabChange('bookings')}>View All Requests</Button>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Timeline */}
                 <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-sm font-black text-navy uppercase tracking-widest px-2 flex items-center gap-3">
                       Confirmed Schedule
                       <div className="h-px flex-1 bg-gray-100" />
                    </h3>
                    
                    <div className="bg-white rounded-[40px] shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden">
                       <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                          <div className="flex gap-4">
                             <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-[10px] font-black text-navy uppercase tracking-widest">Upcoming</div>
                             <div className="px-5 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-navy cursor-pointer transition-colors">By Pro</div>
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total: {bookings.filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected').length} Confirmed</div>
                       </div>
                       
                       <Table>
                          <TableHeader className="bg-white">
                             <TableRow className="hover:bg-transparent border-b-gray-50">
                                <TableHead className="text-[10px] font-black uppercase px-8 h-12">Client & Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase h-12">Schedule</TableHead>
                                <TableHead className="text-[10px] font-black uppercase h-12">Assigned To</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right px-8 h-12">Action</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {bookings
                               .filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected')
                               .sort((a,b) => {
                                 const tA = new Date(a.appointmentDate || 0).getTime();
                                 const tB = new Date(b.appointmentDate || 0).getTime();
                                 return tA - tB;
                               })
                               .map(visit => (
                                 <TableRow key={visit.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer border-b-gray-50/50" onClick={() => setSelectedBookingForDetails(visit)}>
                                    <TableCell className="px-8 py-7">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${visit.status === 'In Progress' ? 'bg-blue-600 animate-pulse shadow-lg shadow-blue-200' : 'bg-navy shadow-sm'}`}>
                                             {visit.status === 'In Progress' ? <Clock size={18} /> : <Calendar size={18} />}
                                          </div>
                                          <div className="min-w-0">
                                             <div className="font-black text-navy text-sm uppercase tracking-tight truncate max-w-[150px]">{visit.serviceName || 'Maintenance Job'}</div>
                                             <div className="text-[10px] text-teal font-bold uppercase tracking-widest mt-0.5">{visit.userName}</div>
                                             <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1">
                                                <MapPin size={8} /> {visit.userAddress}
                                             </div>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="space-y-1.5">
                                          <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] px-3 py-1 uppercase rounded-lg">
                                             {new Date(visit.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </Badge>
                                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{visit.appointmentSlot}</div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       {visit.staffName ? (
                                          <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 rounded-lg bg-teal text-navy flex items-center justify-center font-black text-[9px]">{visit.staffName?.[0]}</div>
                                             <div className="text-[10px] font-black text-navy uppercase truncate max-w-[100px]">{visit.staffName}</div>
                                          </div>
                                       ) : (
                                          <Badge variant="outline" className="text-[8px] font-black uppercase text-red-400 border-red-100">Unassigned</Badge>
                                       )}
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                       <div className="flex justify-end gap-2 px-1">
                                          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-xl text-gray-300 hover:text-indigo-600 hover:bg-white shadow-sm border border-transparent hover:border-gray-100" title="Reschedule">
                                             <Clock size={16} />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-xl text-gray-300 hover:text-teal hover:bg-white shadow-sm border border-transparent hover:border-gray-100" onClick={(e) => {
                                             e.stopPropagation();
                                             updateBooking(visit.id, { status: 'Completed' });
                                          }} title="Complete">
                                             <CheckCircle size={16} />
                                          </Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ))
                             }
                             {bookings.filter(b => b.appointmentDate && b.status !== 'Completed' && b.status !== 'Rejected').length === 0 && (
                               <TableRow>
                                 <TableCell colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-10">
                                       <Calendar size={64} className="text-navy" />
                                       <p className="text-lg font-black uppercase tracking-[0.4em]">Schedule Clear</p>
                                    </div>
                                 </TableCell>
                               </TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </div>
                 </div>
              </div>
            </div>
          </TabsContent>

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
                          <span className="flex items-center gap-2">{maskPhone(user.phone)} {user.whatsappNumber && <MessageCircle size={10} className="text-green-500"/>}</span>
                          <span className="text-[11px] opacity-70 mb-1">{maskEmail(user.email)}</span>
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

          <TabsContent value="invoices" id="invoices" className="m-0 focus-visible:outline-none">
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
                            <span className="text-[10px] font-medium text-gray-400">{maskPhone(inv.customerPhone)}</span>
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
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-10 w-10 p-0 rounded-xl border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDeleteInvoice(inv.id);
                               }}
                             >
                               <Trash2 size={18} />
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
                              {staff.whatsappNumber ? maskPhone(staff.whatsappNumber) : maskPhone(staff.phone)}
                            </a>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">Email</span>
                            <span className="text-navy truncate max-w-[140px]">{maskEmail(staff.email) || 'N/A'}</span>
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
                                variant="outline"
                                className="h-10 rounded-xl border-orange-200 text-orange-600 text-[10px] font-black uppercase tracking-widest"
                                onClick={() => rejectStaff(staff.uid)}
                              >
                                <XCircle size={14} className="mr-2" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100"
                              onClick={() => viewUserHistory(staff)}
                            >
                              View History
                            </Button>
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

          <TabsContent value="reports" id="reports" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-red-50/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Customer Complaints</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solutions Center & Communication</p>
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
                              <span className="text-[10px] font-bold text-gray-400">• {safeDateFormatter(report.createdAt)}</span>
                            </div>

                            <h3 className="text-xl font-black text-navy uppercase tracking-tight mb-3">{report.title}</h3>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 bg-white p-4 rounded-2xl border border-gray-100">{report.description}</p>
                            
                            <div className="flex items-center gap-6 text-[10px] uppercase font-black tracking-widest text-navy mb-6">
                              <div className="flex items-center gap-2">
                                <UserCircle size={16} className="text-gray-300" /> {report.userName}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-300" /> {maskPhone(report.userPhone)}
                              </div>
                            </div>

                            {report.attachments && report.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-4 mb-6">
                                {report.attachments.map((file: any, i: number) => (
                                  <div key={i} className="relative group/media cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                                      {file.type === 'image' ? (
                                        <img src={file.url} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover/media:scale-110" />
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

          <TabsContent value="pricing">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Manage Services</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <div className={cn(
                         "w-8 h-4 rounded-full transition-colors relative cursor-pointer",
                         isAutoSave ? "bg-teal" : "bg-gray-200"
                       )} onClick={() => setIsAutoSave(!isAutoSave)}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                            isAutoSave ? "left-[18px]" : "left-0.5"
                          )} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-navy">Live Sync Mode</span>
                       {isAutoSave && <Zap size={10} className="text-teal animate-pulse" />}
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
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
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setServiceToDeleteId(s.id)}>
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
                                    <div className="flex-1 relative group/field">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Sub-category Name</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs focus:bg-white focus:border-blue-100 outline-none transition-all"
                                        defaultValue={sub.name}
                                        onBlur={(e) => {
                                          if (e.target.value === sub.name) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, name: e.target.value };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                      {!isAutoSave && dirtyServices[s.id] && (
                                        <button 
                                          onClick={async () => {
                                            const newSubs = [...(s.subCategories || [])];
                                            await updateService(s.id, { subCategories: newSubs });
                                            setDirtyServices(prev => { const next = {...prev}; delete next[s.id]; return next; });
                                            toast.success("Saved!");
                                          }}
                                          className="absolute right-2 top-7 opacity-0 group-hover/field:opacity-100 transition-opacity text-teal hover:scale-110"
                                          title="Save Item Now"
                                        >
                                          <Save size={14} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="w-24">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Unit (e.g. Sq. Ft)</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        defaultValue={sub.unit || ''}
                                        onBlur={(e) => {
                                          if (e.target.value === (sub.unit || '')) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, unit: e.target.value };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
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
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-blue-50/30 border border-blue-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-blue-200 pr-8"
                                          defaultValue={sub.labourMin || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.labourMin || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            newSubs[idx] = { ...sub, labourMin: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-blue-400 tracking-widest uppercase block mb-1">Labour Max (₹)</label>
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-blue-50/30 border border-blue-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-blue-200 pr-8"
                                          defaultValue={sub.labourMax || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.labourMax || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            newSubs[idx] = { ...sub, labourMax: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-green-400 tracking-widest uppercase block mb-1">Mat Min (₹)</label>
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-green-50/30 border border-green-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-green-200 pr-8"
                                          defaultValue={sub.materialMin || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.materialMin || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            newSubs[idx] = { ...sub, materialMin: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-green-400 hover:text-green-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-green-400 tracking-widest uppercase block mb-1">Mat Max (₹)</label>
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-green-50/30 border border-green-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-green-200 pr-8"
                                          defaultValue={sub.materialMax || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.materialMax || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            newSubs[idx] = { ...sub, materialMax: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-green-400 hover:text-green-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Fallback Min (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        defaultValue={sub.minPrice}
                                        onBlur={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          if (isNaN(val) || val === sub.minPrice) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, minPrice: val };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Fallback Max (₹)</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        defaultValue={sub.maxPrice}
                                        onBlur={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          if (isNaN(val) || val === sub.maxPrice) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, maxPrice: val };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
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
                            onBlur={(e) => handleLocalServiceUpdate(s.id, { youtubeId: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block text-sm">Images (URLs, one per line)</label>
                          <textarea 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-xs h-24" 
                            defaultValue={(s.images || []).join('\n')} 
                            onBlur={(e) => handleLocalServiceUpdate(s.id, { images: e.target.value.split('\n').filter(l => l.trim()) })}
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
                                handleLocalServiceUpdate(s.id, { detailedDescription: content });
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

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                           <Button 
                             disabled={!dirtyServices[s.id]}
                             onClick={async () => {
                               const loadingToast = toast.loading(`Saving ${s.name} prices...`);
                               try {
                                 await updateService(s.id, { 
                                   subCategories: s.subCategories,
                                   youtubeId: s.youtubeId,
                                   images: s.images,
                                   detailedDescription: s.detailedDescription
                                 });
                                 setDirtyServices(prev => {
                                   const next = { ...prev };
                                   delete next[s.id];
                                   return next;
                                 });
                                 toast.success(`${s.name} updated successfully!`, { id: loadingToast });
                               } catch (err) {
                                 toast.error("Failed to save changes", { id: loadingToast });
                               }
                             }}
                             className={cn(
                               "rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all",
                               dirtyServices[s.id] 
                                 ? "bg-teal text-white shadow-xl shadow-teal/20 scale-105" 
                                 : "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
                             )}
                           >
                             <Save size={16} className="mr-2" /> Save & Update Website
                           </Button>
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
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setCategoryToDeleteId(category.id)}>
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
                
                {/* Global Upload Status */}
                {uploadProgress.active && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 max-w-xs bg-blue-50 border border-blue-100 rounded-3xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] font-black text-blue-600 uppercase mb-1">
                        <span className="truncate max-w-[100px]">{uploadProgress.percent < 100 ? `Posting: ${uploadProgress.fileName}` : 'Processing...'}</span>
                        <span>{Math.round(uploadProgress.percent)}%</span>
                      </div>
                      <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        cancelUploadRef.current = true;
                        setUploadProgress({ active: false, percent: 0, fileName: '' });
                        toast.error("Upload Cancelled");
                      }}
                      className="p-2 hover:bg-blue-100 rounded-full text-blue-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-3">
                   <Button 
                    variant="outline" 
                    className="rounded-2xl border-gray-200 text-navy font-black text-[10px] uppercase tracking-widest h-14 px-8 hover:bg-gray-50"
                    onClick={() => {
                      const url = prompt('Enter Video ID (YouTube):');
                      const title = prompt('Video Title:', 'Work Showcase');
                      if (url) {
                         const videos = appSettings.videos || [];
                         toast.promise(
                           updateSettings({ videos: [...videos, { id: Date.now().toString(), url, title }] }),
                           {
                             loading: 'Adding video...',
                             success: 'Video Posted Successfully!',
                             error: 'Failed to add video'
                           }
                         );
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
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          cancelUploadRef.current = false;
                          const gallery = appSettings.gallery || [];
                          const totalFiles = files.length;
                          
                          setUploadProgress({ active: true, percent: 0, fileName: files[0].name });
                          
                          try {
                            const newImages: string[] = [];
                            for (let i = 0; i < totalFiles; i++) {
                              if (cancelUploadRef.current) break;
                              
                              const file = files[i];
                              setUploadProgress({ active: true, percent: (i / totalFiles) * 100, fileName: file.name });
                              
                              // Compress before adding
                              const compressed = await compressImage(file);
                              newImages.push(compressed);
                              
                              // Update individual progress within the file loop if needed, but per-file is better
                              setUploadProgress(prev => ({ ...prev, percent: ((i + 1) / totalFiles) * 100 }));
                            }

                            if (!cancelUploadRef.current) {
                               await updateSettings({ gallery: [...gallery, ...newImages] });
                               toast.success(`${totalFiles} Photos posted successfully!`);
                            }
                          } catch (err) {
                            toast.error('Failed to post photos');
                          } finally {
                            setUploadProgress({ active: false, percent: 0, fileName: '' });
                          }
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

          <TabsContent value="settings">
              <Card className="rounded-[40px] border-none shadow-2xl shadow-gray-200/50 p-6 md:p-10 bg-slate-50/50">
                 <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h2 className="text-4xl font-black text-navy uppercase tracking-tighter flex items-center gap-4">
                          <div className="p-3 bg-navy text-white rounded-2xl shadow-xl shadow-navy/20">
                            <Settings size={32} />
                          </div>
                          Root Configuration
                        </h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-20">System Administration • Version 2.4.1</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-navy uppercase tracking-widest">Environment: Production</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-8">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                           <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                             <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy">
                               <ShieldCheck size={28} />
                             </div>
                             <div>
                               <h3 className="font-black text-navy uppercase tracking-tighter">Identity & Security</h3>
                               <p className="text-[10px] font-black text-teal uppercase tracking-widest leading-none mt-1">Fortress Mode Active</p>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="p-4 bg-navy/[0.02] rounded-2xl border border-navy/5">
                               <div className="flex items-center justify-between mb-2">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Operator</span>
                                 <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">Authentic</Badge>
                               </div>
                               <p className="font-black text-navy text-sm truncate">{user?.email}</p>
                               <div className="flex items-center gap-2 mt-2">
                                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Connected to Cloud Infrastructure</span>
                               </div>
                             </div>

                             <div className="p-4 bg-teal/[0.02] rounded-2xl border border-teal/5">
                               <div className="flex items-center justify-between mb-2">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Clearance</span>
                                 <span className="text-[10px] font-black text-teal uppercase tracking-widest italic">Tier 1: Master Admin</span>
                               </div>
                               <div className="grid grid-cols-2 gap-3 mt-4">
                                 <div className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-tight">
                                   <ShieldCheck size={14} className="text-teal" />
                                   Rules Verified
                                 </div>
                                 <div className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-tight">
                                   <LockIcon size={14} className="text-teal" />
                                   Encrypted Session
                                 </div>
                               </div>
                             </div>
                           </div>
                        </section>

                        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                           <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                             <div className="w-12 h-12 rounded-2xl bg-teal/5 flex items-center justify-center text-teal">
                               <ImageIcon size={22} />
                             </div>
                             <div>
                               <h3 className="font-black text-navy uppercase tracking-tighter">Branding & Logo</h3>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Whitelabel Configuration</p>
                             </div>
                           </div>

                           <div className="space-y-6">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Company Logo</label>
                               <div className="flex items-center gap-6">
                                 <div className="w-24 h-24 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden group relative">
                                   {appSettings?.logoUrl ? (
                                     <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                   ) : (
                                     <Layers className="text-gray-200" size={32} />
                                   )}
                                   <label className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                                     <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                         const reader = new FileReader();
                                         reader.onload = () => {
                                           setAppSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                                         };
                                         reader.readAsDataURL(file);
                                       }
                                     }} />
                                     <ImageIcon className="text-white" size={24} />
                                   </label>
                                 </div>
                                 <div className="flex-1 space-y-2">
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                     Recommended: Transparent PNG or SVG.<br/>Max resolution: 512x512px.
                                   </p>
                                   <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl" onClick={() => setAppSettings(p => ({ ...p, logoUrl: '' }))}>Reset Logo</Button>
                                 </div>
                               </div>
                             </div>
                           </div>
                        </section>
                      </div>

                      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 flex flex-col h-full">
                         <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                              <MessageCircle size={24} />
                            </div>
                            <div>
                               <h3 className="font-black text-navy uppercase tracking-tighter">Business Logistics</h3>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Operational Data Hub</p>
                            </div>
                         </div>

                         <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">WhatsApp Hub (with country code)</label>
                               <div className="relative">
                                 <input 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm text-navy outline-none focus:bg-white focus:border-green-400 transition-all font-mono"
                                   value={appSettings?.whatsappNumber || ""}
                                   onChange={(e) => setAppSettings({...appSettings, whatsappNumber: e.target.value})}
                                   placeholder="91XXXXXXXXXX"
                                 />
                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-green-500 rounded-xl text-white">
                                    <MessageCircle size={18} />
                                 </div>
                               </div>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 italic">Format: [91] [Phone Number] • No spaces</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Support Phone</label>
                                 <input 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                   value={appSettings?.phone || ""}
                                   onChange={(e) => setAppSettings({...appSettings, phone: e.target.value})}
                                 />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Support Email</label>
                                 <input 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                                   value={appSettings?.email || ""}
                                   onChange={(e) => setAppSettings({...appSettings, email: e.target.value})}
                                 />
                               </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Head Office Address</label>
                              <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all h-24 resize-none"
                                value={appSettings?.address || ""}
                                onChange={(e) => setAppSettings({...appSettings, address: e.target.value})}
                              />
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Business GSTIN</label>
                               <input 
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all font-mono uppercase"
                                 value={appSettings?.ownerGSTIN || ""}
                                 onChange={(e) => setAppSettings({...appSettings, ownerGSTIN: e.target.value})}
                                 placeholder="e.g. 20ABCDE1234F1Z5"
                               />
                            </div>
                         </div>
                      </section>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-6">
                      <Button 
                        variant="destructive"
                        className="h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] px-10 flex items-center gap-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100"
                        onClick={clearAllNotifs}
                      >
                        <Trash2 size={20} /> Nuclear Reset Notifications
                      </Button>
                      <Button 
                        className="flex-1 bg-navy text-white h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-navy/30 group relative overflow-hidden"
                        onClick={() => updateSettings(appSettings)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/20 to-teal/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 flex items-center justify-center gap-4">
                          <Save size={22} className="group-hover:scale-110 transition-transform" />
                          Commit & Deploy System Updates
                        </span>
                      </Button>
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
                  <div className="font-black text-navy">{maskPhone(selectedBookingForDetails?.userPhone || users.find(u => u.uid === selectedBookingForDetails?.userId)?.phone || '')}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">WhatsApp</div>
                  <div className="font-black text-teal">{maskPhone(selectedBookingForDetails?.whatsappNumber || users.find(u => u.uid === selectedBookingForDetails?.userId)?.whatsappNumber || selectedBookingForDetails?.userPhone || '') || 'N/A'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Email</div>
                  <div className="font-black text-navy text-xs truncate">{maskEmail(selectedBookingForDetails?.userEmail || users.find(u => u.uid === selectedBookingForDetails?.userId)?.email || '')}</div>
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
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Bell className="text-teal" /> Notifications
                </div>
                <div className="flex items-center gap-2">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-[8px] font-black uppercase text-teal hover:text-white hover:bg-white/10"
                      onClick={markAllNotifsRead}
                    >
                      Mark All Read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-[8px] font-black uppercase text-red-400 hover:text-white hover:bg-red-500/20"
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
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-navy text-sm uppercase tracking-tight">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {safeDateFormatter(notif.timestamp)}
                      </span>
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
                            <div className="text-right">
                              <div className="font-black text-navy mb-2 text-xs">₹{inv.total || inv.totalAmount}</div>
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

function StatCard({ title, value, icon, change, color, onClick }: { title: string, value: string | number, icon: React.ReactNode, change?: string, color?: string, onClick?: () => void }) {
  return (
    <Card 
      onClick={onClick}
      className={`rounded-[32px] border-none shadow-xl shadow-navy/5 p-6 bg-white flex items-center gap-5 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all' : ''}`}
    >
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
