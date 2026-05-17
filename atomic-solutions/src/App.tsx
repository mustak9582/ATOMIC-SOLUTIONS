import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import UserDashboard from './components/UserDashboard';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import BillingCenter from './components/BillingCenter';
import InvoiceViewer from './components/InvoiceViewer';
import SplashScreen from './components/SplashScreen';
import AppErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import CompleteProfileModal from './components/CompleteProfileModal';
import WhatsAppButton from './components/WhatsAppButton';
import Pricing from './components/Pricing';
import HomePlanningSection from './components/HomePlanningSection';
import { LayoutDashboard } from 'lucide-react';
import { Button } from './components/ui/button';
import { WHATSAPP_NUMBER } from './constants';
import ServiceDetailPage from './components/ServiceDetailPage';
import Gallery from './components/Gallery';
import { AnimatePresence, motion } from 'motion/react';

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

const BlockedScreen: React.FC = () => {
  const { logout } = useAuth();
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
};

const AppContent: React.FC = () => {
  // 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const authContext = useAuth();
  const { user, profile, loading, isAdmin, isStaff, isBlocked, viewAsCustomer, logout } = authContext;
  
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // 2. ALL EFFECTS
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 500);
    return () => clearTimeout(timer);
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

  const shouldHideUI = (isActuallyAdminView && isAdminRoute) || (isActuallyStaffView && isStaffRoute);

  // 4. EARLY RETURNS FOR LOADING/SPLASH
  if (showSplash || (loading && !profile)) {
    return <SplashScreen />;
  }

  if (shouldBlockWebsiteForStaff) {
    return <SplashScreen />; // Temporary while redirecting
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
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
      <ScrollToTop />
      {!shouldHideUI && <CompleteProfileModal />}
      {!shouldHideUI && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {!shouldHideUI && <Footer />}
      {!shouldHideUI && <WhatsAppButton />}
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
