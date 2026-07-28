import React, { useState } from 'react';
import { 
  AlertCircle, 
  Upload, 
  X, 
  CheckCircle2, 
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { cn, maskPhone, compressImage } from '../lib/utils';

interface Attachment {
  type: 'image' | 'video';
  url: string;
  name: string;
}

export default function ReportIssue({ onSuccess }: { onSuccess?: () => void }) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    
    // In this environment, we'll simulate upload by using placeholders or data URLs for now
    // In a real app, this would upload to Firebase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      
      try {
        let url: string;
        if (type === 'image') {
          url = await compressImage(file);
        } else {
          // For videos, for now we still use FileReader
          url = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        
        setAttachments(prev => [...prev, {
          type,
          url,
          name: file.name
        }]);
      } catch (err) {
        toast.error(`Failed to process ${file.name}`);
      }
    }
    
    setIsUploading(false);
    toast.success('Files attached successfully');
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please provide a title and description');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to report an issue');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.addDoc('reports', {
        userId: user.uid,
        userName: profile?.name || user.displayName || 'Anonymous',
        userPhone: profile?.phone || '',
        title,
        description,
        attachments,
        status: 'Pending',
        adminNote: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Also create a notification for admin
      await dataService.addDoc('notifications', {
        userId: 'admin', // General admin notification
        title: 'New Issue Reported',
        message: `${profile?.name || 'A customer'} reported a new issue: ${title}`,
        type: 'SYSTEM',
        read: false,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('Admin notification failed', err));

      toast.success('Your report has been submitted. We will look into it shortly.');
      setTitle('');
      setDescription('');
      setAttachments([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Report a Problem</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share images or videos of the issue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Issue Title</label>
          <input 
            type="text"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-navy outline-none focus:bg-white focus:border-red-400 transition-all"
            placeholder="e.g. AC making noise, Leakage in pipe..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Describe the problem</label>
          <textarea 
            rows={4}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium text-navy outline-none focus:bg-white focus:border-red-400 transition-all resize-none"
            placeholder="Please provide details about what happened and when..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Upload Proof (Images/Videos)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {attachments.map((file, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 group"
                >
                  {file.type === 'image' ? (
                    <img src={file.url} alt="upload" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy text-teal">
                      <VideoIcon size={32} />
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <label className="aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all group">
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={24} className="text-gray-300 group-hover:text-navy transition-colors" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center group-hover:text-navy">Add Media</span>
                </>
              )}
            </label>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full bg-navy hover:bg-red-500 text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20 transition-all flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} className="text-teal" /> Submit Report
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
