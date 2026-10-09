import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  ShieldCheck, 
  LockIcon, 
  ImageIcon, 
  Layers, 
  MessageCircle, 
  Trash2, 
  Save, 
  Building2, 
  UserCheck, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  QrCode, 
  PenTool, 
  Share2, 
  CheckCircle2, 
  RefreshCw,
  Copy,
  ExternalLink,
  Sparkles,
  Youtube,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react';
import { AppSettings } from '../../types';
import { DEFAULT_APP_SETTINGS, formatBankDetailsString, getMergedSettings } from '../../services/settingsService';

export interface TabSettingsProps {
  user: any;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  clearAllNotifs: () => void;
  updateSettings: (settings: AppSettings) => void;
}

type SettingsSection = 'company' | 'founder' | 'bank' | 'tax' | 'invoice' | 'contact' | 'social' | 'security';

export function TabSettings({ user, appSettings, setAppSettings, clearAllNotifs, updateSettings }: TabSettingsProps) {
  const { changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewBankDetails, setPreviewBankDetails] = useState('');

  // Local state initialized with merged settings
  const [formData, setFormData] = useState<AppSettings>(() => getMergedSettings(appSettings));

  // Sync if parent appSettings update
  useEffect(() => {
    if (appSettings) {
      setFormData(prev => ({
        ...DEFAULT_APP_SETTINGS,
        ...prev,
        ...appSettings
      }));
    }
  }, [appSettings]);

  // Update bank string preview whenever banking/tax fields change
  useEffect(() => {
    setPreviewBankDetails(formatBankDetailsString(formData));
  }, [
    formData.bankAccountHolder,
    formData.bankName,
    formData.bankAccountNumber,
    formData.bankIfsc,
    formData.bankBranch,
    formData.panNumber,
    formData.upiId
  ]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field: 'logoUrl' | 'signatureUrl' | 'qrCodeUrl', file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        handleChange(field, reader.result as string);
        toast.success(`${field === 'logoUrl' ? 'Logo' : field === 'signatureUrl' ? 'Signature' : 'QR Code'} uploaded`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const merged = getMergedSettings(formData);
      setAppSettings(merged);
      await updateSettings(merged);
      toast.success('All settings saved and applied to entire website & invoices!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      await changePassword(newPassword);
      toast.success('Admin password updated successfully!');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'company', label: 'Company & Branding', icon: <Building2 size={18} />, desc: 'Name, logo, tagline & description' },
    { id: 'founder', label: 'Founder Profile', icon: <UserCheck size={18} />, desc: 'Founder name, title, bio & contact' },
    { id: 'bank', label: 'Bank & UPI Details', icon: <CreditCard size={18} />, desc: 'Bank A/C, IFSC, UPI ID & QR code' },
    { id: 'tax', label: 'Tax & Compliance', icon: <FileText size={18} />, desc: 'GSTIN, PAN Card & MSME number' },
    { id: 'invoice', label: 'Invoice Defaults', icon: <PenTool size={18} />, desc: 'Signature, terms & declaration' },
    { id: 'contact', label: 'Contact & Office', icon: <Phone size={18} />, desc: 'Phones, email, address & pincode' },
    { id: 'social', label: 'Social & Links', icon: <Share2 size={18} />, desc: 'YouTube, Facebook, Instagram links' },
    { id: 'security', label: 'Security & Auth', icon: <LockIcon size={18} />, desc: 'Admin password & system controls' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-gradient-to-br from-navy via-[#0e223d] to-navy text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal text-navy rounded-2xl font-black shadow-lg shadow-teal/20">
                <Settings size={28} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  System & Business Settings
                </h2>
                <p className="text-xs font-bold text-teal tracking-widest uppercase mt-0.5">
                  Universal Configuration • Bank, Tax, Founder, Branding & Invoices
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-teal hover:bg-[#0d9488] text-navy font-black text-xs uppercase tracking-widest px-6 h-12 rounded-xl shadow-lg shadow-teal/20 gap-2"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save All Settings
            </Button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {sections.map(sec => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all uppercase tracking-wider ${
                  isActive
                    ? 'bg-teal text-navy shadow-md font-black'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {sec.icon}
                {sec.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Active Section Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: Company & Branding */}
          {activeSection === 'company' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Company Profile & Branding</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Brand identity shown on website, header & invoices</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="e.g. ATOMIC SOLUTIONS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Company Tagline / Slogan</label>
                  <input
                    type="text"
                    value={formData.companyTagline || ''}
                    onChange={(e) => handleChange('companyTagline', e.target.value)}
                    placeholder="e.g. We Bring Comfort Life"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Company Description</label>
                  <textarea
                    rows={3}
                    value={formData.companyDescription || ''}
                    onChange={(e) => handleChange('companyDescription', e.target.value)}
                    placeholder="Brief description of the business..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Logo Uploader */}
                <div className="sm:col-span-2 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                  <label className="text-[11px] font-black text-gray-600 tracking-wider uppercase block">Company Logo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Layers className="text-gray-300" size={36} />
                      )}
                      <label className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white text-[9px] font-bold uppercase">
                        <ImageIcon size={18} />
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('logoUrl', file);
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-[11px] font-bold rounded-lg hover:bg-navy/90 transition-all uppercase tracking-wider">
                          <ImageIcon size={14} /> Upload New Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload('logoUrl', file);
                            }}
                          />
                        </label>
                        {formData.logoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChange('logoUrl', '')}
                            className="text-red-500 border-red-200 hover:bg-red-50 text-[11px] font-bold h-9 rounded-lg"
                          >
                            Remove Logo
                          </Button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.logoUrl || ''}
                        onChange={(e) => handleChange('logoUrl', e.target.value)}
                        placeholder="Or paste Logo Image URL (https://...)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 outline-none focus:border-teal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: Founder Profile */}
          {activeSection === 'founder' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Founder & Leadership Profile</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Founder identity, leadership message & official presence</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Founder Name</label>
                  <input
                    type="text"
                    value={formData.founderName || ''}
                    onChange={(e) => handleChange('founderName', e.target.value)}
                    placeholder="e.g. Mustak Ansari"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Designation / Title</label>
                  <input
                    type="text"
                    value={formData.founderTitle || ''}
                    onChange={(e) => handleChange('founderTitle', e.target.value)}
                    placeholder="e.g. Founder & Managing Director"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Founder Direct Phone</label>
                  <input
                    type="text"
                    value={formData.founderPhone || ''}
                    onChange={(e) => handleChange('founderPhone', e.target.value)}
                    placeholder="e.g. +91 95822 68658"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Founder Email</label>
                  <input
                    type="email"
                    value={formData.founderEmail || ''}
                    onChange={(e) => handleChange('founderEmail', e.target.value)}
                    placeholder="e.g. atomichvacsolution@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Founder Address / Office Origin</label>
                  <input
                    type="text"
                    value={formData.founderAddress || ''}
                    onChange={(e) => handleChange('founderAddress', e.target.value)}
                    placeholder="e.g. Binjha, Sonraithari, Deoghar, Jharkhand 814149"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Founder Bio / Leadership Message</label>
                  <textarea
                    rows={3}
                    value={formData.founderBio || ''}
                    onChange={(e) => handleChange('founderBio', e.target.value)}
                    placeholder="Leadership commitment, message for clients and partners..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 3: Banking & UPI Details */}
          {activeSection === 'bank' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Bank Account & UPI Payment Settings</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bank details & UPI ID shown on invoices, estimates & checkout</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Account Beneficiary / Holder Name</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder || ''}
                    onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                    placeholder="e.g. MUSTAK ANSARI"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g. BANK OF BARODA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    placeholder="e.g. 26450200001659"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIfsc || ''}
                    onChange={(e) => handleChange('bankIfsc', e.target.value)}
                    placeholder="e.g. BARB0DEOGHA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Branch Name / Address</label>
                  <input
                    type="text"
                    value={formData.bankBranch || ''}
                    onChange={(e) => handleChange('bankBranch', e.target.value)}
                    placeholder="e.g. Deoghar Main Branch, Jharkhand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Account Type</label>
                  <select
                    value={formData.bankAccountType || 'Current'}
                    onChange={(e) => handleChange('bankAccountType', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Primary UPI ID (for QR & Invoices)</label>
                  <input
                    type="text"
                    value={formData.upiId || ''}
                    onChange={(e) => handleChange('upiId', e.target.value)}
                    placeholder="e.g. mustakansari9582-3@okhdfcbank"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Alternate UPI ID / Number</label>
                  <input
                    type="text"
                    value={formData.upiIdSecondary || ''}
                    onChange={(e) => handleChange('upiIdSecondary', e.target.value)}
                    placeholder="e.g. 9582268658@ybl"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                {/* Custom QR Code Upload */}
                <div className="sm:col-span-2 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <label className="text-[11px] font-black text-gray-600 tracking-wider uppercase block">Custom Bank QR Code Image (Optional)</label>
                  <p className="text-[10px] text-gray-500">If omitted, an official Dynamic UPI QR Code is automatically generated from your UPI ID.</p>
                  <div className="flex items-center gap-4">
                    {formData.qrCodeUrl && (
                      <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-1">
                        <img src={formData.qrCodeUrl} alt="QR Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-[11px] font-bold rounded-lg hover:bg-black transition-all uppercase tracking-wider">
                      <QrCode size={14} /> Upload Custom QR
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('qrCodeUrl', file);
                        }}
                      />
                    </label>
                    {formData.qrCodeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange('qrCodeUrl', '')}
                        className="text-red-500 border-red-200 hover:bg-red-50 text-[11px] font-bold h-9 rounded-lg"
                      >
                        Use Auto UPI QR
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 4: Tax & Legal Compliance */}
          {activeSection === 'tax' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Tax & Legal Registration Details</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Official GSTIN, PAN number and MSME Udyam credentials</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Business GSTIN (GST Number)</label>
                  <input
                    type="text"
                    value={formData.ownerGSTIN || ''}
                    onChange={(e) => handleChange('ownerGSTIN', e.target.value.toUpperCase())}
                    placeholder="e.g. 20CVVPA9010L1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                  <p className="text-[10px] text-gray-400 font-medium">Appears at the top of all GST Tax Invoices and estimates.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">PAN Card Number</label>
                  <input
                    type="text"
                    value={formData.panNumber || ''}
                    onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. CVVPA9010L"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">MSME / Udyam Registration No.</label>
                  <input
                    type="text"
                    value={formData.msmeNumber || ''}
                    onChange={(e) => handleChange('msmeNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. UDYAM-JH-04-0012345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="e.g. Jharkhand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">State Code (GST)</label>
                  <input
                    type="text"
                    value={formData.stateCode || ''}
                    onChange={(e) => handleChange('stateCode', e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 5: Invoice Defaults & Signatures */}
          {activeSection === 'invoice' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <PenTool size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Invoice Defaults & Digital Signature</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Signatory name, seal signature & legal terms on PDF invoices</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Authorised Signatory Name</label>
                  <input
                    type="text"
                    value={formData.authorisedSignatory || ''}
                    onChange={(e) => handleChange('authorisedSignatory', e.target.value)}
                    placeholder="e.g. Mustak Ansari"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                {/* Signature Image Uploader */}
                <div className="sm:col-span-2 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <label className="text-[11px] font-black text-gray-600 tracking-wider uppercase block">Authorised Signature / Seal Image</label>
                  <div className="flex items-center gap-5">
                    <div className="w-32 h-16 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {formData.signatureUrl ? (
                        <img src={formData.signatureUrl} alt="Signature Preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">Default Seal</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-[11px] font-bold rounded-lg hover:bg-navy/90 transition-all uppercase tracking-wider">
                        <PenTool size={14} /> Upload Signature
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('signatureUrl', file);
                          }}
                        />
                      </label>
                      {formData.signatureUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange('signatureUrl', '')}
                          className="text-red-500 border-red-200 hover:bg-red-50 text-[11px] font-bold h-9 rounded-lg"
                        >
                          Use Default Signature
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Default Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={formData.defaultTerms || ''}
                    onChange={(e) => handleChange('defaultTerms', e.target.value)}
                    placeholder="1. 50% Advance with order..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Default Declaration & Jurisdiction</label>
                  <textarea
                    rows={3}
                    value={formData.defaultDeclaration || ''}
                    onChange={(e) => handleChange('defaultDeclaration', e.target.value)}
                    placeholder="1. Subject to Deoghar (Jharkhand) jurisdiction..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Invoice Footer Thank You Note</label>
                  <input
                    type="text"
                    value={formData.invoiceThankYouNote || ''}
                    onChange={(e) => handleChange('invoiceThankYouNote', e.target.value)}
                    placeholder="e.g. Thank You For Business With US!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 6: Contact & Office Information */}
          {activeSection === 'contact' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Contact & Office Locations</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp, customer care numbers, email and official physical address</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">WhatsApp Number (with country code 91)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                      placeholder="919582268658"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-sm text-navy outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-green-500 rounded-lg text-white">
                      <MessageCircle size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Used for WhatsApp buttons, customer booking notifications & share links.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Primary Support Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 95822 68658"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Alternate Contact Phone</label>
                  <input
                    type="text"
                    value={formData.alternatePhone || ''}
                    onChange={(e) => handleChange('alternatePhone', e.target.value)}
                    placeholder="+91 95822 68658"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Official Support Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="atomichvacsolution@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">Head Office Full Address</label>
                  <textarea
                    rows={3}
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Deoghar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase block">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="814149"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 7: Social Media & Online Links */}
          {activeSection === 'social' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <Share2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Social Media & Online Links</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Connect social channels displayed on header, footer and portal</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-2">
                    <Globe size={14} className="text-teal" /> Official Website URL
                  </label>
                  <input
                    type="text"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    placeholder="https://atomicsolutions.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-2">
                    <Youtube size={14} className="text-red-500" /> YouTube Channel / Portfolio URL
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/@AtomicSolutions610"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-2">
                    <Facebook size={14} className="text-blue-600" /> Facebook Page URL
                  </label>
                  <input
                    type="text"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    placeholder="https://www.facebook.com/share/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-2">
                    <Instagram size={14} className="text-pink-600" /> Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => handleChange('instagramUrl', e.target.value)}
                    placeholder="https://www.instagram.com/atomic_solutions_1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-2">
                    <Linkedin size={14} className="text-blue-700" /> LinkedIn URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    placeholder="https://www.linkedin.com/company/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs text-navy outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 8: Security & System Controls */}
          {activeSection === 'security' && (
            <Card className="rounded-[32px] border-none shadow-xl p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal/10 text-teal rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-lg">Identity, Security & Master Access</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Master admin credentials & system maintenance</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-navy/[0.03] rounded-2xl border border-navy/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Administrator</span>
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 font-black text-[9px] px-2.5 py-0.5 uppercase tracking-widest">
                      Authenticated
                    </Badge>
                  </div>
                  <p className="font-black text-navy text-sm">{user?.email || 'admin@atomicsolutions.in'}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Cloud Data Store • Synchronized & Persistent</p>
                </div>

                <form onSubmit={handlePasswordChange} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-navy uppercase tracking-wider">Update Master Password</span>
                    <LockIcon size={16} className="text-teal" />
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Enter new master password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-xs text-navy outline-none focus:border-teal transition-all"
                    />
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="w-full bg-navy hover:bg-[#0e223d] text-white font-bold h-11 rounded-xl shadow-md"
                    >
                      {isUpdatingPassword ? 'Updating Password...' : 'Change Admin Password'}
                    </Button>
                  </div>
                </form>

                <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-red-900 text-xs uppercase tracking-wider">Clear Admin Notifications</h4>
                    <p className="text-[11px] text-red-700 font-medium mt-0.5">Cleans up all system booking alerts and notifications</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={clearAllNotifs}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl shrink-0"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Clear All Alerts
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Bottom Save Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full bg-navy hover:bg-[#0e223d] text-white h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-navy/20 flex items-center justify-center gap-3 group"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Save size={20} className="group-hover:scale-110 transition-transform text-teal" />
              )}
              <span>Commit & Save All System Settings</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live In-App & Invoice Preview Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Bank Summary Card */}
          <Card className="rounded-[28px] border border-slate-100 shadow-md p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal font-black text-xs uppercase tracking-wider">
                <CreditCard size={16} /> Live Bank Box Preview
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewBankDetails);
                  toast.success('Bank details copied');
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-gray-600 transition-colors"
                title="Copy Bank Details"
              >
                <Copy size={13} />
              </button>
            </div>

            <div className="bg-navy p-4 rounded-2xl text-white space-y-2.5 font-mono text-[11px] leading-relaxed shadow-inner">
              <div className="text-[10px] text-teal font-bold uppercase tracking-widest border-b border-white/10 pb-1">
                Printed on Every Invoice
              </div>
              <p className="font-bold truncate text-white">{formData.bankName || 'BANK OF BARODA'}</p>
              <p className="text-slate-300 truncate">A/C: <span className="text-white font-bold">{formData.bankAccountNumber || '26450200001659'}</span></p>
              <p className="text-slate-300 truncate">IFSC: <span className="text-white font-bold">{formData.bankIfsc || 'BARB0DEOGHA'}</span></p>
              <p className="text-slate-300 truncate">NAME: <span className="text-white font-bold">{formData.bankAccountHolder || 'MUSTAK ANSARI'}</span></p>
              {formData.panNumber && (
                <p className="text-slate-300 truncate">PAN: <span className="text-teal font-bold">{formData.panNumber}</span></p>
              )}
              {formData.upiId && (
                <p className="text-slate-300 truncate">UPI: <span className="text-teal font-bold">{formData.upiId}</span></p>
              )}
            </div>

            <p className="text-[10px] text-gray-400 font-medium italic">
              * Any change saved in Bank Settings immediately reflects in new PDF downloads & Invoice Viewer.
            </p>
          </Card>

          {/* Live Company & Founder Badge */}
          <Card className="rounded-[28px] border border-slate-100 shadow-md p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 text-navy font-black text-xs uppercase tracking-wider">
              <Building2 size={16} className="text-teal" /> Live Branding Preview
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Layers className="text-teal" size={24} />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-navy text-xs uppercase truncate">{formData.companyName || 'ATOMIC SOLUTIONS'}</h4>
                <p className="text-[9px] font-bold text-teal uppercase tracking-widest truncate">{formData.companyTagline || 'We Bring Comfort Life'}</p>
                <p className="text-[9px] text-gray-400 font-medium truncate mt-0.5">{formData.phone || '+91 95822 68658'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-teal/[0.04] rounded-2xl border border-teal/10 space-y-1">
              <span className="text-[9px] font-black text-teal uppercase tracking-widest block">Founder Information</span>
              <p className="font-black text-navy text-xs">{formData.founderName || 'Mustak Ansari'}</p>
              <p className="text-[10px] text-gray-500 font-medium truncate">{formData.founderAddress || 'Binjha, Sonraithari, Deoghar, Jharkhand 814149'}</p>
            </div>
          </Card>

          {/* Compliance Card */}
          <Card className="rounded-[28px] border border-slate-100 shadow-md p-6 bg-white space-y-3">
            <div className="flex items-center gap-2 text-navy font-black text-xs uppercase tracking-wider">
              <FileText size={16} className="text-teal" /> Compliance Snapshot
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase">GSTIN</span>
                <span className="font-mono font-bold text-navy text-[11px]">{formData.ownerGSTIN || 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase">PAN</span>
                <span className="font-mono font-bold text-navy text-[11px]">{formData.panNumber || 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase">MSME</span>
                <span className="font-mono font-bold text-navy text-[11px]">{formData.msmeNumber || 'Not Set'}</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}