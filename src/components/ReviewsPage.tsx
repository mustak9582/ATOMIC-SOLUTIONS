import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Star, 
  MessageSquare, 
  Camera, 
  Plus, 
  ShieldCheck, 
  ThumbsUp, 
  Award,
  CheckCircle2,
  X,
  Send,
  Loader2,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await dataService.getCollection('reviews', [
          { field: 'isApproved', operator: '==', value: true }
        ]);
        setReviews(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    setSubmitting(true);
    try {
      const newReview = {
        userId: user.uid,
        userName: profile?.name || user.displayName || 'Customer',
        userImage: user.photoURL || '',
        rating,
        comment,
        photoUrl,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        verified: true,
        isApproved: false
      };

      await dataService.addDoc('reviews', newReview);
      toast.success('Thank you! Your feedback is received and pending approval.');
      setIsModalOpen(false);
      setComment('');
      setRating(5);
      setPhotoUrl('');
    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = () => {
    // Simulate photo upload
    const dummyUrl = "https://images.unsplash.com/photo-1517646287270-a5a06502ff57?q=80&w=2070&auto=format&fit=crop";
    setPhotoUrl(dummyUrl);
    toast.info('Feature: In production, this would open your camera/gallery.');
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Hero Section */}
      <section className="bg-navy pt-32 pb-20 px-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        
        {/* Navigation Controls */}
        <div className="max-w-7xl mx-auto mb-12 flex justify-between items-center relative z-20">
          <motion.button 
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-teal font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-teal transition-all border border-white/10"
            title="Go to Home"
          >
            <Home size={20} />
          </motion.button>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-teal/30">
              <Star size={12} fill="currentColor" />
              Customer Feedback
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
              VOICE OF OUR <br/> <span className="text-teal">CLIENTS</span>
            </h1>
            <p className="max-w-2xl mx-auto text-white/60 font-bold uppercase tracking-widest text-[10px] pt-4">
              Real stories from real customers in Deoghar. We take pride in every service we deliver.
            </p>
          </motion.div>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="mt-12 h-16 px-10 rounded-2xl bg-teal text-navy font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal/30 hover:scale-105 active:scale-95 transition-all"
          >
            Leave Your Feedback
          </Button>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-navy rounded-[40px] p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl shadow-navy/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 backdrop-blur-md rounded-full text-teal text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-teal/30">
              <Star size={12} fill="currentColor" />
              Easy Review
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              SCAN TO <br/><span className="text-teal">GIVE FEEDBACK</span>
            </h2>
            <p className="text-white/60 font-medium text-sm leading-relaxed max-w-sm">
              Visiting our office? Scan this QR code with your phone camera to instantly jump to our review submission form.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-teal/20 border-8 border-navy relative z-10">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.host + '/reviews')}`} 
               alt="Review QR Code" 
               className="w-40 h-40 object-contain"
             />
             <div className="mt-4 text-center">
               <p className="text-navy font-black text-[10px] uppercase tracking-tighter">Atomic Solutions</p>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-navy/5 flex items-center gap-6 border border-gray-100">
            <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center text-navy">
              <ThumbsUp size={32} />
            </div>
            <div>
              <div className="text-3xl font-black text-navy">98%</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satisfaction</div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-navy/5 flex items-center gap-6 border border-gray-100">
            <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center text-navy">
              <Award size={32} />
            </div>
            <div>
              <div className="text-3xl font-black text-navy">{reviews.length}+</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Reviews</div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-navy/5 flex items-center gap-6 border border-gray-100">
            <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center text-navy">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="text-3xl font-black text-navy">100%</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Work</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-teal" size={40} />
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="break-inside-avoid bg-white p-8 rounded-[40px] shadow-xl shadow-gray-100 border border-gray-50 flex flex-col hover:shadow-2xl transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white text-lg font-black overflow-hidden shrink-0">
                    {review.userImage ? (
                      <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                    ) : review.userName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-navy text-sm uppercase tracking-tight truncate">{review.userName}</h4>
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={10} className="text-teal" />
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Verified Customer</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-xs font-black text-navy">{review.rating}</span>
                    <Star size={10} fill="#FFD700" className="text-[#FFD700]" />
                  </div>
                </div>

                <div className="relative mb-6">
                  <MessageSquare size={40} className="absolute -top-4 -left-4 text-gray-100 -z-10" />
                  <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>

                {review.photoUrl && (
                  <div className="mb-6 rounded-[24px] overflow-hidden border-4 border-gray-50">
                    <img src={review.photoUrl} alt="Service Results" className="w-full h-auto object-cover grayscale(0) hover:scale-105 transition-transform duration-500" />
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                     {new Date(review.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                   </div>
                   <div className="flex items-center gap-1 text-[9px] font-black text-teal uppercase tracking-widest bg-teal/5 px-3 py-1.5 rounded-full">
                     <CheckCircle2 size={10} />
                     Service Completed
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Review Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[40px] p-0 overflow-hidden border-none shadow-2xl font-sans">
          <form onSubmit={handleSubmit} className="flex flex-col">
             <div className="bg-navy p-8 text-white text-center relative">
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">How was your experience?</h3>
               <p className="text-teal font-black uppercase tracking-[0.2em] text-[10px] opacity-80">We value your honest feedback</p>
             </div>

             <div className="p-8 space-y-6 bg-white">
                {/* Star Rating */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Your Rating</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 transition-all hover:scale-110 ${rating >= s ? 'text-[#FFD700]' : 'text-gray-200'}`}
                      >
                        <Star size={32} fill={rating >= s ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Your Detailed Feedback</label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the service, quality, and behavior..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium text-navy outline-none focus:bg-white focus:border-teal transition-all resize-none shadow-inner"
                  />
                </div>

                {/* Photo Upload Simulation */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Work Photographs (Optional)</label>
                  {photoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-teal">
                      <img src={photoUrl} alt="Preview" className="w-full h-40 object-cover" />
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 bg-navy/80 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal hover:text-teal transition-all bg-gray-50/50"
                    >
                      <Camera size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Click to Upload Photos</span>
                    </button>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={submitting}
                  className="w-full h-16 rounded-2xl bg-navy hover:bg-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/10 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-teal" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Post Review Publicly
                    </>
                  )}
                </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
