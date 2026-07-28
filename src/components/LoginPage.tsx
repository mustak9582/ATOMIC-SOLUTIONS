import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, User, Briefcase, ChevronRight, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const { login, loginWithEmail, signUpWithEmail, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'choice' | 'login' | 'forgot_password'>('choice');
  const [isProfessionalPath, setIsProfessionalPath] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Email Auth State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const formatError = (err: any) => {
    if (!err) return '';
    const message = err.message || String(err);
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
        sessionStorage.setItem('is_professional_signup', 'true');
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
        sessionStorage.setItem('is_professional_signup', 'true');
      }
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
      <div className="hidden md:flex md:w-1/2 lg:w-[58%] bg-navy relative items-center justify-center p-12 overflow-hidden shadow-inner">
        <img
          src="https://images.unsplash.com/photo-1581092160607-ee22731c3c19?q=80&w=1600&auto=format&fit=crop"
          alt="Professional service technician"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 inline-block rounded-lg border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-[0_24px_55px_-24px_rgba(0,0,0,0.45)]"
          >
            <Logo size="lg" variant="light" />
          </motion.div>
          <h1 className="text-5xl font-extrabold text-white leading-tight">Secure access for every service request</h1>
          <p className="mt-5 max-w-lg text-white/70 text-lg leading-relaxed">
            Customers, professionals, and administrators enter through one verified account flow.
          </p>
        </div>
      </div>

      {/* Main Interaction Section */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-16 lg:p-24 relative">
        <div className="max-w-md w-full relative">
          <div className="mb-12 md:hidden flex justify-center">
            <Logo size="lg" />
          </div>

        <AnimatePresence mode="wait">
          {view === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="space-y-3 mb-10">
                <h2 className="text-3xl font-extrabold text-navy">Gateway access</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Choose the workspace that matches how you use Atomic Solutions.</p>
              </div>

              <div className="grid gap-5">
                {[
                  { id: 'customer', title: 'Customer Experience', sub: 'Book services and manage visits', icon: <User size={28} />, role: false, tone: 'navy' },
                  { id: 'professional', title: 'Service Professional', sub: 'Partner network and job queue', icon: <Briefcase size={28} />, role: true, tone: 'teal' }
                ].map((card) => {
                  const iconClass = card.tone === 'teal' ? 'bg-teal text-white' : 'bg-navy text-white';
                  return (
                  <button 
                    key={card.id}
                    onClick={() => {
                      setView('login');
                      setIsProfessionalPath(card.role);
                    }}
                    className="w-full premium-card premium-card-hover p-7 text-left group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`${iconClass} p-4 rounded-lg shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)] transition-transform group-hover:scale-[1.03]`}>
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-navy text-base">{card.title}</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">{card.sub}</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:text-navy group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </button>
                )})}
              </div>

              <div className="text-center pt-8 border-t border-gray-50">
                <button 
                  onClick={() => navigate('/')}
                  className="text-[10px] font-bold text-slate-400 hover:text-navy uppercase tracking-[0.22em] transition-all inline-flex items-center gap-3"
                >
                  <Home size={14} /> Back home
                </button>
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-extrabold text-navy">
                  {isProfessionalPath ? 'Partner entry' : 'Secure access'}
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[80%] mx-auto">
                  Continue with your verified Google account
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-500 p-5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-4 border border-red-100 shadow-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <div className="space-y-8">
                {/* Google Login Section */}
                <div className="space-y-4">
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    type="button"
                    className="w-full bg-teal hover:bg-[#0d9488] text-white h-16 rounded-lg flex items-center justify-center gap-4 shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] relative overflow-hidden group active:scale-[0.98]"
                  >
                    <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#ea4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.77L19.98 3.3C17.78 1.26 15.03 0 12 0 7.4 0 3.4 2.65 1.43 6.54L5.61 9.77C6.6 6.91 9.17 5.04 12 5.04z" />
                        <path fill="#4285f4" d="M23.54 12.28c0-.85-.08-1.63-.22-2.38H12v4.61h6.47c-.28 1.51-1.12 2.78-2.38 3.61l3.66 2.85c2.14-1.98 3.79-5.1 3.79-8.7z" />
                        <path fill="#fbbc05" d="M5.61 14.23c-.24-.71-.38-1.47-.38-2.23s.14-1.52.38-2.23V6.54H1.43c-.92 1.83-1.43 3.84-1.43 6s.51 4.17 1.43 6l4.18-3.23z" />
                        <path fill="#34a853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.85c-1.1.74-2.51 1.18-4.3 1.18-3.32 0-6.14-2.24-7.15-5.26l-4.18 3.23C2.69 21.09 7.02 24 12 24z" />
                      </svg>
                    </div>
                    <div className="text-left font-bold">
                      <span className="block text-sm">Continue with Google</span>
                    </div>
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">OR</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all mb-4"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setView('forgot_password');
                        }}
                        className="text-[10px] font-bold text-teal hover:text-[#0d9488] transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal hover:bg-[#0d9488] text-white h-16 rounded-lg font-bold shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)]"
                  >
                    {isSubmitting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login with Email')}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-navy uppercase tracking-widest transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setView('choice')}
                className="w-full text-[10px] font-bold text-slate-400 hover:text-navy uppercase tracking-[0.2em] transition-colors py-4 flex items-center justify-center gap-3 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to options
              </button>
            </motion.div>
          )}

          {view === 'forgot_password' && (
            <motion.div
              key="forgot_password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-extrabold text-navy">
                  Reset Password
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[90%] mx-auto">
                  Enter your email address and we'll send you a link to reset your password. Please check your inbox and spam folder.
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-500 p-5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-4 border border-red-100 shadow-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <div className="space-y-8">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Enter your registered Email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-4 font-semibold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                  />
                  
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-navy hover:bg-navy/90 text-white h-16 rounded-lg font-bold shadow-xl"
                  >
                    {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                  </Button>
                </form>
              </div>

              <button 
                onClick={() => setView('login')}
                className="w-full text-[10px] font-bold text-slate-400 hover:text-navy uppercase tracking-[0.2em] transition-colors py-4 flex items-center justify-center gap-3 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
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
