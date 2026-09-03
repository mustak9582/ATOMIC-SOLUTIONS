import React, { useState } from 'react';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Settings, ShieldCheck, LockIcon, ImageIcon, Layers, MessageCircle, Trash2, Save } from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';

export interface TabSettingsProps {
  user: any;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  clearAllNotifs: () => void;
  updateSettings: (settings: AppSettings) => void;
}

export function TabSettings({ user, appSettings, setAppSettings, clearAllNotifs, updateSettings }: TabSettingsProps) {
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  return (
    <Card className="rounded-[40px] border-none shadow-2xl shadow-gray-200/50 p-6 md:p-10 bg-slate-50/50">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-navy uppercase tracking-tighter flex items-center gap-4">
              <div className="p-3 bg-navy text-white rounded-2xl shadow-xl shadow-navy/20">
                <Settings size={32} />
              </div>
              Root Configuration
            </h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-20">System Administration • Version 2.4.1</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-navy uppercase tracking-widest">Environment: Production</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy">
                   <ShieldCheck size={28} />
                 </div>
                 <div>
                   <h3 className="font-black text-navy uppercase tracking-tighter">Identity & Security</h3>
                   <p className="text-[10px] font-black text-teal uppercase tracking-widest leading-none mt-1">Fortress Mode Active</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="p-4 bg-navy/[0.02] rounded-2xl border border-navy/5">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Operator</span>
                     <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">Authentic</Badge>
                   </div>
                   <p className="font-black text-navy text-sm truncate">{user?.email}</p>
                   <div className="flex items-center gap-2 mt-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Connected to Cloud Infrastructure</span>
                   </div>
                 </div>

                 <div className="p-4 bg-teal/[0.02] rounded-2xl border border-teal/5">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Clearance</span>
                     <span className="text-[10px] font-black text-teal uppercase tracking-widest italic">Tier 1: Master Admin</span>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mt-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-tight">
                       <ShieldCheck size={14} className="text-teal" />
                       Rules Verified
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-tight">
                       <LockIcon size={14} className="text-teal" />
                       Encrypted Session
                     </div>
                     </div>
                   </div>
                 </div>

                 <form onSubmit={handlePasswordChange} className="p-4 bg-teal/[0.02] rounded-2xl border border-teal/5 mt-4">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-black text-teal uppercase tracking-widest">Update Password</span>
                     <LockIcon size={14} className="text-teal" />
                   </div>
                   <div className="space-y-3">
                     <input
                       type="password"
                       placeholder="Enter new password"
                       value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)}
                       className="w-full bg-white border border-gray-100 rounded-lg px-4 py-3 font-semibold text-sm text-navy outline-none focus:border-teal transition-colors"
                     />
                     <Button
                       type="submit"
                       disabled={isUpdatingPassword}
                       className="w-full bg-teal hover:bg-[#0d9488] text-white font-bold h-10 rounded-lg shadow-sm"
                     >
                       {isUpdatingPassword ? 'Updating...' : 'Change Password'}
                     </Button>
                   </div>
                 </form>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-teal/5 flex items-center justify-center text-teal">
                   <ImageIcon size={22} />
                 </div>
                 <div>
                   <h3 className="font-black text-navy uppercase tracking-tighter">Branding & Logo</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Whitelabel Configuration</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Company Logo</label>
                   <div className="flex items-center gap-6">
                     <div className="w-24 h-24 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden group relative">
                       {appSettings?.logoUrl ? (
                         <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                       ) : (
                         <Layers className="text-gray-200" size={32} />
                       )}
                       <label className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onload = () => {
                               setAppSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                             };
                             reader.readAsDataURL(file);
                           }
                         }} />
                         <ImageIcon className="text-white" size={24} />
                       </label>
                     </div>
                     <div className="flex-1 space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                         Recommended: Transparent PNG or SVG.<br/>Max resolution: 512x512px.
                       </p>
                       <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl" onClick={() => setAppSettings(p => ({ ...p, logoUrl: '' }))}>Reset Logo</Button>
                     </div>
                   </div>
                 </div>
               </div>
             </section>
          </div>

          <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 flex flex-col h-full">
             <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <MessageCircle size={24} />
                </div>
                <div>
                   <h3 className="font-black text-navy uppercase tracking-tighter">Business Logistics</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Operational Data Hub</p>
                </div>
             </div>

             <div className="space-y-6 flex-1">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">WhatsApp Hub (with country code)</label>
                   <div className="relative">
                     <input 
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm text-navy outline-none focus:bg-white focus:border-green-400 transition-all font-mono"
                       value={appSettings?.whatsappNumber || ""}
                       onChange={(e) => setAppSettings({...appSettings, whatsappNumber: e.target.value})}
                       placeholder="91XXXXXXXXXX"
                     />
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-green-500 rounded-xl text-white">
                        <MessageCircle size={18} />
                     </div>
                   </div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 italic">Format: [91] [Phone Number] • No spaces</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Support Phone</label>
                     <input 
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                       value={appSettings?.phone || ""}
                       onChange={(e) => setAppSettings({...appSettings, phone: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Support Email</label>
                     <input 
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                       value={appSettings?.email || ""}
                       onChange={(e) => setAppSettings({...appSettings, email: e.target.value})}
                     />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Head Office Address</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all h-24 resize-none"
                    value={appSettings?.address || ""}
                    onChange={(e) => setAppSettings({...appSettings, address: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Business GSTIN</label>
                   <input 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all font-mono uppercase"
                     value={appSettings?.ownerGSTIN || ""}
                     onChange={(e) => setAppSettings({...appSettings, ownerGSTIN: e.target.value})}
                     placeholder="e.g. 20ABCDE1234F1Z5"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">YouTube Portfolio Link</label>
                   <input 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-xs text-navy outline-none focus:bg-white focus:border-teal transition-all"
                     value={appSettings?.youtubeUrl || ""}
                     onChange={(e) => setAppSettings({...appSettings, youtubeUrl: e.target.value})}
                     placeholder="https://youtube.com/..."
                   />
                </div>
             </div>
          </section>
        </div>

        <div className="flex flex-col md:flex-row gap-6 pt-6">
          <Button 
            variant="destructive"
            className="h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] px-10 flex items-center gap-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100"
            onClick={clearAllNotifs}
          >
            <Trash2 size={20} /> Nuclear Reset Notifications
          </Button>
          <Button 
            className="flex-1 bg-navy text-white h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-navy/30 group relative overflow-hidden"
            onClick={() => updateSettings(appSettings)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/20 to-teal/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center justify-center gap-4">
              <Save size={22} className="group-hover:scale-110 transition-transform" />
              Commit & Deploy System Updates
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}