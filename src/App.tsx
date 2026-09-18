import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import AppErrorBoundary from './components/ErrorBoundary';
import CompleteProfileModal from './components/CompleteProfileModal';
import Pricing from './components/Pricing';
import Gallery from './components/Gallery';
import AtomicBot from './components/AtomicBot';
import AdminQuickSwitcher from './components/AdminQuickSwitcher';
import { LayoutDashboard } from 'lucide-react';
import { Button } from './components/ui/button';
import { WHATSAPP_NUMBER } from './constants';
import { AnimatePresence, motion } from 'motion/react';
import { PWAProvider } from './contexts/PWAContext';
import IOSInstallModal from './components/IOSInstallModal';
import MobileAppDock from './components/MobileAppDock';

// Code-split heavy routes with React.lazy to dramatically accelerate initial page load
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const BillingCenter = lazy(() => import('./components/BillingCenter'));
const InvoiceViewer = lazy(() => import('./components/InvoiceViewer'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const StoreFront = lazy(() => import('./components/StoreFront'));
const ServiceDetailPage = lazy(() => import('./components/ServiceDetailPage'));
const HomePlanningSection = lazy(() => import('./components/HomePlanningSection'));

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-teal/20 border-t-teal rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-navy/50">Loading Portal...</span>
    </div>
  </div>
);

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
  const { user, profile, loading, hasAdminPrivilege, isAdmin, isStaff, isBlocked, viewAsCustomer, activeRole, logout } = authContext;
  
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // 2. ALL EFFECTS
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && activeRole === 'staff' && !isAdmin && location.pathname === '/') {
      navigate('/professional', { replace: true });
    }
  }, [user, activeRole, isAdmin, location.pathname, navigate]);

  // 3. LOGIC FOR RENDERING
  const isActuallyAdminView = isAdmin && activeRole === 'admin';
  const isActuallyStaffView = (isStaff || activeRole === 'staff') && activeRole === 'staff' && !isAdmin;
  const isStaffOnly = isActuallyStaffView;

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/billing';
  const isStaffRoute = location.pathname.startsWith('/professional');
  
  // Restricted access for Staff: only when active role is 'staff'
  const shouldBlockWebsiteForStaff = isStaffOnly && !isStaffRoute && location.pathname !== '/login';

  useEffect(() => {
    if (shouldBlockWebsiteForStaff) {
      navigate('/professional', { replace: true });
    }
  }, [shouldBlockWebsiteForStaff, navigate]);

  const shouldHideUI = location.pathname === '/login' || (isAdmin && isAdminRoute) || ((isStaff || activeRole === 'staff') && isStaffRoute);

  // 4. EARLY RETURNS FOR LOADING/SPLASH
  // Only show splash screen briefly during initial app load, never block guest browsing forever
  if (showSplash && loading && !profile) {
    return <SplashScreen />;
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
    <div className="min-h-screen bg-slate-app font-sans text-navy selection:bg-teal/15 selection:text-teal pb-20 md:pb-0">
      <ScrollToTop />
      {!shouldHideUI && <CompleteProfileModal />}
      {!shouldHideUI && <Navbar />}
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
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
                <Pricing />
                <Gallery />
              </motion.div>
            )} />
            <Route path="/planning" element={<HomePlanningSection />} />
            
            <Route path="/login" element={
              user ? (
                location.search.includes('type=professional') || location.search.includes('role=staff') || activeRole === 'staff' || (!isAdmin && (profile?.isStaff || profile?.staffStatus === 'approved')) ? (
                  <Navigate to="/professional" replace />
                ) : activeRole === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/my-account/bookings" replace />
                )
              ) : <LoginPage />
            } />
            
            <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/login" replace />} />
            <Route 
              path="/professional" 
              element={
                user && (isStaff || activeRole === 'staff' || profile?.isStaff || profile?.staffStatus === 'approved' || profile?.staffStatus === 'pending') ? (
                  <StaffDashboard />
                ) : (
                  <Navigate to="/login?type=professional" replace />
                )
              } 
            />
            <Route path="/dashboard/reports" element={user ? <UserDashboard initialSection="reports" /> : <Navigate to="/login" replace />} />
            <Route path="/my-account/bookings" element={user ? <UserDashboard initialSection="bookings" /> : <Navigate to="/login" replace />} />
            <Route path="/my-account/invoices" element={user ? <UserDashboard initialSection="invoices" /> : <Navigate to="/login" replace />} />
            
            <Route path="/admin" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard initialTab="stats" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/invoice-generator" element={user && (isAdmin || hasAdminPrivilege) ? <BillingCenter /> : <Navigate to="/login" replace />} />
            <Route path="/admin/bookings" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard initialTab="bookings" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/invoices" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard initialTab="invoices" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/services" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard initialTab="pricing" /> : <Navigate to="/login" replace />} />
            <Route path="/admin/gallery" element={user && (isAdmin || hasAdminPrivilege) ? <AdminDashboard initialTab="gallery" /> : <Navigate to="/login" replace />} />
            
            <Route path="/billing" element={user && (isAdmin || hasAdminPrivilege) ? <BillingCenter /> : <Navigate to="/login" replace />} />
            <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/invoice/:id" element={<InvoiceViewer />} />
            <Route path="/store" element={<StoreFront />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {!shouldHideUI && <Footer />}
      {!shouldHideUI && <AtomicBot />}
      {!shouldHideUI && <MobileAppDock />}
      <AdminQuickSwitcher />
      <IOSInstallModal />
    </div>
  );
};

function App() {
  return (
    <AppErrorBoundary>
      <PWAProvider>
        <AuthProvider>
          <Router>
            <Toaster position="top-center" expand={true} richColors />
            <AppContent />
          </Router>
        </AuthProvider>
      </PWAProvider>
    </AppErrorBoundary>
  );
}

export default App;
