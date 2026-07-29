import React, { Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import AppErrorBoundary from './components/ErrorBoundary';
import WhatsAppButton from './components/WhatsAppButton';
import Pricing from './components/Pricing';
import HomePlanningSection from './components/HomePlanningSection';
import AtomicBot from './components/AtomicBot';
import { LayoutDashboard } from 'lucide-react';
import { Button } from './components/ui/button';
import { WHATSAPP_NUMBER } from './constants';
import { AnimatePresence, motion } from 'motion/react';
import Seo from './components/Seo';
import SplashScreen from './components/SplashScreen';

// Lazy-loaded route components for code splitting
const UserDashboard = React.lazy(() => import('./components/UserDashboard'));
const StaffDashboard = React.lazy(() => import('./components/StaffDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const BillingCenter = React.lazy(() => import('./components/BillingCenter'));
const InvoiceViewer = React.lazy(() => import('./components/InvoiceViewer'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const CompleteProfileModal = React.lazy(() => import('./components/CompleteProfileModal'));
const ServiceDetailPage = React.lazy(() => import('./components/ServiceDetailPage'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const StoreFront = React.lazy(() => import('./components/StoreFront'));

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};




const AppContent: React.FC = () => {
  // 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const authContext = useAuth();
  const { user, profile, loading, isAdmin, isStaff, isBlocked, viewAsCustomer, logout } = authContext;
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashLeaving, setIsSplashLeaving] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const beginExit = window.setTimeout(() => setIsSplashLeaving(true), 1250);
    const removeSplash = window.setTimeout(() => setShowSplash(false), 1800);
    return () => {
      window.clearTimeout(beginExit);
      window.clearTimeout(removeSplash);
    };
  }, []);

  useEffect(() => {
    if (user && isStaff && !isAdmin && location.pathname === '/') {
      navigate('/professional', { replace: true });
    }
  }, [user, isStaff, isAdmin, location.pathname, navigate]);

  // 3. LOGIC FOR RENDERING
  const isActuallyAdminView = isAdmin && !viewAsCustomer;
  const isActuallyStaffView = isStaff && !viewAsCustomer;
  const isStaffOnly = isActuallyStaffView && !isAdmin;

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/billing';
  const isStaffRoute = location.pathname.startsWith('/professional');
  
  // Restricted access for Staff: They should only see the Professional route
  const shouldBlockWebsiteForStaff = isStaffOnly && !isStaffRoute;

  useEffect(() => {
    if (shouldBlockWebsiteForStaff) {
      navigate('/professional', { replace: true });
    }
  }, [shouldBlockWebsiteForStaff, navigate]);

  const shouldHideUI = location.pathname === '/login' || (isActuallyAdminView && isAdminRoute) || (isActuallyStaffView && isStaffRoute);

  // 4. EARLY RETURNS FOR LOADING/SPLASH
  if (shouldBlockWebsiteForStaff) {
    return null; // Redirecting...
  }

  // 5. BLOCKED SCREEN RENDERING
  if (user && isBlocked && !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-red-600">
            <LayoutDashboard size={40} />
          </div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter mb-4">Account Blocked</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Your account has been restricted by administration. If you believe this is an error or wish to appeal, please contact our support team.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
              className="w-full h-14 rounded-2xl bg-navy text-white font-black uppercase tracking-widest"
            >
              Contact Support
            </Button>
            <Button 
              variant="ghost" 
              onClick={logout}
              className="w-full h-14 rounded-2xl text-red-600 font-black uppercase tracking-widest hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. MAIN APP RENDER
  return (
    <div className="min-h-screen bg-slate-app font-sans text-navy selection:bg-teal/15 selection:text-teal">
      <ScrollToTop />
      <Seo />
      {!shouldHideUI && <Suspense fallback={null}><CompleteProfileModal /></Suspense>}
      {!shouldHideUI && <Navbar />}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={(
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                className="pb-24"
              >
                <Hero />
                <HomePlanningSection />
                <Pricing />
                <Gallery />
              </motion.div>
            )} />
            
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            
            <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/professional" element={user && isStaff ? <StaffDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/dashboard/reports" element={user ? <UserDashboard initialSection="reports" /> : <Navigate to="/login" replace />} />
            <Route path="/my-account/bookings" element={user ? <UserDashboard initialSection="bookings" /> : <Navigate to="/login" replace />} />
            <Route path="/my-account/invoices" element={user ? <UserDashboard initialSection="invoices" /> : <Navigate to="/login" replace />} />
            
            <Route path="/admin" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={user && isAdmin ? <AdminDashboard initialTab="stats" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/invoice-generator" element={user && isAdmin ? <BillingCenter /> : <Navigate to="/login" replace />} />
            <Route path="/admin/bookings" element={user && isAdmin ? <AdminDashboard initialTab="bookings" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/invoices" element={user && isAdmin ? <AdminDashboard initialTab="invoices" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/services" element={user && isAdmin ? <AdminDashboard initialTab="pricing" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/gallery" element={user && isAdmin ? <AdminDashboard initialTab="gallery" /> : <Navigate to="/login" replace />} />
            
            <Route path="/billing" element={user && isAdmin ? <BillingCenter /> : <Navigate to="/login" replace />} />
            <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/invoice/:id" element={<InvoiceViewer />} />
            <Route path="/store" element={<StoreFront />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {!shouldHideUI && <Footer />}
      {!shouldHideUI && <WhatsAppButton />}
      {!shouldHideUI && <AtomicBot />}
      {showSplash && <SplashScreen isLeaving={isSplashLeaving} />}
    </div>
  );
};

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" expand={true} richColors />
          <AppContent />
        </Router>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
