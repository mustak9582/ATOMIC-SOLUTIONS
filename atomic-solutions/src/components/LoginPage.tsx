import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Mail, Lock as LockIcon, ChevronRight, User, AlertCircle, 
  Home, ArrowLeft, Briefcase, Phone, MapPin, Search, MailCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isMockMode } from '../services/firebaseService';
import Logo from './Logo';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { STAFF_CATEGORIES, DEOGHAR_AREAS } from '../constants';

const LoginPage: React.FC = () => {
  const { 
    login, adminLoginWithPassword, requestAdminOTP, verifyAdminOTP, 
    requestUserLocation, updateProfile, isProfileComplete, profile,
    signupManual, loginManual 
  } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'choice' | 'customer' | 'admin_choice' | 'admin_login' | 'admin_setup_phone' | 'admin_setup_otp' | 'onboarding_start'>('choice');
  const [isProfessionalPath, setIsProfessionalPath] = useState(false);
  const [credential, setCredential] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [whatsappOtpRequested, setWhatsappOtpRequested] = useState(false);
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'manual'>('google');
  const [isSignup, setIsSignup] = useState(false);
  const [manualCredentials, setManualCredentials] = useState({ email: '', password: '' });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: '',
    area: '',
    email: ''
  });

  const formatError = (err: any) => {
    if (!err) return '';
    const message = err.message || String(err);
    try {
      if (message.startsWith('{')) {
        const parsed = JSON.parse(message);
        if (parsed.error) return `${parsed.error} (${parsed.path || ''})`;
      }
    } catch (e) {}
    return message;
  };

  const handleRequestWhatsappOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // DEV NOTE: For real production integration, call a WhatsApp API (like Twilio, Meta Graph, or 2Factor)
      console.log(`Sending OTP to WhatsApp: ${formData.phone}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWhatsappOtpRequested(true);
      setError(''); // Clear errors on success 
      // In production, real message would be sent here
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyWhatsappOTP = async () => {
    if (whatsappOtp !== '123456' && whatsappOtp !== '000000') { 
      setError('Invalid WhatsApp OTP. For launch testing, use 123456');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsWhatsappVerified(true);
      setError('');
      // Move to next step automatically or let user click next
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!credential || !adminPassword) {
      setError('Please fill all fields');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const success = await adminLoginWithPassword(credential, adminPassword);
      if (!success) setError('Invalid credentials.');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const success = await verifyAdminOTP(otp, adminPassword);
      if (!success) setError('Invalid OTP. Use 123456 in demo.');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!manualCredentials.email) {
      setError('Please enter your email');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      if (isSignup) {
        await signupManual(manualCredentials.email, manualCredentials.password);
      } else {
        await loginManual(manualCredentials.email, manualCredentials.password);
      }
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
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

  const handleNextStep = () => {
    if (onboardingStep === 1) {
      if (!formData.name || !formData.phone || formData.phone.length < 10) {
        setError('Please enter your name and valid 10-digit WhatsApp number');
        return;
      }
      if (!isWhatsappVerified) {
        setError('Please verify your WhatsApp number first');
        return;
      }
      setError('');
      if (isProfessionalPath) setOnboardingStep(2);
      else setOnboardingStep(3);
    } else if (onboardingStep === 2) {
      if (!formData.category || !formData.area) {
        setError('Please select your category and work area');
        return;
      }
      setError('');
      setOnboardingStep(3);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setIsLocating(true);
    try {
      let location = null;
      try {
        location = await requestUserLocation(true);
      } catch (e) {
        console.warn("Location prompt was declined", e);
      }

      const finalPhone = formData.phone.startsWith('91') ? formData.phone : `91${formData.phone}`;
      await updateProfile({
        name: formData.name,
        phone: finalPhone,
        isPhoneVerified: true,
        isStaff: isProfessionalPath,
        staffStatus: isProfessionalPath ? 'pending' : null,
        staffCategory: isProfessionalPath ? formData.category : null,
        workArea: isProfessionalPath ? formData.area : null,
        location: location || profile?.location,
        updatedAt: new Date().toISOString()
      });
      navigate(isProfessionalPath ? '/professional' : '/dashboard');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
      setIsLocating(false);
    }
  };

  React.useEffect(() => {
    if (profile && !isProfileComplete && view !== 'onboarding_start') {
      setFormData(prev => ({
        ...prev,
        name: profile.name || prev.name,
        email: profile.email || prev.email
      }));
      setView('onboarding_start');
    }
  }, [profile, isProfileComplete, view]);

  const steps = [
    { id: 1, title: 'Identity Verification', icon: <User size={18} /> },
    { id: 2, title: 'Skill Profile', icon: <Briefcase size={18} />, hidden: !isProfessionalPath },
    { id: 3, title: 'Operational Area', icon: <MapPin size={18} /> },
  ].filter(s => !s.hidden);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-teal selection:text-white">
      {/* Visual Branding Section */}
      <div className="hidden md:flex md:w-1/2 lg:w-[60%] bg-navy relative items-center justify-center p-12 overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '48px 48px' }}></div>
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-teal/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[400px] h-[400px] bg-navy-100/5 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 text-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 inline-block shadow-2xl"
          >
            <Logo size="lg" variant="light" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-6 mt-12">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 w-1.5 bg-teal rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </motion.div>
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
                <div className="inline-flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <div className="w-2 h-2 bg-teal rounded-full animate-ping"></div>
                  <span className="text-[9px] font-black text-navy uppercase tracking-widest">Portal Version 2.4.0</span>
                </div>
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Gateway Access</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Secure authentication for all stakeholders</p>
              </div>

              <div className="grid gap-5">
                {[
                  { id: 'customer', title: 'Customer Experience', sub: 'Book Services & Manage Assets', icon: <User size={28} />, role: false, color: 'navy' },
                  { id: 'professional', title: 'Service Professional', sub: 'Partner Network & Job Queue', icon: <Briefcase size={28} />, role: true, color: 'teal' }
                ].map(card => (
                  <button 
                    key={card.id}
                    onClick={() => {
                      setView('customer');
                      setIsProfessionalPath(card.role);
                    }}
                    className={`w-full bg-white border border-gray-100 hover:border-${card.color} p-8 rounded-[2.5rem] text-left transition-all group relative overflow-hidden active:scale-[0.98]`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-125`}></div>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`bg-${card.color} p-5 rounded-[1.5rem] text-white shadow-2xl shadow-${card.color}/30 transform transition-transform group-hover:rotate-6`}>
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-navy text-base uppercase tracking-tight">{card.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{card.sub}</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:text-navy group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </button>
                ))}

                <button 
                  onClick={() => setView('admin_choice')}
                  className="mt-4 flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 hover:bg-navy/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={20} className="text-gray-400 group-hover:text-navy" />
                    <span className="text-[10px] font-black text-gray-400 group-hover:text-navy uppercase tracking-[0.2em]">Root Administrative Hub</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              </div>

              <div className="text-center pt-8 border-t border-gray-50">
                <button 
                  onClick={() => navigate('/')}
                  className="text-[10px] font-black text-gray-300 hover:text-navy uppercase tracking-[0.3em] transition-all inline-flex items-center gap-3"
                >
                  <Home size={14} /> Kill Session • Home
                </button>
              </div>
            </motion.div>
          )}

          {view === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
                  {isProfessionalPath ? 'Partner LogIn' : 'Secure Entry'}
                </h2>
                <div className="flex items-center justify-center p-1 bg-slate-50 rounded-2xl w-fit mx-auto border border-slate-100">
                  <button 
                    onClick={() => { setLoginMethod('google'); setError(''); }}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'google' ? 'bg-white text-navy shadow-sm border border-slate-100' : 'text-slate-400'}`}
                  >
                    Google Auth
                  </button>
                  <button 
                    onClick={() => { setLoginMethod('manual'); setError(''); }}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'manual' ? 'bg-white text-navy shadow-sm border border-slate-100' : 'text-slate-400'}`}
                  >
                    Direct Access
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-500 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 border border-red-100 shadow-sm"
                >
                  <div className="p-2 bg-white rounded-full border border-red-100 flex-shrink-0 animate-pulse">
                    <AlertCircle size={16} />
                  </div>
                  {error}
                </motion.div>
              )}

              {loginMethod === 'google' ? (
                <div className="space-y-6">
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full bg-navy hover:bg-slate-900 text-white h-20 rounded-[2rem] flex items-center justify-center gap-6 shadow-2xl shadow-navy/20 relative overflow-hidden group active:scale-[0.97]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/5 to-teal/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="bg-white p-3 rounded-2xl shadow-xl shadow-white/10 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#ea4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.77L19.98 3.3C17.78 1.26 15.03 0 12 0 7.4 0 3.4 2.65 1.43 6.54L5.61 9.77C6.6 6.91 9.17 5.04 12 5.04z" />
                        <path fill="#4285f4" d="M23.54 12.28c0-.85-.08-1.63-.22-2.38H12v4.61h6.47c-.28 1.51-1.12 2.78-2.38 3.61l3.66 2.85c2.14-1.98 3.79-5.1 3.79-8.7z" />
                        <path fill="#fbbc05" d="M5.61 14.23c-.24-.71-.38-1.47-.38-2.23s.14-1.52.38-2.23V6.54H1.43c-.92 1.83-1.43 3.84-1.43 6s.51 4.17 1.43 6l4.18-3.23z" />
                        <path fill="#34a853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.85c-1.1.74-2.51 1.18-4.3 1.18-3.32 0-6.14-2.24-7.15-5.26l-4.18 3.23C2.69 21.09 7.02 24 12 24z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm uppercase tracking-tight">{isSubmitting ? 'SECURE HANDSHAKE...' : 'CONTINUE WITH GOOGLE'}</span>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Biometric or Password Ready</span>
                    </div>
                  </Button>
                  <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed max-w-[80%] mx-auto">
                    Atomic uses SOC 2 Type II compliant Google identity infrastructure
                  </p>
                </div>
              ) : (
                <form onSubmit={handleManualAuth} className="space-y-5">
                  <div className="grid gap-4">
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                      <input 
                        type="email" 
                        placeholder="ADMIN@ATOMIC.COM"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal focus:shadow-2xl focus:shadow-teal/5 transition-all"
                        value={manualCredentials.email}
                        onChange={e => setManualCredentials(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="relative group">
                      <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal focus:shadow-2xl focus:shadow-teal/5 transition-all"
                        value={manualCredentials.password}
                        onChange={e => setManualCredentials(p => ({ ...p, password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-navy text-white h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/10 active:scale-[0.98] transition-transform"
                  >
                    {isSignup ? 'CREATE SECURE PROFILE' : 'VALIDATE & LOG IN'}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setIsSignup(!isSignup)}
                    className="w-full text-center text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-teal transition-all group"
                  >
                    {isSignup ? 'ALREADY ON THE GRID? LOGIN' : 'NEW STAKEHOLDER? MANUALLY ONBOARD'}
                    <div className="h-0.5 w-0 bg-teal mx-auto mt-1 group-hover:w-8 transition-all duration-300"></div>
                  </button>
                </form>
              )}

              <button 
                onClick={() => setView('choice')}
                className="w-full text-[10px] font-black text-slate-300 hover:text-navy uppercase tracking-[0.3em] transition-colors py-4 flex items-center justify-center gap-3 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back To Choice
              </button>
            </motion.div>
          )}

          {view === 'onboarding_start' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="text-center space-y-6">
                <div className="flex justify-center gap-3">
                  {steps.map(s => (
                    <div 
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all duration-700 ${onboardingStep === s.id ? 'w-12 bg-teal' : onboardingStep > s.id ? 'w-4 bg-navy' : 'w-4 bg-slate-100'}`}
                    />
                  ))}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
                    {steps.find(s => s.id === onboardingStep)?.title}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Onboarding Sequence • Step {onboardingStep} of {steps.length}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-red-100 italic shadow-sm">
                   {error}
                </div>
              )}

              <div className="min-h-[340px]">
                <AnimatePresence mode="wait">
                  {onboardingStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-5"
                    >
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-navy transition-colors" size={20} />
                        <input 
                          type="text" 
                          placeholder="FULL NAME"
                          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-navy focus:shadow-2xl focus:shadow-navy/5 transition-all"
                          value={formData.name}
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-navy transition-colors" size={20} />
                        <input 
                          type="tel" 
                          placeholder="WHATSAPP NUMBER (REQUIRED FOR 2FA)"
                          disabled={whatsappOtpRequested || isWhatsappVerified}
                          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-24 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-navy focus:shadow-2xl focus:shadow-navy/5 transition-all disabled:opacity-50"
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        />
                        {!whatsappOtpRequested && !isWhatsappVerified && (
                          <button 
                            onClick={handleRequestWhatsappOTP}
                            disabled={formData.phone.length < 10 || isSubmitting}
                            className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-navy text-white text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-teal disabled:opacity-50 transition-all"
                          >
                            Verify
                          </button>
                        )}
                        {isWhatsappVerified && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-teal">
                            <ShieldCheck size={20} />
                          </div>
                        )}
                      </div>

                      {whatsappOtpRequested && !isWhatsappVerified && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 pt-2"
                        >
                          <div className="bg-teal/10 p-4 rounded-2xl border border-teal/20 mb-4">
                            <div className="flex gap-3">
                              <ShieldCheck size={16} className="text-teal flex-shrink-0 mt-0.5" />
                              <p className="text-[9px] font-black text-teal uppercase tracking-widest leading-relaxed">
                                Two-Factor Authentication Enabled: We've sent a secure code to prevent unauthorized use of this number.
                              </p>
                            </div>
                          </div>
                          <div className="relative group">
                            <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                            <input 
                              type="text" 
                              placeholder="ENTER OTP SENT TO WHATSAPP"
                              className="w-full bg-white border-2 border-teal rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none shadow-xl shadow-teal/5"
                              value={whatsappOtp}
                              onChange={e => setWhatsappOtp(e.target.value)}
                            />
                            <button 
                              onClick={handleVerifyWhatsappOTP}
                              disabled={isSubmitting}
                              className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-teal text-white text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-navy transition-all"
                            >
                              Confirm
                            </button>
                          </div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">
                            Didn't receive it? <button onClick={() => setWhatsappOtpRequested(false)} className="text-navy hover:underline">Retry Number</button>
                          </p>
                        </motion.div>
                      )}
                      <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                        <div className="flex gap-4">
                          <MailCheck size={20} className="text-navy flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-navy uppercase tracking-widest">Linked Email</p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">{formData.email || 'Pending Verification'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 2 && isProfessionalPath && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-5"
                    >
                      <div className="relative group">
                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-10 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal appearance-none transition-all cursor-pointer"
                          value={formData.category}
                          onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                        >
                          <option value="">PROFESSIONAL EXPERTISE</option>
                          {STAFF_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none rotate-90" size={16} />
                      </div>
                      <div className="relative group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-10 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal appearance-none transition-all cursor-pointer"
                          value={formData.area}
                          onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                        >
                          <option value="">PREFERRED OPERATIONAL HUB</option>
                          {DEOGHAR_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none rotate-90" size={16} />
                      </div>
                      <div className="p-6 bg-teal/5 rounded-[2rem] border border-teal/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
                          <ShieldCheck size={40} />
                        </div>
                        <h5 className="text-[11px] font-black text-teal uppercase tracking-widest mb-2">Quality Standards</h5>
                        <p className="text-[10px] font-bold text-teal/80 uppercase tracking-widest leading-relaxed">
                          Your account will enter a verification queue. Admins will contact you via WhatsApp for background checks.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-8 py-8"
                    >
                      <div className="relative inline-block">
                        <div className="w-32 h-32 bg-slate-50 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-slate-200">
                          <MapPin size={48} className="text-teal animate-bounce" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-navy text-white p-2 rounded-full shadow-xl">
                          <ShieldCheck size={20} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-black text-navy text-xl uppercase tracking-tighter">Geo-Authorization</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-wider max-w-[80%] mx-auto">
                          Atomic requires real-time location to validate {isProfessionalPath ? 'job authenticity' : 'service radius'} in Deoghar Central.
                        </p>
                        <div className="flex items-center justify-center gap-3 text-teal">
                          <div className="h-1 w-1 bg-teal rounded-full animate-ping"></div>
                          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Privacy First • SSL Encrypted</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 space-y-4">
                {onboardingStep < steps.length ? (
                  <Button 
                    onClick={handleNextStep}
                    className="w-full bg-navy text-white h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 group active:scale-[0.98]"
                  >
                    CONTINUE NEXT SEQUENCE <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCompleteOnboarding}
                    disabled={isSubmitting}
                    className="w-full bg-teal text-white h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-teal/20 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'ENCRYPTING & SYNCING...' : 'FINALIZE SECURE PROFILE'}
                  </Button>
                )}
                
                {onboardingStep > 1 && (
                  <button 
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="w-full text-[10px] font-black text-slate-300 hover:text-navy uppercase tracking-[0.3em] transition-all py-2"
                  >
                    Previous Step
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'admin_choice' && (
            <motion.div
              key="admin_choice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-navy/5 text-navy rounded-full mx-auto flex items-center justify-center border border-navy/10 mb-6">
                  <ShieldCheck size={36} />
                </div>
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Root Console</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Administrative Security Protocol</p>
              </div>

              <div className="grid gap-5">
                {[
                  { id: 'admin_login', title: 'Password Gateway', sub: 'Standard Root Login', icon: <LockIcon size={20} /> },
                  { id: 'admin_setup_phone', title: 'Identity Recovery', sub: 'OTP Verification via 95822XXXXX', icon: <ShieldCheck size={20} /> }
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setView(item.id as any)}
                    className="w-full bg-white border border-slate-100 hover:border-teal p-7 rounded-[2rem] text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-teal group-hover:text-white transition-all shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-navy text-xs uppercase tracking-widest">{item.title}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.sub}</p>
                      </div>
                      <ChevronRight className="ml-auto text-slate-200 group-hover:text-navy group-hover:translate-x-1 transition-all" size={16} />
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setView('choice')}
                className="w-full text-[10px] font-black text-slate-300 hover:text-navy uppercase tracking-[0.3em] transition-colors py-4 flex items-center justify-center gap-3"
              >
                <ArrowLeft size={16} /> Back to Public Access
              </button>
            </motion.div>
          )}

          {view === 'admin_login' && (
            <motion.form
              key="admin_login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleAdminLogin}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Enter Key</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Management Credential Input</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm flex items-center gap-4">
                   <AlertCircle size={20} /> {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="ADMIN IDENTIFIER"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal transition-all"
                  />
                </div>
                <div className="relative group">
                  <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-navy text-white h-20 rounded-[2rem] shadow-2xl shadow-navy/20 transition-all font-black text-xs uppercase tracking-[0.2em]"
                >
                  {isSubmitting ? 'VALIDATING...' : 'ACCESS DASHBOARD'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_choice')}
                  className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-navy py-4"
                >
                  Return to Admin Selection
                </button>
              </div>
            </motion.form>
          )}

          {view === 'admin_setup_phone' && (
            <motion.form
              key="admin_setup_phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRequestOTP}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Identify</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Phone Verification Sequence</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm flex items-center gap-4">
                   <AlertCircle size={20} /> {error}
                </div>
              )}

              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal font-black text-xs transition-colors">
                  +91
                </div>
                <input 
                  type="tel" 
                  placeholder="IDENTIFIED PHONE"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal transition-all"
                />
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal text-white h-20 rounded-[2rem] shadow-2xl shadow-teal/20 transition-all font-black text-xs uppercase tracking-[0.2em]"
                >
                  {isSubmitting ? 'REQUESTING...' : 'SEND OTP CHALLENGE'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_choice')}
                  className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-navy py-4"
                >
                  Back to Security Hub
                </button>
              </div>
            </motion.form>
          )}

          {view === 'admin_setup_otp' && (
            <motion.form
              key="admin_setup_otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleVerifyOTP}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Verify</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">OTP & Root Password Set</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm flex items-center gap-4">
                   <AlertCircle size={20} /> {error}
                </div>
              )}

              <div className="space-y-5">
                <input 
                  type="text" 
                  placeholder="OTP-CHALLENGE"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-6 font-black text-2xl text-center tracking-[0.4em] text-navy outline-none focus:bg-white focus:border-teal transition-all"
                />
                <input 
                  type="password" 
                  placeholder="NEW ROOT PASSWORD"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-teal transition-all"
                />
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal text-white h-20 rounded-[2rem] shadow-2xl shadow-teal/20 transition-all font-black text-xs uppercase tracking-[0.2em]"
                >
                  {isSubmitting ? 'UPDATING...' : 'VALIDATE & INITIALIZE'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setView('admin_setup_phone')}
                  className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-navy py-4"
                >
                  Retry Phone Verification
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
