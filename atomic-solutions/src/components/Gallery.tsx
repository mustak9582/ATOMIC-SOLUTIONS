import React, { useState, useEffect } from 'react';
import { Camera, Video, Play, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/firebaseService';
import { AppSettings } from '../types';

export default function Gallery() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

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
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">Our Work Portfolio</h2>
            <p className="text-gray-600 max-w-xl font-medium">Visual proof of our commitment to quality across Maintenance and Construction.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
               <Camera size={16} /> {images.length} Photos
             </div>
             <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
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
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all cursor-pointer aspect-square bg-gray-100"
              >
                <img 
                  src={img} 
                  alt="Work Portfolio" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                  <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">REAL PROJECT</div>
                  <h4 className="text-xl font-bold text-white mb-4">Work Gallery</h4>
                </div>
              </motion.div>
            ))}

            {videos.map((video, idx) => (
              <motion.div
                key={`vid-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-red-100 transition-all cursor-pointer aspect-square bg-navy"
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
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
               <Camera size={48} className="mx-auto text-gray-300 mb-4" />
               <p className="text-gray-400 font-bold uppercase tracking-widest">No showcase media available yet.</p>
            </div>
          )}
        </div>
        
        <div className="mt-16 text-center">
           <a 
            href="https://www.youtube.com/@AtomicSolutions610" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-red-700 shadow-xl shadow-red-100 transition-all"
           >
             <Play size={24} fill="currentColor" />
             Watch On YouTube
           </a>
        </div>
      </div>
    </section>
  );
}
