import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, User, Briefcase, ChevronRight, AlertCircle, Home, ArrowLeft, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const { login, loginWithEmail, signUpWithEmail, resetPassword, loginAsAdminWithPin, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [view, setView] = useState<'choice' | 'login' | 'admin_login' | 'forgot_password'>('choice');
  const [isProfessionalPath, setIsProfessionalPath] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type') || params.get('role');
    if (type === 'professional' || type === 'staff' || type === 'partner') {
      setIsProfessionalPath(true);
      setActiveRole('staff');
      setView('login');
    } else if (type === 'admin') {
      setActiveRole('admin');
      setView('admin_login');
    }
  }, [location.search]);
  
  // Email Auth State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminPin, setAdminPin] = useState('');

  const formatError = (err: any) => {
    if (!err) return '';
    const message = err.message || String(err);
    if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('auth/user-not-found')) {
      return 'No account found with this email.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'An account already exists with this email.';
    }
    return message;
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await login();
      toast.success('Login Successful!', {
        icon: <ShieldCheck className="text-teal" size={18} />
      });
      sessionStorage.setItem('request_profile_completion', 'true');
      if (isProfessionalPath) {
        setActiveRole('staff');
        sessionStorage.setItem('is_professional_signup', 'true');
        navigate('/professional');
      } else {
        navigate('/my-account/bookings');
      }
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (isSignUp && !name) {
      setError('Name is required for sign up');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        toast.success('Account Created Successfully!');
      } else {
        await loginWithEmail(email, password);
        toast.success('Login Successful!');
      }
      sessionStorage.setItem('request_profile_completion', 'true');
      if (isProfessionalPath) {
        setActiveRole('staff');
        sessionStorage.setItem('is_professional_signup', 'true');
        navigate('/professional');
      } else {
        navigate('/my-account/bookings');
      }
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!adminPin) {
      setError('Please enter Admin Master Passcode');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      setActiveRole('admin');
      await loginAsAdminWithPin(adminPin);
      toast.success('Admin Authenticated Successfully!');
      navigate('/admin');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await resetPassword(email);
      toast.success('Reset link sent! Please check your email inbox and spam folder.', { duration: 5000 });
      setView('login');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-app flex flex-col md:flex-row font-sans selection:bg-teal/15 selection:text-teal">
      {/* Visual Branding Section */}
      <div className="hidden md:flex md:w-1/2 lg:w-[50%] bg-navy relative items-center justify-center p-12 overflow-hidden shadow-inner">
        <img
          src="https://images.unsplash.com/photo-1581092160607-ee22731c3c19?q=80&w=1600&auto=format&fit=crop"
          alt="Professional service technician"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-block rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
            <Logo size="lg" variant="light" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Secure Portal for Atomic Solutions
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed">
            Customers, verified field partners, and management staff access their dashboard through one unified portal.
          </p>
          <div className="flex items-center gap-3 text-teal text-xs font-bold uppercase tracking-wider pt-4">
            <ShieldCheck className="w-5 h-5" /> End-to-End Encrypted &amp; Verified
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="max-w-md w-full relative">
          
          {/* Mobile Logo */}
          <div className="mb-8 md:hidden flex justify-center">
            <Logo size="lg" />
          </div>

          <AnimatePresence mode="wait">
            
            {/* 1. Gateway Choice View */}
            {view === 'choice' && (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">Welcome</h2>
                  <p className="text-slate-500 text-sm font-medium">Select your portal to continue.</p>
                </div>

                <div className="grid gap-4">
                  {/* Customer Option */}
                  <button 
                    onClick={() => {
                      setView('login');
                      setIsProfessionalPath(false);
                      setActiveRole('customer');
                      setError('');
                    }}
                    className="w-full bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-teal/30 hover:shadow-lg transition-all duration-300 text-left group flex items-center gap-4 active:scale-[0.99]"
                  >
                    <div className="bg-navy text-white p-3.5 rounded-xl shadow-md group-hover:bg-teal transition-colors">
                      <User size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-navy text-base">Customer Account</h4>
                      <p className="text-xs text-slate-500 font-medium">Bookings, Invoices &amp; Service History</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-teal group-hover:translate-x-1 transition-all" size={20} />
                  </button>

                  {/* Professional Partner Option */}
                  <button 
                    onClick={() => {
                      setView('login');
                      setIsProfessionalPath(true);
                      setActiveRole('staff');
                      setError('');
                    }}
                    className="w-full bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-teal/30 hover:shadow-lg transition-all duration-300 text-left group flex items-center gap-4 active:scale-[0.99]"
                  >
                    <div className="bg-teal text-white p-3.5 rounded-xl shadow-md transition-colors">
                      <Briefcase size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-navy text-base">Service Professional</h4>
                      <p className="text-xs text-slate-500 font-medium">Technicians, Field Partners &amp; Jobs</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-teal group-hover:translate-x-1 transition-all" size={20} />
                  </button>

                  {/* Admin Portal Option */}
                  <button 
                    onClick={() => {
                      setView('admin_login');
                      setActiveRole('admin');
                      setError('');
                    }}
                    className="w-full bg-amber-50/50 hover:bg-amber-50 p-5 rounded-2xl border border-amber-200/60 hover:shadow-lg transition-all duration-300 text-left group flex items-center gap-4 active:scale-[0.99]"
                  >
                    <div className="bg-amber-500 text-white p-3.5 rounded-xl shadow-md transition-colors">
                      <Lock size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-navy text-base flex items-center gap-2">
                        Admin Portal <span className="text-[9px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">Official</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Management, Billing, Invoices &amp; Reports</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={20} />
                  </button>
                </div>

                <div className="text-center pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/')}
                    className="text-xs font-bold text-slate-400 hover:text-navy uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                  >
                    <Home size={15} /> Return to Homepage
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. Customer / Staff Login View */}
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
                    {isProfessionalPath ? 'Partner Portal' : 'Customer Sign In'}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    Sign in with Google or your Email Address
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-200">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Google Sign-in */}
                <Button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  type="button"
                  className="w-full bg-slate-900 hover:bg-navy text-white h-14 rounded-2xl flex items-center justify-center gap-3 shadow-md font-bold text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.77L19.98 3.3C17.78 1.26 15.03 0 12 0 7.4 0 3.4 2.65 1.43 6.54L5.61 9.77C6.6 6.91 9.17 5.04 12 5.04z" />
                    <path fill="#4285f4" d="M23.54 12.28c0-.85-.08-1.63-.22-2.38H12v4.61h6.47c-.28 1.51-1.12 2.78-2.38 3.61l3.66 2.85c2.14-1.98 3.79-5.1 3.79-8.7z" />
                    <path fill="#fbbc05" d="M5.61 14.23c-.24-.71-.38-1.47-.38-2.23s.14-1.52.38-2.23V6.54H1.43c-.92 1.83-1.43 3.84-1.43 6s.51 4.17 1.43 6l4.18-3.23z" />
                    <path fill="#34a853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.85c-1.1.74-2.51 1.18-4.3 1.18-3.32 0-6.14-2.24-7.15-5.26l-4.18 3.23C2.69 21.09 7.02 24 12 24z" />
                  </svg>
                  <span>Continue with Google</span>
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OR EMAIL</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {isSignUp && (
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-teal transition-all"
                    />
                  )}
                  
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setView('forgot_password');
                        }}
                        className="text-xs font-bold text-teal hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal hover:bg-[#0d9488] text-white h-14 rounded-2xl font-bold text-sm shadow-md"
                  >
                    {isSubmitting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-navy transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
                  </button>
                </div>

                <button 
                  onClick={() => setView('choice')}
                  className="w-full text-xs font-bold text-slate-400 hover:text-navy uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Choose Another Option
                </button>
              </motion.div>
            )}

            {/* 3. Dedicated Admin Login View */}
            {view === 'admin_login' && (
              <motion.div
                key="admin_login"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
                    Admin Portal Sign In
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    Authorized Administrator &amp; Manager Access
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-200">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Admin Google Sign-in */}
                <Button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  type="button"
                  className="w-full bg-slate-900 hover:bg-navy text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.77L19.98 3.3C17.78 1.26 15.03 0 12 0 7.4 0 3.4 2.65 1.43 6.54L5.61 9.77C6.6 6.91 9.17 5.04 12 5.04z" />
                    <path fill="#4285f4" d="M23.54 12.28c0-.85-.08-1.63-.22-2.38H12v4.61h6.47c-.28 1.51-1.12 2.78-2.38 3.61l3.66 2.85c2.14-1.98 3.79-5.1 3.79-8.7z" />
                    <path fill="#fbbc05" d="M5.61 14.23c-.24-.71-.38-1.47-.38-2.23s.14-1.52.38-2.23V6.54H1.43c-.92 1.83-1.43 3.84-1.43 6s.51 4.17 1.43 6l4.18-3.23z" />
                    <path fill="#34a853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.85c-1.1.74-2.51 1.18-4.3 1.18-3.32 0-6.14-2.24-7.15-5.26l-4.18 3.23C2.69 21.09 7.02 24 12 24z" />
                  </svg>
                  <span>Sign In with Admin Google Account</span>
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OR EMAIL &amp; PASSWORD</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Admin Email & Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Admin Email (e.g. atomichvacsolution@gmail.com)" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-amber-500 transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="Admin Password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-amber-500 transition-all"
                  />
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-navy hover:bg-slate-900 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
                  >
                    {isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}
                  </Button>
                </form>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OR SECURITY KEY</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Secure Passcode Form (No hints) */}
                <form onSubmit={handleAdminPinLogin} className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                    <KeyRound size={14} className="text-amber-600" /> Secret Security Passcode
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 rounded-xl font-bold text-xs uppercase tracking-wider"
                  >
                    Verify &amp; Enter Dashboard
                  </Button>
                </form>

                <button 
                  onClick={() => setView('choice')}
                  className="w-full text-xs font-bold text-slate-400 hover:text-navy uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Choose Another Option
                </button>
              </motion.div>
            )}

            {/* 4. Forgot Password View */}
            {view === 'forgot_password' && (
              <motion.div
                key="forgot_password"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
                    Reset Password
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    Enter your email to receive a password reset link.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-200">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Enter Registered Email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-navy hover:bg-navy/90 text-white h-14 rounded-2xl font-bold text-sm shadow-md"
                  >
                    {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                  </Button>
                </form>

                <button 
                  onClick={() => setView('login')}
                  className="w-full text-xs font-bold text-slate-400 hover:text-navy uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
