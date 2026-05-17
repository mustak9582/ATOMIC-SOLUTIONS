import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { Booking, UserProfile } from '../types';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  User, 
  MapPin, 
  Phone,
  BarChart3,
  Calendar,
  LogOut,
  Settings,
  MessageSquare,
  AlertCircle,
  Bell,
  CheckCircle,
  Filter,
  Search,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';
import { formatWhatsAppLink } from '../lib/utils';

const StaffDashboard: React.FC = () => {
  const { user, profile, logout, isAdmin, isStaff, requestUserLocation, isPendingStaff, isApprovedStaff } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLocating, setIsLocating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  // Safety: If not staff, redirect to home
  useEffect(() => {
    if (!loading && !isStaff && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isStaff, isAdmin, loading, navigate]);
  
  const filteredBookings = bookings.filter(booking => {
    const statusMatch = statusFilter === 'All' || booking.status === statusFilter;
    
    // Date filter logic
    let dateMatch = true;
    if (dateRange.start || dateRange.end) {
      const bookingDate = new Date(booking.timestamp);
      bookingDate.setHours(0, 0, 0, 0);
      
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (bookingDate < startDate) dateMatch = false;
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (bookingDate > endDate) dateMatch = false;
      }
    }
    
    return statusMatch && dateMatch;
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateLocation = async () => {
    setIsLocating(true);
    try {
      await requestUserLocation();
      toast.success('Live location updated!');
    } catch (e) {
      toast.error('Failed to sync location. Please check GPS settings.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!user || !profile) return;

    const unsubscribeBookings = dataService.subscribe('bookings', (allBookings) => {
      // ONLY show bookings explicitly assigned to this staff member by admin
      const staffBookings = allBookings.filter((b: Booking) => b.staffId === user.uid);
      setBookings(staffBookings);
    });

    const unsubscribeNotifications = dataService.subscribe('notifications', (allNotifs) => {
      const staffNotifs = allNotifs
        .filter((n: Notification) => n.userId === user.uid)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(staffNotifs);
      setLoading(false);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeNotifications();
    };
  }, [user]);

  const stats = {
    active: bookings.filter(b => b.status === 'Assigned' || b.status === 'Accepted' || b.status === 'In Progress').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    totalEarnings: bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.payoutAmount || 0), 0),
    pendingPayout: bookings
      .filter(b => b.status === 'Completed' && b.payoutAmount) // Logic for "Paid" status could be added
      .length,
    unreadNotifs: notifications.filter(n => !n.read).length
  };

  const markNotificationRead = async (id: string) => {
    try {
      await dataService.updateDoc('notifications', id, { read: true });
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'In Progress' | 'Completed' | 'Accepted' | 'Rejected') => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      let updateData: Partial<Booking> = { status };
      
      if (status === 'Completed') {
        updateData.completionDate = new Date().toISOString();
      }

      if (status === 'Accepted' && (!booking?.staffId || booking.staffId === '')) {
        // Self-Acceptance Logic
        updateData.staffId = user?.uid;
        updateData.staffName = profile?.name;
      }

      if (status === 'Rejected') {
        // Clear staff assignment and return to Pending for re-assignment
        updateData.status = 'Pending';
        updateData.staffId = '';
        updateData.staffName = '';
      }

      await dataService.updateDoc('bookings', bookingId, updateData);
      
      // Notify customer
      if (booking && (status === 'In Progress' || status === 'Completed' || status === 'Accepted')) {
        let title = '';
        let message = '';
        
        if (status === 'Accepted') {
          title = 'Technician Assigned';
          message = `${profile?.name || 'A technician'} has accepted your booking. You will be notified when they start the service.`;
        } else if (status === 'In Progress') {
          title = 'Service Started';
          message = `Your ${booking.serviceName} service has started. ${profile?.name || 'Technician'} is on the job.`;
        } else {
          title = 'Service Completed';
          message = `Your ${booking.serviceName} service has been completed. Thank you for choosing Atomic Solutions!`;
        }

        await dataService.addDoc('notifications', {
          userId: booking.userId,
          title,
          message,
          type: 'booking_update',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/dashboard'
        }).catch(e => console.warn('Customer notification failed', e));
      }

      // Notify admin if rejected
      if (status === 'Rejected') {
        await dataService.addDoc('notifications', {
          userId: 'admin',
          title: 'Staff Rejected Job',
          message: `${profile?.name || 'A technician'} rejected the assignment for ${booking?.serviceName} (Customer: ${booking?.userName}). Please re-assign.`,
          type: 'booking_update',
          read: false,
          timestamp: new Date().toISOString(),
          link: '/admin#bookings'
        });
      }

      toast.success(status === 'Rejected' ? 'Job assignment rejected' : `Booking status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy border-t-teal rounded-full animate-spin" />
          <p className="text-navy font-bold animate-pulse">Loading Professional Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-navy/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-full flex gap-8 shadow-2xl">
        <button 
          onClick={() => handleTabChange('overview')}
          className={`${activeTab === 'overview' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}
        >
          <BarChart3 size={20} />
          <span className="text-[8px] font-black uppercase">Stats</span>
        </button>
        <button 
          onClick={() => handleTabChange('active')}
          className={`${activeTab === 'active' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}
        >
          <Briefcase size={20} />
          <span className="text-[8px] font-black uppercase">Jobs</span>
        </button>
        <button 
          onClick={() => handleTabChange('history')}
          className={`${activeTab === 'history' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}
        >
          <Clock size={20} />
          <span className="text-[8px] font-black uppercase">History</span>
        </button>
        <button 
          onClick={() => handleTabChange('notifications')}
          className={`${activeTab === 'notifications' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1 relative`}
        >
          <Bell size={20} />
          {stats.unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">
              {stats.unreadNotifs}
            </span>
          )}
          <span className="text-[8px] font-black uppercase">Alerts</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`${activeTab === 'profile' ? 'text-teal' : 'text-white/60'} transition-colors flex flex-col items-center gap-1`}
        >
          <User size={20} />
          <span className="text-[8px] font-black uppercase">Profile</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-navy rounded-[40px] p-8 md:p-12 text-white overflow-hidden relative mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => navigate(-1)}
                className="lg:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
              >
                <ArrowLeft size={20} />
              </motion.button>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-widest border border-teal/30">
                <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                Professional Portal
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4 uppercase">
              {profile?.staffCategory || 'Professional'} PORTAL
            </h1>
            {isPendingStaff && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl mb-4">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Verification Approval</span>
              </div>
            )}
            <p className="text-teal font-black text-sm uppercase tracking-[0.2em] mb-6">
              Authenticated: {profile?.name.toUpperCase()} • DEOGHAR SECTOR
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Button 
                onClick={handleUpdateLocation}
                disabled={isLocating}
                className="bg-teal text-navy hover:bg-white h-10 rounded-full px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <MapPin size={14} className={isLocating ? 'animate-bounce' : ''} />
                {isLocating ? 'Syncing...' : 'Sync Live Location'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 relative z-10">
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-6 rounded-3xl text-center min-w-[120px]">
              <div className="text-2xl font-black text-teal mb-1">{stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Total<br />Earnings</div>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-6 rounded-3xl text-center min-w-[120px]">
              <div className="text-2xl font-black text-white mb-1">{stats.completed}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Jobs<br />Completed</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-100 border border-gray-50 sticky top-24">
              <div className="space-y-2">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-navy/40 hover:bg-gray-50 hover:text-navy transition-all font-black text-[10px] uppercase tracking-widest border border-dashed border-gray-100 mb-2 text-left"
                >
                  <ArrowLeft size={18} /> Go Back
                </button>
                <button 
                  onClick={() => handleTabChange('overview')}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'overview' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'}`}
                >
                  <BarChart3 size={18} /> Overview
                </button>
                <button 
                  onClick={() => handleTabChange('notifications')}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'notifications' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'}`}
                >
                  <div className="flex items-center gap-4">
                    <Bell size={18} /> Notifications
                  </div>
                  {stats.unreadNotifs > 0 && (
                    <Badge className="bg-red-500 text-white border-none text-[8px] font-black h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {stats.unreadNotifs}
                    </Badge>
                  )}
                </button>
                <button 
                  onClick={() => handleTabChange('active')}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'active' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'}`}
                >
                  <Briefcase size={18} /> Active Jobs
                </button>
                <button 
                  onClick={() => handleTabChange('history')}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'history' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'}`}
                >
                  <Clock size={18} /> Job History
                </button>
                <button 
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'profile' ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-navy'}`}
                >
                  <User size={18} /> My Profile
                </button>
                <div className="h-px bg-gray-50 mx-4 my-4" />
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8 bg-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 text-teal opacity-10">
                        <DollarSign size={80} />
                      </div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Next Payment Plan</h3>
                      <div className="text-4xl font-black text-navy mb-4">₹ 0.00</div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Payouts are processed weekly on Mondays.
                      </p>
                    </Card>

                    <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8 bg-white">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Recent Status</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-navy uppercase tracking-widest">Performance</span>
                          <span className="text-[10px] font-black text-teal uppercase tracking-widest">EXCELLENT</span>
                        </div>
                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                          <div className="w-[95%] h-full bg-teal" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          <span>Service Quality</span>
                          <span>95% Positive</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <h2 className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-3">
                        <Clock className="text-teal" size={24} /> My Assignments
                      </h2>
                    </div>
                    
                    {bookings.filter(b => b.status === 'Assigned').length === 0 ? (
                      <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <Briefcase size={32} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No new jobs assigned</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {bookings.filter(b => b.status === 'Assigned').map(booking => (
                          <JobCard 
                            key={booking.id} 
                            booking={booking} 
                            onUpdateStatus={updateBookingStatus}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight">Recent Alerts</h2>
                    {stats.unreadNotifs > 0 && (
                      <Button 
                        variant="ghost" 
                        className="text-[10px] font-black uppercase text-teal"
                        onClick={() => notifications.forEach(n => !n.read && markNotificationRead(n.id))}
                      >
                        Mark All Read
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="bg-white rounded-[32px] p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <Bell size={32} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Card 
                          key={notif.id}
                          className={`rounded-[24px] border-none shadow-lg p-6 transition-all ${notif.read ? 'bg-white opacity-70' : 'bg-white border-l-4 border-l-teal shadow-xl'}`}
                          onClick={() => !notif.read && markNotificationRead(notif.id)}
                        >
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl flex-shrink-0 ${notif.type === 'booking_new' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'}`}>
                              {notif.type === 'booking_new' ? <Briefcase size={20} /> : <Bell size={20} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-navy uppercase tracking-tight text-sm">{notif.title}</h4>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed italic">"{notif.message}"</p>
                              <div className="mt-4 flex justify-between items-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                  {new Date(notif.timestamp).toLocaleDateString()}
                                </span>
                                {notif.link && (
                                  <Button 
                                    size="sm" 
                                    className="h-8 rounded-lg bg-navy text-white text-[8px] font-black uppercase tracking-widest px-4"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTab('active');
                                    }}
                                  >
                                    View Job
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'active' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-black text-navy uppercase tracking-tight px-4">In-Progress Tasks</h2>
                  {bookings.filter(b => b.status === 'Accepted' || b.status === 'In Progress').length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center">
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No active tasks</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {bookings.filter(b => b.status === 'Accepted' || b.status === 'In Progress').map(booking => (
                        <JobCard 
                          key={booking.id} 
                          booking={booking} 
                          onUpdateStatus={updateBookingStatus}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                    <h2 className="text-xl font-black text-navy uppercase tracking-tight">Work Log & History</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="h-10 pl-10 pr-8 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer shadow-sm"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Available (Pending)</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Accepted">Accepted</option>
                          <option value="In Progress">Working (In Progress)</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      </div>

                      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1 shadow-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <input 
                          type="date" 
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-transparent text-[10px] font-bold outline-none uppercase"
                        />
                        <span className="text-gray-300 text-[10px] font-black">TO</span>
                        <input 
                          type="date" 
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-transparent text-[10px] font-bold outline-none uppercase"
                        />
                        {(dateRange.start || dateRange.end) && (
                          <button 
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="p-1 hover:bg-gray-50 rounded-full text-gray-400"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-gray-100">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Search size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No jobs found for these filters</p>
                      <Button 
                        variant="ghost" 
                        className="mt-4 text-[9px] font-black uppercase text-teal"
                        onClick={() => {
                          setStatusFilter('All');
                          setDateRange({ start: '', end: '' });
                        }}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {filteredBookings
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map(booking => (
                        <JobCard 
                          key={booking.id} 
                          booking={booking} 
                          onUpdateStatus={updateBookingStatus} 
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <Card className="rounded-[40px] border-none shadow-2xl p-12 bg-white flex flex-col items-center">
                    <div className="w-24 h-24 bg-navy rounded-[32px] flex items-center justify-center text-white mb-8 shadow-xl">
                      <User size={32} />
                    </div>
                    <div className="w-full space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Name</p>
                          <p className="font-black text-navy">{profile?.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Role</p>
                          <p className="font-black text-teal uppercase">Professional Staff</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                        <p className="font-bold text-navy">{profile?.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                        <p className="font-bold text-navy">{profile?.phone || 'Not set'}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mt-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={16} />
                        <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                          Profile details are managed by administration. Please contact your manager for updates.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

interface JobCardProps {
  booking: Booking;
  onUpdateStatus: (id: string, status: 'In Progress' | 'Completed' | 'Accepted' | 'Rejected') => void;
}

const JobCard: React.FC<JobCardProps> = ({ booking, onUpdateStatus }) => {
  return (
    <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8 bg-white border-l-4 border-l-teal">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <Badge className={`uppercase text-[9px] font-black px-3 py-1 ${booking.status === 'Pending' ? 'bg-orange-500 text-white' : booking.status === 'In Progress' ? 'bg-indigo-500' : 'bg-teal text-navy'}`}>
              {booking.status === 'Pending' ? 'AVAILABLE JOB' : booking.status === 'Assigned' ? 'NEW ASSIGNMENT' : booking.status}
            </Badge>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {new Date(booking.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h4 className="text-2xl font-black text-navy uppercase tracking-tighter mb-2">{booking.serviceName}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase text-teal border-teal/20 px-2">
                {booking.serviceCategory}
              </Badge>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.subCategory || 'General Service'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-teal">
                <User size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-black text-navy uppercase tracking-tight">{booking.userName}</p>
                <a href={`tel:${booking.userPhone}`} className="text-xs font-bold text-teal flex items-center gap-1 mt-1">
                  <Phone size={10} /> {booking.userPhone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-teal">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">{booking.userAddress}</p>
              </div>
            </div>
          </div>

          {booking.workDescription && (
            <div className="bg-navy/5 p-4 rounded-2xl italic text-xs text-gray-600">
              <span className="font-black uppercase text-[8px] tracking-widest block mb-1 not-italic text-navy/40">Instructions:</span>
              "{booking.workDescription}"
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {(booking.status === 'Assigned') && (
              <>
                <Button 
                  onClick={() => onUpdateStatus(booking.id, 'Accepted')}
                  className="h-12 bg-teal text-navy hover:bg-teal/90 rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 md:flex-none md:min-w-[120px]"
                >
                  Accept Job
                </Button>
                <Button 
                  onClick={() => onUpdateStatus(booking.id, 'Rejected')}
                  variant="outline"
                  className="h-12 border-red-200 text-red-500 hover:bg-red-50 rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 md:flex-none md:min-w-[120px]"
                >
                  Reject
                </Button>
              </>
            )}
            {booking.status === 'Accepted' && (
              <Button 
                onClick={() => onUpdateStatus(booking.id, 'In Progress')}
                className="h-12 bg-navy text-white rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 md:flex-none md:min-w-[150px]"
              >
                Start Service
              </Button>
            )}
            {booking.status === 'In Progress' && (
              <Button 
                onClick={() => onUpdateStatus(booking.id, 'Completed')}
                className="h-12 bg-teal text-navy hover:bg-teal/90 rounded-xl uppercase text-[10px] font-black tracking-widest flex-1 md:flex-none md:min-w-[150px]"
              >
                Mark Completed
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => {
                const text = `Hello ${booking.userName}, I am assigned for your service from Atomic Solutions.`;
                window.open(formatWhatsAppLink(booking.userPhone, text), '_blank');
              }}
              className="h-12 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none md:min-w-[150px]"
            >
              <MessageSquare size={14} /> Contact Client
            </Button>
          </div>
        </div>

        <div className="w-full md:w-48 space-y-4">
          <div className="bg-gray-50 p-6 rounded-[24px] text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Job Payout</p>
            <p className="text-2xl font-black text-navy tracking-tighter">₹ {booking.payoutAmount?.toLocaleString('en-IN') || 0}</p>
            <p className="text-[8px] font-bold text-teal uppercase mt-1">Generated</p>
          </div>
          
          <div className="flex items-start gap-2 text-navy/40 p-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[8px] font-medium leading-relaxed italic">
              Payout is based on base labour rate and skill tier. Materials not included.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StaffDashboard;
