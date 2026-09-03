import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send } from 'lucide-react';
import { Button } from './ui/button';
import { dataService } from '../services/firebaseService';
import { Review } from '../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    setIsSubmitting(true);
    try {
      const newReview: Omit<Review, 'id'> = {
        userName: name,
        rating,
        comment,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        isApproved: false // Require admin approval
      };
      await dataService.addDoc('reviews', newReview);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setName('');
        setComment('');
        setRating(5);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-navy transition-colors bg-gray-50 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="p-10">
              <div className="text-center mb-8">
                <span className="text-[10px] font-black text-teal uppercase tracking-[0.3em] mb-2 block">Tell us how we did</span>
                <h3 className="text-3xl font-black text-navy uppercase tracking-tighter">LEAVE A <span className="text-teal">REVIEW</span></h3>
              </div>

              {isSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="text-green-500 fill-current" size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-navy mb-2">THANK YOU!</h4>
                  <p className="text-gray-500 font-medium">Your review has been submitted and is pending approval.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-gold fill-current' : 'text-gray-200'}`}
                      >
                        <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-4">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-navy focus:ring-2 focus:ring-teal/20 transition-all"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-4">Your Experience</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-navy focus:ring-2 focus:ring-teal/20 transition-all resize-none"
                      placeholder="Share your feedback..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <Button
                    disabled={isSubmitting}
                    className="w-full bg-navy hover:bg-teal text-white font-black rounded-2xl h-16 shadow-xl shadow-navy/20 uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                  >
                    {isSubmitting ? 'submitting...' : (
                      <>
                        SUBMIT REVIEW
                        <Send size={18} />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
