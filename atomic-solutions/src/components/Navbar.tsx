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
  const { user, profile, login, logout, isAdmin, isStaff, viewAsCustomer, toggleAdminView, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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

    return () => {
      unsubServices();
      unsubSettings();
    };
  }, []);

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
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white h-10 hidden md:block border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {appSettings.phone && (
              <a href={`tel:${appSettings.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 text-[10px] font-black text-navy hover:text-teal transition-colors uppercase tracking-widest">
                <PhoneCall size={12} className="text-teal" />
                {appSettings.phone}
              </a>
            )}
            {appSettings.whatsappNumber && (
              <a href={formatWhatsAppLink(appSettings.whatsappNumber, 'Hello Atomic Solutions, I need a consultation.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-black text-navy hover:text-teal transition-colors uppercase tracking-widest">
                <WhatsApp size={12} className="text-[#25D366]" />
                WhatsApp
              </a>
            )}
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

      <nav className="fixed top-0 md:top-10 left-0 right-0 z-50 bg-white">
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
                      className="absolute top-full -left-48 w-[800px] bg-white border border-gray-100 shadow-2xl rounded-[32px] p-8 z-[70]"
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

              <a href="#contact" className="text-sm font-bold text-navy hover:text-teal transition-colors uppercase tracking-wider">Contact</a>
              
              {isAdmin && (
                <div className="hidden lg:flex items-center border-l border-gray-100 pl-6 ml-2">
                  <button 
                    onClick={toggleAdminView}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewAsCustomer 
                        ? 'bg-navy text-white shadow-lg shadow-navy/20' 
                        : 'bg-teal text-navy shadow-lg shadow-teal/20'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    {viewAsCustomer ? 'Switch to Admin Control' : 'Admin Control'}
                  </button>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {isAdmin && !viewAsCustomer && (
                <Link to="/admin#settings" className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center text-navy hover:text-teal hover:bg-navy/10 transition-all border border-navy/10" title="Admin Settings">
                  <Settings size={18} />
                </Link>
              )}
              {isAdmin && !viewAsCustomer && (
                <div className="relative group/admin py-8">
                  <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm font-bold text-teal bg-teal/10 px-4 py-2 rounded-lg transition-all hover:bg-teal hover:text-white group-hover/admin:bg-teal group-hover/admin:text-white">
                    <LayoutDashboard size={16} />
                    <span>DASHBOARD</span>
                    <ChevronDown size={14} className="group-hover/admin:rotate-180 transition-transform" />
                  </button>

                  <AnimatePresence>
                    <div className="absolute top-full right-0 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 hidden group-hover/admin:block z-[80] mt-[-10px] pt-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-inner">
                        <div className="px-4 py-2 mb-1">
                          <span className="text-[9px] font-black text-teal uppercase tracking-[0.2em]">ADMIN CONTROL</span>
                        </div>
                        <Link 
                          to="/admin#bookings" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'bookings';
                              window.location.reload();
                            }
                          }}
                        >
                          <Calendar size={14} />
                          Manage Bookings
                        </Link>
                        <Link 
                          to="/admin#billing" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'billing';
                              window.location.reload();
                            }
                          }}
                        >
                          <FileText size={14} />
                          Invoice Builder
                        </Link>
                        <Link 
                          to="/admin#users" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'users';
                              window.location.reload();
                            }
                          }}
                        >
                          <Users size={14} />
                          User Management
                        </Link>
                        <Link 
                          to="/admin#pricing" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'pricing';
                              window.location.reload();
                            }
                          }}
                        >
                          <IndianRupee size={14} />
                          Service Settings
                        </Link>
                        <Link 
                          to="/admin#gallery" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'gallery';
                              window.location.reload();
                            }
                          }}
                        >
                          <ImageIcon size={14} />
                          Gallery Update
                        </Link>
                        <Link 
                          to="/admin#settings" 
                          className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                          onClick={() => {
                            if (window.location.pathname === '/admin') {
                              window.location.hash = 'settings';
                              window.location.reload();
                            }
                          }}
                        >
                          <Settings size={14} />
                          General Settings
                        </Link>
                        <div className="h-px bg-gray-50 my-2" />
                        <button 
                          onClick={toggleAdminView}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-teal hover:border-teal hover:text-teal rounded-xl transition-all uppercase tracking-widest border border-dashed border-teal/20"
                        >
                          <UserCircle size={14} />
                          Switch to User View
                        </button>
                      </div>
                    </div>
                  </AnimatePresence>
                </div>
              )}

              {loading ? (
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-2xl hidden md:block"></div>
              ) : user ? (
                <div className="relative group/user py-8">
                  <button className="flex items-center space-x-2 text-sm font-bold text-navy hover:text-teal group bg-gray-50 px-4 py-2 rounded-lg transition-all">
                    <UserCircle size={20} className="text-teal" />
                    <span className="uppercase tracking-widest text-[11px]">{profile?.name?.split(' ')[0] || 'DASHBOARD'}</span>
                    <ChevronDown size={14} className="group-hover/user:rotate-180 transition-transform" />
                  </button>

                  <AnimatePresence>
                    <div className="absolute top-full right-0 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 hidden group-hover/user:block z-[80] mt-[-10px] pt-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-inner">
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
                                <Link 
                                  to="/billing" 
                                  className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                  <FileText size={14} />
                                  Generate Invoice
                                </Link>
                                <button 
                                  onClick={toggleAdminView}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-teal hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest"
                                >
                                  <UserCircle size={14} />
                                  Switch to User View
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={toggleAdminView}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                              >
                                <LayoutDashboard size={14} />
                                Back to Admin Control
                              </button>
                            )}
                          </>
                        ) : (
                          // User Menu Options
                          <>
                            <div className="px-4 py-2 mb-1">
                              <span className="text-[9px] font-black text-navy/40 uppercase tracking-[0.2em]">Customer Account</span>
                            </div>
                            {isStaff ? (
                              <Link 
                                to="/professional" 
                                className="flex items-center gap-3 px-4 py-3 text-xs font-black text-teal bg-teal/5 hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest border border-dashed border-teal/20 mb-2"
                              >
                                <ShieldCheck size={14} />
                                Professional Portal
                              </Link>
                            ) : profile?.isStaff && profile?.staffStatus === 'pending' ? (
                              <div className="px-4 py-3 text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 rounded-xl mb-2 border border-orange-100">
                                Registration Pending Admin Approval
                              </div>
                            ) : (
                              <Link 
                                to="/dashboard" 
                                className="flex items-center gap-3 px-4 py-3 text-xs font-black text-teal hover:bg-teal hover:text-white rounded-xl transition-all uppercase tracking-widest border border-dashed border-teal/20 mb-2"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Briefcase size={14} />
                                Join as Staff
                              </Link>
                            )}
                            <Link 
                              to="/my-account/bookings" 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-black text-navy hover:text-teal hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Calendar size={14} />
                              My Bookings
                            </Link>
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
                    className="hidden md:flex items-center gap-2 bg-navy hover:bg-teal text-white font-black rounded-xl px-6 h-12 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-navy/10 active:scale-95"
                  >
                    <LogIn size={16} />
                    Login / Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-[15px]">
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
        <div className="absolute top-full left-0 w-full h-12 bg-white hidden md:block" style={{ clipPath: 'ellipse(70% 50% at 30% 0%)' }}></div>
        
        {/* Mobile menu container */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-y-auto shadow-xl max-h-[calc(100vh-80px)]"
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
                      className="w-full bg-navy text-white font-black h-16 rounded-2xl shadow-xl shadow-navy/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all text-xs"
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
