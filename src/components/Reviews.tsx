import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Star, ShieldCheck, Award } from 'lucide-react';
import { dataService } from '../services/firebaseService';
import { Review } from '../types';
import 'swiper/css';
import 'swiper/css/pagination';

const DEFAULT_REVIEWS = [
  {
    id: '1',
    userName: 'Rahul Sharma',
    userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    comment: 'Excellent service! Mustak and his team fixed our systems in no time. Highly professional and polite.',
    date: 'Oct 2025',
    isApproved: true
  },
  {
    id: '2',
    userName: 'Priya Singh',
    userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    comment: 'The interior work done by Atomic Solutions is top-notch. Our living room looks completely different now!',
    date: 'Nov 2025',
    isApproved: true
  },
  {
    id: '3',
    userName: 'Amit Kumar',
    userImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    rating: 4,
    comment: 'Reliable electrical work and transparent pricing. Happy with the results.',
    date: 'Dec 2025',
    isApproved: true
  }
];

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);

  useEffect(() => {
    const unsub = dataService.subscribe(
      'reviews', 
      (data) => {
        if (data.length > 0) {
          setReviews(data as Review[]);
        }
      },
      [{ field: 'isApproved', operator: '==', value: true }]
    );
    return () => unsub();
  }, []);

  return (
    <section id="reviews" className="py-24 bg-navy relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-gold text-sm font-black uppercase tracking-[0.3em] mb-4">Testimonials</h2>
          <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter mb-8 leading-none">
            CUSTOMER <span className="text-teal">REVIEWS</span>
          </h3>
        </div>

        <div className="mb-24">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2, spaceBetween: 30 },
              1024: { slidesPerView: 3, spaceBetween: 40 }
            }}
            className="pb-16"
          >
            {reviews.map((review) => (
              <SwiperSlide key={review.id}>
                <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-10 border border-white/10 h-full flex flex-col">
                  <div className="flex items-center space-x-4 mb-8">
                    <img 
                      src={review.userImage || 'https://via.placeholder.com/150'} 
                      alt={review.userName} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-teal"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tight">{review.userName}</h4>
                      <div className="flex space-x-1 text-gold mt-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-silver italic leading-relaxed mb-6 flex-1">"{review.comment}"</p>
                  <span className="text-[10px] font-black text-teal uppercase tracking-widest">{review.date}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-12 text-center pb-20">
          <Link 
            to="/reviews" 
            className="inline-flex items-center gap-3 px-10 h-16 bg-white text-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-teal hover:text-white hover:scale-105 active:scale-95 transition-all"
          >
            See More Reviews & Rate Us
          </Link>
        </div>

        {/* Trust Badges Section */}
        <div className="pt-20 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-teal flex items-center justify-center shrink-0">
               <ShieldCheck className="text-teal w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <div>
              <h4 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">100% Quality Guarantee</h4>
              <p className="text-silver text-sm font-medium">We never compromise on materials or craftsmanship. Your comfort is our priority.</p>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gold flex items-center justify-center shrink-0">
               <Award className="text-gold w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <div>
              <h4 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">Atomic Solutions Trust</h4>
              <p className="text-silver text-sm font-medium">Building long-lasting relationships based on honesty, integrity, and excellence.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
