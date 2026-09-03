import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { cn, formatWhatsAppLink } from '../lib/utils';
import { 
  Menu, 
  X, 
  LogIn,
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  Facebook,
  Instagram,
  Youtube,
  Phone as WhatsApp,
  ChevronDown,
  ChevronRight,
  PhoneCall,
  Star,
  Calendar,
  FileText,
  Users,
  IndianRupee,
  Image as ImageIcon,
  Settings,
  Briefcase,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/firebaseService';
import { Service, AppSettings } from '../types';
import { CORE_SERVICES, WHATSAPP_NUMBER, PHONE_NUMBER, INSTAGRAM_URL, YOUTUBE_URL, FACEBOOK_URL } from '../constants';

import Logo from './Logo';
import ReviewModal from './ReviewModal';

export default function Navbar() {
  const { user, profile, login, logout, isAdmin, isStaff, viewAsCustomer, toggleAdminView, loading, activeRole, setActiveRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    phone: PHONE_NUMBER,
    whatsappNumber: WHATSAPP_NUMBER,
    instagramUrl: INSTAGRAM_URL,
    youtubeUrl: YOUTUBE_URL,
    facebookUrl: FACEBOOK_URL
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubServices = dataService.subscribe('services', (data) => {
      if (data && data.length > 0) {
        // Merge CORE_SERVICES with Firestore data
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
      }
    });

    const unsubSettings = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) {
        setAppSettings(data[0] as AppSettings);
      }
    });

    let unsubNotifs = () => {};
    if (isAdmin) {
      unsubNotifs = dataService.subscribe('notifications', (data) => {
        const unread = (data as any[]).filter(n => !n.read && (n.userId === 'admin' || n.userId === user?.uid)).length;
        setUnreadCount(unread);
        
        // Show toast for brand new notifications if we're not on admin page
        if (data.length > 0 && !location.pathname.startsWith('/admin')) {
          const latest = data[0];
          if (!latest.read && (new Date().getTime() - new Date(latest.timestamp).getTime() < 10000)) {
             // We can't use toast here easily because it's not imported, but maybe we should import it
          }
        }
      }, isAdmin ? [{ field: 'userId', operator: '==', value: 'admin' }] : [{ field: 'userId', operator: '==', value: user?.uid }]);
    }

    return () => {
      unsubServices();
      unsubSettings();
      unsubNotifs();
    };
  }, [isAdmin, user?.uid]);

  const activeServices = services
    .filter(s => s.isActive !== false)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const handleServiceClick = (serviceId: string, _subId?: string) => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
    // Normalize ID just in case
    const cleanId = serviceId.trim().toLowerCase().replace(/\s+/g, '-');
    navigate(`/service/${cleanId}${_subId ? `?sub=${_subId}` : ''}`);
  };


  return (
    <>
      {/* Top Banner (Socials) */}
      <div className="fixed top-0 left-0 right-0 z-[60] hidden h-10 border-b border-white/70 glass-panel md:block">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center space-x-6">


          </div>
          <div className="flex items-center space-x-6">
            <div className="h-4 w-px bg-gray-200"></div>
            {appSettings.facebookUrl && appSettings.facebookUrl !== '#' && (
              <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={appSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Facebook size={18} /></motion.a>
            )}
            {appSettings.instagramUrl && (
              <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={appSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Instagram size={18} /></motion.a>
            )}
            {appSettings.youtubeUrl && (
              <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={appSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Youtube size={18} /></motion.a>
            )}
            {!appSettings.facebookUrl && !appSettings.instagramUrl && !appSettings.youtubeUrl && (
              <>
                <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Facebook size={18} /></motion.a>
                <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Instagram size={18} /></motion.a>
                <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-teal transition-colors"><Youtube size={18} /></motion.a>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="fixed top-0 md:top-10 left-0 right-0 z-50 border-b border-white/70 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-sm font-bold text-navy hover:text-teal transition-colors uppercase tracking-wider">Home</Link>
              
              {/* Services Dropdown Trigger */}
              <div 
                className="relative group py-8"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-bold text-navy group-hover:text-teal transition-colors uppercase tracking-wider">
                  Services
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mega Menu Dropdown */}
                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute top-full -left-48 w-[800px] rounded-xl p-8 z-[70] glass-panel shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)]"
                    >
                      <div className="grid grid-cols-4 gap-x-8 gap-y-10">
                        {activeServices.map((service) => (
                          <div key={service.id} className="space-y-4">
                            <h4 className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-4 pb-2 border-b border-gray-50">{service.name}</h4>
                            <div className="flex flex-col space-y-2">
                              {(service.subCategories || []).slice(0, 5).map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleServiceClick(service.id, sub.id)}
                                  className="text-left text-xs font-bold text-navy/70 hover:text-teal transition-colors flex items-center group/item"
                                >
                                  <ChevronRight size={10} className="mr-1 opacity-0 group-hover/item:opacity-100 -translate-x-1 group-hover/item:translate-x-0 transition-all text-teal" />
                                  {sub.name}
                                </button>
                              ))}
                              {(service.subCategories || []).length > 5 && (
                                <button 
                                  onClick={() => handleServiceClick(service.id)}
                                  className="text-[10px] font-black text-teal hover:text-navy uppercase mt-2 flex items-center gap-1 group/more"
                                >
                                  View Full Rate List
                                  <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/store" className="text-sm font-bold text-navy hover:text-teal transition-colors uppercase tracking-wider">
                Store
              </Link>

              <a 
                href="#gallery" 
                onClick={(e) => {
                  const el = document.getElementById('gallery');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#gallery');
                  }
                }}
                className="text-sm font-bold text-navy hover:text-teal transition-colors uppercase tracking-wider"
              >
                Portfolio
              </a>

              <a 
                href="/#contact" 
                onClick={(e) => {
                  const el = document.getElementById('contact');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#contact');
                  }
                }}
                className="text-sm font-bold text-navy hover:text-teal transition-colors uppercase tracking-wider"
              >
                Contact
              </a>
              
              {isAdmin && (
                <div className="hidden lg:flex items-center border-l border-gray-100 pl-6 ml-2">
                  <button 
                    onClick={() => {
                      toggleAdminView();
                      if (viewAsCustomer) {
                        navigate('/admin');
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewAsCustomer 
                        ? 'bg-navy text-white shadow-lg shadow-navy/20 hover:bg-teal hover:text-navy' 
                        : 'bg-teal text-navy shadow-lg shadow-teal/20 hover:bg-navy hover:text-white'
                    }`}
                    title={viewAsCustomer ? "Click to return to Admin Dashboard" : "Switch to Admin Control"}
                  >
                    <ShieldCheck size={14} />
                    {viewAsCustomer ? 'Back to Admin Control' : 'Admin Control'}
                  </button>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">



              {loading ? (
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-2xl hidden md:block"></div>
              ) : user ? (
                <div className="relative group/user py-8">
                  <button className="flex items-center space-x-2 text-sm font-bold text-navy hover:text-teal group bg-gray-50 px-4 py-2 rounded-lg transition-all relative">
                    <UserCircle size={20} className="text-teal" />
                    <span className="uppercase tracking-widest text-[11px]">{profile?.name?.split(' ')[0] || 'DASHBOARD'}</span>
                    {!isAdmin && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[8px] font-black text-white shadow-lg shadow-teal/20">
                        {unreadCount}
                      </span>
                    )}
                    <ChevronDown size={14} className="group-hover/user:rotate-180 transition-transform" />
                  </button>

                  <AnimatePresence>
                    <div className="absolute top-full right-0 w-72 bg-white border border-gray-100 shadow-2xl rounded-[2rem] p-3 hidden group-hover/user:block z-[80] mt-[-10px] pt-6">
                      <div className="bg-slate-50 rounded-[1.5rem] p-4 mb-3 border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-black text-xs">
                            {(profile?.name || user?.displayName || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-navy uppercase truncate leading-none mb-1">
                              {profile?.name || user?.displayName || 'Customer'}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 truncate uppercase tracking-widest">
                              {user?.email || 'Logged In'}
                            </span>
                          </div>
                        </div>
                        <div className="h-px bg-slate-200/50 w-full mb-2" />
                        <div className="flex items-center gap-2 text-[8px] font-black text-teal uppercase tracking-widest">
                          <ShieldCheck size={10} /> Verified Session
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl space-y-1">
                        {isAdmin ? (
                          // Admin Menu Options
                          <>
                            <div className="px-4 py-2 mb-1">
                              <span className="text-[9px] font-black text-teal uppercase tracking-[0.2em]">Partner Portal</span>
                            </div>
                            {!viewAsCustomer ? (
                              <>
                                <Link 
                                  to="/admin" 
                                  className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                  <LayoutDashboard size={14} />
                                  Manage Bookings
                                </Link>

                                <button 
                                  onClick={() => {
                                    toggleAdminView();
                                    navigate('/');
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-teal hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest"
                                >
                                  <UserCircle size={14} />
                                  Preview Website
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => {
                                  toggleAdminView();
                                  navigate('/admin');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-white bg-navy hover:bg-teal hover:text-navy rounded-xl transition-all uppercase tracking-widest shadow-md"
                              >
                                <LayoutDashboard size={14} />
                                Return to Admin Control
                              </button>
                            )}
                          </>
                        ) : activeRole === 'staff' ? (
                          // Technician / Staff Menu Options
                          <>
                            <div className="px-4 py-2 mb-1 flex items-center justify-between">
                              <span className="text-[9px] font-black text-teal uppercase tracking-[0.2em]">Technician Portal</span>
                              <span className="text-[8px] bg-teal/10 text-teal font-black px-2 py-0.5 rounded-full">STAFF ACTIVE</span>
                            </div>
                            <Link 
                              to="/professional" 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-black text-teal bg-teal/5 hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest border border-dashed border-teal/20 mb-2"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <ShieldCheck size={14} />
                              Incoming &amp; Active Jobs
                            </Link>
                            <button
                              onClick={() => {
                                setActiveRole('customer');
                                navigate('/');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest border border-gray-100"
                            >
                              <UserCircle size={14} />
                              Switch to Customer View
                            </button>
                          </>
                        ) : (
                          // Customer Menu Options - Clean Booking System Focus
                          <>
                            <div className="px-4 py-2 mb-1 flex items-center justify-between">
                              <span className="text-[9px] font-black text-navy/40 uppercase tracking-[0.2em]">Customer Account</span>
                              <span className="text-[8px] bg-navy/5 text-navy font-black px-2 py-0.5 rounded-full">CUSTOMER ACTIVE</span>
                            </div>
                            <Link 
                              to="/my-account/bookings" 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Calendar size={14} />
                              My Bookings
                            </Link>
                            <Link 
                              to="/my-account/invoices" 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <FileText size={14} />
                              My Invoices
                            </Link>
                            <Link 
                              to="/dashboard/reports" 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Settings size={14} />
                              Report an Issue
                            </Link>
                            <button
                              onClick={() => {
                                setActiveRole('staff');
                                navigate('/professional');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-teal hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest border border-dashed border-teal/20 mt-2"
                            >
                              <Briefcase size={14} />
                              Switch to Staff Portal
                            </button>
                          </>
                        )}
                        <div className="h-px bg-gray-50 my-2" />
                        <button 
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                        >
                          <X size={14} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/login')} 
                    className="flex md:hidden items-center justify-center w-10 h-10 bg-navy text-white rounded-full"
                  >
                    <LogIn size={20} />
                  </button>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="hidden md:flex items-center gap-2 bg-teal hover:bg-[#0d9488] text-white font-black rounded-lg px-6 h-12 transition-all uppercase tracking-widest text-[10px] shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] active:scale-[0.98]"
                  >
                    <LogIn size={16} />
                    Login / Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-2 sm:gap-3">
              {appSettings.whatsappNumber && (
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href={formatWhatsAppLink(appSettings.whatsappNumber, 'Hello Atomic Solutions, I need a consultation.')} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#25D366] hover:drop-shadow-[0_0_8px_rgba(37,211,102,0.5)] transition-all duration-300"
                >
                  <WhatsApp size={24} fill="currentColor" fillOpacity={0.1} />
                </motion.a>
              )}
              {appSettings.phone && (
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href={`tel:${appSettings.phone.replace(/\s+/g, '')}`} 
                  className="text-[#001f3f] hover:text-teal transition-colors"
                >
                  <PhoneCall size={24} />
                </motion.a>
              )}
              {!user && !loading && (
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => navigate('/login')}
                  className="text-navy hover:text-teal transition-colors p-2"
                >
                  <UserCircle size={28} />
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-navy p-2 ml-1"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Curved Header Shape */}
        <div className="hidden"></div>
        
        {/* Mobile menu container */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 overflow-y-auto shadow-xl max-h-[calc(100vh-80px)]"
            >
              <div className="p-6 space-y-6">
                  {/* Admin Direct Access */}
                  {isAdmin && (
                    <div className="bg-navy p-6 rounded-[32px] shadow-2xl shadow-navy/20 mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-teal font-black uppercase tracking-[0.2em] text-[10px]">
                          <LayoutDashboard size={16} />
                          <span>ADMIN CONTROL</span>
                        </div>
                        <button 
                          onClick={() => {
                            toggleAdminView();
                            setIsMenuOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            viewAsCustomer ? 'bg-teal text-navy' : 'bg-white/10 text-white'
                          }`}
                        >
                          {viewAsCustomer ? 'Enter Admin Control' : 'Back to Website'}
                        </button>
                      </div>
                      
                      {!viewAsCustomer && (
                        <div className="grid grid-cols-2 gap-2">
                          <Link 
                            to="/admin#bookings" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex flex-col items-center justify-center p-3 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <Calendar size={16} className="text-teal mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Bookings</span>
                          </Link>
                          <Link 
                            to="/admin#billing" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex flex-col items-center justify-center p-3 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <FileText size={16} className="text-teal mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Invoices</span>
                          </Link>
                          <Link 
                            to="/admin#reports" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex flex-col items-center justify-center p-3 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <Settings size={16} className="text-red-400 mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Reports</span>
                          </Link>
                          <Link 
                            to="/admin#pricing" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex flex-col items-center justify-center p-3 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <IndianRupee size={16} className="text-teal mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Pricing</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all">
                      Home
                    </Link>

                    <div className="space-y-1">
                      <button 
                        onClick={() => setIsServicesOpen(!isServicesOpen)}
                        className="flex items-center justify-between w-full py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all"
                      >
                        Services
                        <ChevronDown size={24} className={`transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isServicesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-4 pt-2 overflow-hidden border-l-4 border-teal/20 ml-2"
                          >
                            {activeServices.map((service) => (
                              <div key={service.id} className="space-y-2">
                                <button 
                                  onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                                  className="flex items-center justify-between w-full text-sm font-black text-navy/60 uppercase tracking-widest"
                                >
                                  {service.name}
                                  <ChevronDown size={14} className={`transition-transform ${expandedService === service.id ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedService === service.id && (
                                  <div className="pl-4 flex flex-col space-y-2 pb-2">
                                    {(service.subCategories || []).slice(0, 8).map((sub) => (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleServiceClick(service.id, sub.id)}
                                        className="text-left text-xs font-bold text-gray-500 py-1 uppercase tracking-wider"
                                      >
                                        {sub.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link to="/store" onClick={() => setIsMenuOpen(false)} className="block py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all">
                      Store
                    </Link>

                    <a 
                      href="#gallery" 
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        const el = document.getElementById('gallery');
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          navigate('/#gallery');
                        }
                      }} 
                      className="block py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all"
                    >
                      Portfolio
                    </a>

                    <Link to="/dashboard/reports" onClick={() => setIsMenuOpen(false)} className="block py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all">
                      Report a Problem
                    </Link>

                    <a 
                      href="/#contact" 
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        const el = document.getElementById('contact');
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          navigate('/#contact');
                        }
                      }} 
                      className="block py-4 text-3xl font-black text-navy uppercase tracking-tighter hover:text-teal transition-all"
                    >
                      Contact
                    </a>
                  </div>

                <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                   {appSettings.phone && (
                    <a href={`tel:${appSettings.phone.replace(/\s+/g, '')}`} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl gap-2 text-navy">
                       <PhoneCall size={20} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Call Now</span>
                    </a>
                   )}
                   {appSettings.whatsappNumber && (
                    <a href={formatWhatsAppLink(appSettings.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 bg-teal/5 rounded-2xl gap-2 text-teal">
                       <WhatsApp size={20} />
                       <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                    </a>
                   )}
                </div>

                  <div className="pt-6 border-t border-gray-100 flex flex-col space-y-2">
                  {loading ? (
                    <div className="h-16 w-full bg-gray-50 animate-pulse rounded-2xl"></div>
                  ) : user ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                           <UserCircle size={24} className="text-teal" />
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active Session</span>
                             <span className="text-sm font-black text-navy uppercase tracking-tighter">{profile?.name || 'My Account'}</span>
                           </div>
                        </div>
                        <button onClick={logout} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                              {isStaff ? (
                                <Link 
                                  to="/professional" 
                                  onClick={() => setIsMenuOpen(false)}
                                  className="flex items-center gap-4 p-4 bg-teal/5 border border-teal/20 rounded-2xl transition-all hover:bg-teal group"
                                >
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-white group-hover:text-teal transition-all">
                                     <ShieldCheck size={20} className="text-teal" />
                                  </div>
                                  <span className="text-xs font-black text-navy group-hover:text-white uppercase tracking-widest">Professional Portal</span>
                                </Link>
                              ) : profile?.isStaff && profile?.staffStatus === 'pending' ? (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
                                  <Clock className="text-orange-500" size={20} />
                                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Registration Status: Pending</span>
                                </div>
                              ) : (
                                <Link 
                                  to="/dashboard" 
                                  onClick={() => setIsMenuOpen(false)}
                                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl transition-all hover:bg-teal/5 group"
                                >
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-teal group-hover:text-white transition-all">
                                     <LayoutDashboard size={20} />
                                  </div>
                                  <span className="text-xs font-black text-navy uppercase tracking-widest">User Dashboard</span>
                                </Link>
                              )}
                      </div>
                      
                      <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 h-16 bg-red-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200 mt-4 active:scale-95 transition-all"
                      >
                        <X size={20} /> Logout Account
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { navigate('/login'); setIsMenuOpen(false); }} 
                      className="w-full bg-teal text-white font-black h-16 rounded-lg shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-xs"
                    >
                      <LogIn size={20} />
                      Login / Register
                    </button>
                  )}
                </div>

                <div className="flex justify-center space-x-6 pt-4">
                  {appSettings.facebookUrl && appSettings.facebookUrl !== '#' && (
                    <a href={appSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Facebook size={20} /></a>
                  )}
                  {appSettings.instagramUrl && (
                    <a href={appSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Instagram size={20} /></a>
                  )}
                  {appSettings.youtubeUrl && (
                    <a href={appSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Youtube size={20} /></a>
                  )}
                  {(!appSettings.facebookUrl || appSettings.facebookUrl === '#') && !appSettings.instagramUrl && !appSettings.youtubeUrl && (
                    <>
                      <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Facebook size={20} /></a>
                      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Instagram size={20} /></a>
                      <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="text-navy p-3 bg-gray-50 rounded-full hover:text-teal transition-colors"><Youtube size={20} /></a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* Spacer to push content below fixed navbar */}
      <div className="h-20 md:h-30"></div>
    </>
  );
}
