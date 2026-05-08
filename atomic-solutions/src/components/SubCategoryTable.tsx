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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-navy/10">
            <th className="py-4 px-4 text-[10px] font-black text-teal uppercase tracking-widest">Service Item</th>
            <th className="py-4 px-4 text-[10px] font-black text-teal uppercase tracking-widest hidden sm:table-cell">Labour Rate</th>
            <th className="py-4 px-4 text-[10px] font-black text-teal uppercase tracking-widest">With Material</th>
            <th className="py-4 px-4 text-right text-[10px] font-black text-teal uppercase tracking-widest">Book</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {subCategories.map((sub) => {
            const labourMin = sub.labourMin || sub.minPrice;
            const labourMax = sub.labourMax || sub.maxPrice;
            const materialMin = sub.materialMin || sub.minPrice;
            const materialMax = sub.materialMax || sub.maxPrice;
            const displayUnit = sub.unit ? `/ ${sub.unit}` : '';

            return (
              <tr key={sub.id} className="hover:bg-teal/5 transition-colors group">
                <td className="py-5 px-4">
                  <div className="font-bold text-navy group-hover:text-teal transition-colors text-sm sm:text-base">{sub.name}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{serviceName}</div>
                  {/* Mobile Mobile Only Rate Display */}
                  <div className="sm:hidden mt-1 flex flex-col gap-1">
                    {labourMin > 0 && <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Labour: ₹{labourMin}{labourMax > labourMin ? ` - ₹${labourMax}` : ''}</span>}
                  </div>
                </td>
                <td className="py-5 px-4 hidden sm:table-cell">
                  {(labourMin > 0 || labourMax > 0) ? (
                    <div className="text-sm font-black text-navy">
                      ₹{labourMin}{labourMax > labourMin ? ` - ₹${labourMax}` : ''} <span className="opacity-50 text-[10px]">{displayUnit}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">On Request</span>
                  )}
                </td>
                <td className="py-5 px-4">
                  {(materialMin > 0 || materialMax > 0) ? (
                    <div className="text-sm font-black text-navy">
                      ₹{materialMin}{materialMax > materialMin ? ` - ₹${materialMax}` : ''} <span className="opacity-50 text-[10px]">{displayUnit}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Contact Us</span>
                  )}
                </td>
                <td className="py-5 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onBook(sub.name, 'LABOUR')}
                      className="p-3 bg-white hover:bg-navy text-navy hover:text-white rounded-xl transition-all border border-navy/10 shadow-sm hidden sm:flex items-center justify-center"
                      title="Labour Only"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => onBook(sub.name, 'MATERIAL')}
                      className="p-3 bg-teal text-white rounded-xl transition-all shadow-lg shadow-teal/20 hover:scale-105 active:scale-95 flex items-center justify-center"
                      title="Book Service"
                    >
                      <ChevronRight size={14} />
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
