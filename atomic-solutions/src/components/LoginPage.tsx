import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, Mail, Lock, ChevronRight, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isMockMode } from '../services/firebaseService';
import Logo from './Logo';
import { Button } from './ui/button';

const LoginPage: React.FC = () => {
  const { login, adminLoginWithPassword, requestAdminOTP, verifyAdminOTP } = useAuth();
  const [view, setView] = useState<'customer' | 'admin_choice' | 'admin_login' | 'admin_setup_phone' | 'admin_setup_otp'>('customer');
  const [credential, setCredential] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [phone, setPhone] = useState('9582268658'); // Pre-fill or leave empty
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatError = (err: any) => {
    if (!err) return '';
    const message = err.message || String(err);
    try {
      if (message.startsWith('{')) {
        const parsed = JSON.parse(message);
        if (parsed.error) return `${parsed.error} (${parsed.path || ''})`;
      }
    } catch (e) {
      // Not JSON, return original
    }
    return message;
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const success = await adminLoginWithPassword(credential, adminPassword);
      if (!success) {
        setError('Invalid credentials. If setup not done, use OTP.');
      }
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await requestAdminOTP(phone);
      setView('admin_setup_otp');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const success = await verifyAdminOTP(otp, adminPassword);
      if (!success) setError('Invalid OTP. Use 123456 for demo.');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await login();
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#001f3f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-navy/5 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-navy/10 border border-gray-100 p-8 md:p-12 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="mb-8"
          >
            <Logo size="lg" />
          </motion.div>
          
          <h1 className="text-2xl font-black text-navy uppercase tracking-[0.2em] mb-1">Atomic Solutions</h1>
          {isMockMode && (
            <div className="bg-amber-100 text-amber-700 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse mb-1">
              Demo Mode Active
            </div>
          )}
          <p className="text-teal text-[10px] font-black uppercase tracking-[0.25em]">We Bring Comfort Life</p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-2 font-sans">Welcome Back</h2>
                <p className="text-gray-400 text-xs font-bold font-sans">Connect with your account to manage bookings & invoices</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100 mb-6">
                  <AlertCircle size={14} />
                  <div className="flex-1 overflow-hidden overflow-ellipsis">{error}</div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100 mb-6">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-navy hover:bg-teal text-white h-16 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 group shadow-lg shadow-navy/10"
              >
                <div className="bg-white/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <span className="font-black text-xs uppercase tracking-[0.2em]">Continue with Google</span>
              </Button>

              <div className="pt-8 text-center border-t border-gray-50">
                <button 
                  onClick={() => setView('admin_choice')}
                  className="px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 hover:text-navy hover:bg-white hover:shadow-md uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-all"
                >
                  <ShieldCheck size={14} className="text-teal" />
                  Staff & Admin Login
                </button>
              </div>
            </motion.div>
          )}

          {view === 'admin_choice' && (
            <motion.div
              key="admin_choice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-2 font-sans">Admin Portal</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest font-sans">Authentication Mode</p>
              </div>

              <div className="grid gap-4">
                <button 
                   onClick={() => setView('admin_login')}
                   className="w-full bg-white border-2 border-gray-100 hover:border-teal p-6 rounded-3xl text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-teal group-hover:text-white transition-colors">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-navy text-xs uppercase tracking-widest">Password Login</h4>
                      <p className="text-[10px] text-gray-400 font-bold">Standard secure entry</p>
                    </div>
                  </div>
                </button>

                <button 
                   onClick={() => setView('admin_setup_phone')}
                   className="w-full bg-white border-2 border-gray-100 hover:border-teal p-6 rounded-3xl text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-teal group-hover:text-white transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-navy text-xs uppercase tracking-widest">Setup / Reset Access</h4>
                      <p className="text-[10px] text-gray-400 font-bold">Verify via 9582268658</p>
                    </div>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setView('customer')}
                className="w-full text-[10px] font-black text-gray-400 hover:text-navy uppercase tracking-widest transition-colors py-4"
              >
                Back to Customer Home
              </button>
            </motion.div>
          )}

          {view === 'admin_login' && (
            <motion.form
              key="admin_login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleAdminLogin}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-2 font-sans font-black">Management Login</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Enter Admin Credentials</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="9582268658 or atomichvacsolution@gmail.com"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-navy hover:bg-teal text-white h-16 rounded-2xl shadow-xl shadow-navy/10 transition-all font-black text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? 'Verifying...' : 'Access My Dashboard'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_choice')}
                  className="text-[10px] font-black text-gray-400 hover:text-navy uppercase tracking-widest transition-colors py-2"
                >
                  Back to Choice
                </button>
              </div>
            </motion.form>
          )}

          {view === 'admin_setup_phone' && (
            <motion.form
              key="admin_setup_phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRequestOTP}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-2 font-sans font-black">Authorized Only</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Setup Secure Access</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal transition-colors font-bold text-xs">
                      +91
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Admin Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    />
                 </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal hover:bg-navy text-white h-16 rounded-2xl shadow-xl shadow-teal/20 transition-all font-black text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? 'Requesting...' : 'Send OTP Verification'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_choice')}
                  className="text-[10px] font-black text-gray-400 hover:text-navy uppercase tracking-widest transition-colors py-2"
                >
                  Back to Choice
                </button>
              </div>
            </motion.form>
          )}

          {view === 'admin_setup_otp' && (
            <motion.form
              key="admin_setup_otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOTP}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-2 font-sans font-black">OTP Verification</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Verify & Set New Password</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                 <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Enter 6-Digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-lg text-center tracking-[0.5em] text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    />
                 </div>
                 <div className="relative group">
                    <input 
                      type="password" 
                      placeholder="Set Secure Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    />
                 </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal hover:bg-navy text-white h-16 rounded-2xl shadow-xl shadow-teal/20 transition-all font-black text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Admin Setup'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_setup_phone')}
                  className="text-[10px] font-black text-gray-400 hover:text-navy uppercase tracking-widest transition-colors py-2"
                >
                  Re-send OTP
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
