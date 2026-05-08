import React from 'react';
import { Camera, Video, Play, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function Gallery() {
  const images = [
    { title: 'AC Installation', cat: 'HVAC', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800' },
    { title: 'Home Wiring', cat: 'ELECTRICAL', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=801' },
    { title: 'Kitchen Plumbing', cat: 'PLUMBING', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800' },
    { title: 'False Ceiling', cat: 'CONSTRUCTION', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=803' },
    { title: 'Tile Work', cat: 'CONSTRUCTION', url: 'https://images.unsplash.com/photo-1523413184401-2ac8e5033333?q=80&w=800' },
    { title: 'Building Project', cat: 'CONSTRUCTION', url: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=800' },
  ];

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">Our Work Portfolio</h2>
            <p className="text-gray-600 max-w-xl font-medium">Visual proof of our commitment to quality across HVAC, Electrical, Plumbing, and Construction.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
               <Camera size={16} /> 24+ Photos
             </div>
             <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
               <Video size={16} /> 8+ Videos
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="group relative rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all cursor-pointer aspect-square"
            >
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">{item.cat}</div>
                <h4 className="text-xl font-bold text-white mb-4">{item.title}</h4>
                <div className="flex gap-2">
                   <button className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors">
                      <ExternalLink size={14} /> Full View
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
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
