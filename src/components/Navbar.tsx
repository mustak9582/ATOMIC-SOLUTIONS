import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, LayoutDashboard, LogIn, Menu, PhoneCall, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { CORE_SERVICES, PHONE_NUMBER, WHATSAPP_NUMBER } from '../constants';
import { AppSettings, Service } from '../types';
import { formatWhatsAppLink } from '../lib/utils';
import Logo from './Logo';

export default function Navbar() {
  const { user, profile, logout, isAdmin, isStaff, viewAsCustomer } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>(CORE_SERVICES);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Pick<AppSettings, 'phone' | 'whatsappNumber'>>({
    phone: PHONE_NUMBER,
    whatsappNumber: WHATSAPP_NUMBER
  });

  useEffect(() => {
    const unsubscribeServices = dataService.subscribe('services', (data) => {
      if (!data?.length) return;
      const merged = [...CORE_SERVICES];
      (data as Service[]).forEach((item) => {
        const index = merged.findIndex((service) => service.id === item.id);
        index === -1 ? merged.push(item) : (merged[index] = { ...merged[index], ...item });
      });
      setServices(merged);
    });
    const unsubscribeSettings = dataService.subscribe('settings', (data) => {
      if (data?.[0]) setSettings(data[0] as AppSettings);
    });
    return () => { unsubscribeServices(); unsubscribeSettings(); };
  }, []);

  const activeServices = services.filter((service) => service.isActive !== false).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const selectService = (service: Service, subId?: string) => {
    setIsServicesOpen(false);
    setIsMenuOpen(false);
    navigate(`/service/${service.id}${subId ? `?sub=${subId}` : ''}`);
  };
  const closeMobileMenu = () => setIsMenuOpen(false);
  const isAdminView = isAdmin && !viewAsCustomer;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            <Link className="site-nav-link" to="/">Home</Link>
            <div className="relative" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
              <button className="site-nav-link flex items-center gap-1" aria-expanded={isServicesOpen}>
                Services <ChevronDown size={15} className={isServicesOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              <AnimatePresence>
                {isServicesOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.16 }} className="absolute left-1/2 top-full mt-5 w-[720px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
                    <p className="mb-3 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal">Choose a service</p>
                    <div className="grid grid-cols-3 gap-1">
                      {activeServices.map((service) => (
                        <button key={service.id} onClick={() => selectService(service)} className="group rounded-xl px-3 py-3 text-left hover:bg-teal/7">
                          <span className="block text-sm font-bold text-navy group-hover:text-teal">{service.name}</span>
                          <span className="mt-1 block text-xs text-slate-500">{service.subCategories?.length || 0} services available</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link className="site-nav-link" to="/store">Store</Link>
            <a className="site-nav-link" href="/#gallery">Portfolio</a>
            <a className="site-nav-link" href="/#contact">Contact</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAdminView && <Link to="/admin" className="flex h-10 items-center gap-2 rounded-lg border border-teal/20 bg-teal/5 px-3 text-[11px] font-extrabold uppercase tracking-wide text-teal hover:bg-teal hover:text-white"><LayoutDashboard size={15} />Admin</Link>}
            {user ? (
              <div className="group relative">
                <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-navy hover:border-teal/40">
                  <UserCircle size={18} className="text-teal" /><span className="max-w-28 truncate">{profile?.name || 'My account'}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-10 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                  <Link to={isStaff && !isAdmin ? '/professional' : '/dashboard'} className="nav-menu-item"><LayoutDashboard size={16} />Dashboard</Link>
                  {isAdminView && <Link to="/admin" className="nav-menu-item"><ShieldCheck size={16} />Admin workspace</Link>}
                  <button onClick={logout} className="nav-menu-item w-full text-left text-red-600"><X size={16} />Sign out</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex h-11 items-center gap-2 rounded-lg bg-navy px-4 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-navy/15 hover:bg-teal"><LogIn size={15} />Sign in</Link>
            )}
            <a href={formatWhatsAppLink(settings.whatsappNumber || WHATSAPP_NUMBER, 'Hello Atomic Solutions, I would like a service consultation.')} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-lg bg-teal px-4 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-teal/20 hover:bg-teal-700"><PhoneCall size={15} />Get a quote</a>
          </div>

          <button onClick={() => setIsMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-navy lg:hidden" aria-label="Open navigation"><Menu size={21} /></button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-navy/30 backdrop-blur-sm lg:hidden">
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="ml-auto flex h-full w-full max-w-sm flex-col bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5"><Logo size="sm" /><button onClick={closeMobileMenu} className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-navy" aria-label="Close navigation"><X size={20} /></button></div>
              <nav className="flex-1 overflow-y-auto py-5" aria-label="Mobile navigation">
                <MobileLink to="/" onClick={closeMobileMenu}>Home</MobileLink>
                <details className="group border-b border-slate-100 py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold text-navy">Services <ChevronDown size={18} className="transition-transform group-open:rotate-180" /></summary><div className="mt-3 space-y-1 border-l-2 border-teal/20 pl-3">{activeServices.map((service) => <button key={service.id} onClick={() => selectService(service)} className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-slate-600 hover:text-teal">{service.name}<ChevronRight size={15} /></button>)}</div></details>
                <MobileLink to="/store" onClick={closeMobileMenu}>Store</MobileLink>
                <a href="/#gallery" onClick={closeMobileMenu} className="mobile-nav-link">Portfolio</a>
                <a href="/#contact" onClick={closeMobileMenu} className="mobile-nav-link">Contact</a>
              </nav>
              <div className="space-y-3 border-t border-slate-100 pt-5">
                {user ? <Link to={isStaff && !isAdmin ? '/professional' : '/dashboard'} onClick={closeMobileMenu} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-navy"><LayoutDashboard size={17} />My dashboard</Link> : <Link to="/login" onClick={closeMobileMenu} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-navy"><LogIn size={17} />Sign in</Link>}
                <a href={formatWhatsAppLink(settings.whatsappNumber || WHATSAPP_NUMBER, 'Hello Atomic Solutions, I would like a service consultation.')} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-teal text-sm font-bold text-white"><PhoneCall size={17} />Get a quote</a>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-20" />
    </>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: ReactNode }) {
  return <Link to={to} onClick={onClick} className="mobile-nav-link">{children}</Link>;
}
