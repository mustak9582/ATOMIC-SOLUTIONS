import React, { useState, useEffect } from 'react';
import { Camera, Video, Play, ExternalLink, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/firebaseService';
import { AppSettings } from '../types';

export default function Gallery() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribe('settings', (data) => {
      if (data && data.length > 0) {
        setAppSettings(data[0] as AppSettings);
      }
    });
    return unsub;
  }, []);

  const images = appSettings?.gallery || [];
  const videos = appSettings?.videos || [];

  return (
    <section id="gallery" className="py-24 bg-slate-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-navy sm:text-5xl mb-4">Our work portfolio</h2>
            <p className="text-slate-500 max-w-xl font-medium leading-relaxed">Visual proof of our commitment to quality across maintenance, HVAC, interiors, and construction.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
               <Camera size={16} /> {images.length} Photos
             </div>
             <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
               <Video size={16} /> {videos.length} Videos
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {images.map((img, idx) => (
              <motion.div
                key={`img-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedImage(img)}
                className="group relative rounded-lg overflow-hidden shadow-[0_20px_40px_-15px_rgba(15,23,42,0.12)] hover:shadow-[0_26px_55px_-24px_rgba(15,23,42,0.24)] transition-all cursor-pointer aspect-square bg-slate-100"
              >
                <img 
                  src={img} 
                  alt="Work Portfolio" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                  <div className="text-xs font-bold text-teal-100 uppercase tracking-widest mb-1">Real project</div>
                  <h4 className="text-xl font-bold text-white mb-4">Work gallery</h4>
                </div>
              </motion.div>
            ))}

            {videos.map((video, idx) => (
              <motion.div
                key={`vid-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (images.length + idx) * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-lg overflow-hidden shadow-[0_20px_40px_-15px_rgba(15,23,42,0.12)] hover:shadow-[0_26px_55px_-24px_rgba(15,23,42,0.24)] transition-all cursor-pointer aspect-square bg-navy"
              >
                <iframe 
                  src={`https://www.youtube.com/embed/${video.url}`} 
                  className="w-full h-full pointer-events-none" 
                  title={video.title}
                />
                <div className="absolute inset-0 bg-navy/60 group-hover:bg-navy/20 transition-all flex items-center justify-center">
                   <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                      <Play size={24} fill="currentColor" />
                   </div>
                </div>
                
                <div className="absolute bottom-6 left-6 right-6">
                  <h4 className="text-xl font-bold text-white line-clamp-2">{video.title}</h4>
                </div>
                
                <a 
                  href={`https://www.youtube.com/watch?v=${video.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute inset-0 z-10"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {images.length === 0 && videos.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-lg border border-dashed border-slate-200">
               <Camera size={48} className="mx-auto text-slate-300 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest">No showcase media available yet.</p>
            </div>
          )}
        </div>
        
        <div className="mt-16 text-center">
           <a 
            href="https://www.youtube.com/@AtomicSolutions610" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-navy text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-teal shadow-[0_18px_34px_-20px_rgba(15,23,42,0.55)] transition-all active:scale-[0.98]"
           >
             <Play size={24} fill="currentColor" />
             Watch On YouTube
           </a>
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-xl" 
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-xl"
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
