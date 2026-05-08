import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MessageCircle } from 'lucide-react';
import { Service, SubCategory } from '../types';
import SubCategoryTable from './SubCategoryTable';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  whatsapp: string;
  onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => void;
}

export default function CategoriesModal({ isOpen, onClose, service, whatsapp, onBook }: CategoriesModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!service) return null;

  const filteredSubs = (service.subCategories || []).filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A192F]/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-[#112240] rounded-[48px] border border-[#233554] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-[#233554] bg-[#112240] z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[#64FFDA] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{service.category} Service</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">{service.name} Rate List</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8892B0]" size={18} />
                <input 
                  type="text"
                  placeholder="Search categories (e.g. PCB Repair, Gas Charging...)"
                  className="w-full bg-[#0A192F] border border-[#233554] rounded-2xl pl-12 pr-4 py-4 text-white font-medium focus:ring-2 focus:ring-[#64FFDA]/20 outline-none transition-all placeholder:text-[#8892B0]/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="hidden lg:block">
                <SubCategoryTable 
                  subCategories={filteredSubs} 
                  whatsapp={whatsapp} 
                  serviceName={service.name} 
                  onBook={onBook}
                />
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredSubs.map((sub) => {
                  const labourMin = sub.labourMin || sub.minPrice;
                  const labourMax = sub.labourMax || sub.maxPrice;
                  const materialMin = sub.materialMin || sub.minPrice;
                  const materialMax = sub.materialMax || sub.maxPrice;
                  const displayUnit = sub.unit ? `/ ${sub.unit}` : '';

                  return (
                    <div key={sub.id} className="p-6 bg-[#0A192F]/60 rounded-3xl border border-[#233554]">
                      <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight">{sub.name}</h3>
                      
                      <div className="grid grid-cols-1 gap-3 mb-6">
                        <div className="flex justify-between items-center p-3 bg-[#008080] rounded-xl border border-white/20 shadow-sm">
                          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Labour</span>
                          <span className="text-sm font-black text-white">₹{labourMin}{labourMax > labourMin ? ` - ₹${labourMax}` : ''} {displayUnit}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-teal/10 rounded-xl border border-teal/20">
                          <span className="text-[10px] font-black text-teal uppercase tracking-widest">Material</span>
                          <span className="text-sm font-black text-white">₹{materialMin}{materialMax > materialMin ? ` - ₹${materialMax}` : ''} {displayUnit}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => onBook(sub.name, 'LABOUR')}
                          className="flex-1 bg-[#112240] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-[#233554]"
                        >
                          Labour
                        </button>
                        <button 
                          onClick={() => onBook(sub.name, 'MATERIAL')}
                          className="flex-1 bg-[#64FFDA] text-[#0A192F] py-3 rounded-xl font-bold text-xs uppercase tracking-widest"
                        >
                          Full
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSubs.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-[#64FFDA] opacity-20 mb-4 flex justify-center">
                    <Search size={64} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase mb-2">No Categories Found</h3>
                  <p className="text-[#8892B0]">Try searching with a different term.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[#233554] bg-[#0A192F]/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#64FFDA]/10 rounded-full flex items-center justify-center text-[#64FFDA]">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-[#8892B0] uppercase tracking-[0.2em]">Contact Expert</div>
                  <div className="text-lg font-black text-white tracking-tight">Need custom pricing?</div>
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${whatsapp}?text=Hello Atomic Solutions, I need a custom quote for specialized work.`, '_blank')}
                className="w-full md:w-auto bg-[#64FFDA] hover:bg-[#64FFDA]/90 text-[#0A192F] h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-[#64FFDA]/20"
              >
                Chat on WhatsApp
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
