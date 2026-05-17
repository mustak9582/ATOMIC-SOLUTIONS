import React from 'react';
import { SubCategory } from '../types';
import { ChevronRight } from 'lucide-react';

interface SubCategoryTableProps {
  subCategories: SubCategory[];
  whatsapp: string;
  serviceName: string;
  onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => void;
}

export default function SubCategoryTable({ subCategories, whatsapp, serviceName, onBook }: SubCategoryTableProps) {
  return (
    <div className="overflow-x-auto bg-[#0A192F] rounded-3xl border border-white/5 shadow-2xl">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-white/5 bg-[#112240]">
            <th className="py-5 px-6 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest w-1/3">Item</th>
            <th className="py-5 px-4 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">Labour Only</th>
            <th className="py-5 px-4 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">With Material</th>
            <th className="py-5 px-6 text-right text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {subCategories.map((sub) => {
            const labourMin = sub.labourMin || sub.minPrice;
            const labourMax = sub.labourMax || sub.maxPrice;
            const materialMin = sub.materialMin || sub.minPrice;
            const materialMax = sub.materialMax || sub.maxPrice;
            const displayUnit = sub.unit ? `/ ${sub.unit}` : '';

            return (
              <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-5 px-6">
                  <div className="font-bold text-white group-hover:text-[#64FFDA] transition-colors text-sm truncate max-w-[220px]">{sub.name}</div>
                  <div className="text-[9px] text-[#8892B0] font-bold uppercase tracking-widest mt-0.5 opacity-50">{serviceName}</div>
                </td>
                <td className="py-5 px-4">
                  {(labourMin > 0 || labourMax > 0) ? (
                    <div className="text-sm font-black text-white whitespace-nowrap">
                      ₹{labourMin}{labourMax > labourMin ? `-${labourMax}` : ''}
                      <span className="text-[9px] text-[#8892B0] ml-1">{displayUnit}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#8892B0] font-bold">Request Quote</span>
                  )}
                </td>
                <td className="py-5 px-4">
                  {(materialMin > 0 || materialMax > 0) ? (
                    <div className="text-sm font-black text-orange-500 whitespace-nowrap">
                      ₹{materialMin}{materialMax > materialMin ? `-${materialMax}` : ''}
                      <span className="text-[9px] text-[#8892B0] ml-1">{displayUnit}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-tighter">See Quote</span>
                  )}
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onBook(sub.name, 'LABOUR')}
                      className="px-4 py-2.5 bg-[#112240] hover:bg-white/10 text-white rounded-xl transition-all border border-[#233554] text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                    >
                      Labour
                    </button>
                    <button 
                      onClick={() => onBook(sub.name, 'MATERIAL')}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-white text-white hover:text-orange-500 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-orange-500/50"
                    >
                      Material
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
