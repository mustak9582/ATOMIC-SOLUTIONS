import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import BillingCenter from './components/BillingCenter';
import InvoiceViewer from './components/InvoiceViewer';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import ReviewsPage from './components/ReviewsPage';
import WhatsAppButton from './components/WhatsAppButton';
import Pricing from './components/Pricing';
import Reviews from './components/Reviews';
import HomePlanningSection from './components/HomePlanningSection';
import ServiceDetailPage from './components/ServiceDetailPage';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const AppContent: React.FC = () => {
  const { user, profile, loading, isAdmin, viewAsCustomer } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-navy border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isActuallyAdminView = isAdmin && !viewAsCustomer;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={isActuallyAdminView ? <Navigate to="/admin" replace /> : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-24"
            >
              <Hero />
              <HomePlanningSection />
              <Pricing />
              <Reviews />
            </motion.div>
          )} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/reports" element={<UserDashboard initialSection="reports" />} />
          <Route path="/my-account/bookings" element={<UserDashboard initialSection="bookings" />} />
          <Route path="/my-account/invoices" element={<UserDashboard initialSection="invoices" />} />
          
          <Route path="/admin" element={isAdmin ? (isActuallyAdminView ? <AdminDashboard /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/admin/dashboard" element={isAdmin ? (isActuallyAdminView ? <AdminDashboard initialTab="stats" /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/admin/invoice-generator" element={isAdmin ? (isActuallyAdminView ? <BillingCenter /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/admin/bookings" element={isAdmin ? (isActuallyAdminView ? <AdminDashboard initialTab="bookings" /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/admin/services" element={isAdmin ? (isActuallyAdminView ? <AdminDashboard initialTab="pricing" /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/admin/gallery" element={isAdmin ? (isActuallyAdminView ? <AdminDashboard initialTab="gallery" /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          
          <Route path="/billing" element={isAdmin ? (isActuallyAdminView ? <BillingCenter /> : <Navigate to="/" replace />) : <Navigate to="/" replace />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/invoice/:id" element={<InvoiceViewer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" expand={true} richColors />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
