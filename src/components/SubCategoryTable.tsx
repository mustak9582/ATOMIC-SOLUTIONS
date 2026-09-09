import React from 'react';
import { SubCategory } from '../types';
import { formatPriceDisplay } from '../lib/utils';

interface SubCategoryTableProps {
  subCategories: SubCategory[];
  whatsapp: string;
  serviceName: string;
  onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice?: string | number, materialPrice?: string | number) => void;
}

export default function SubCategoryTable({ subCategories, whatsapp, serviceName, onBook }: SubCategoryTableProps) {
  return (
    <div className="overflow-x-auto bg-[#0A192F] rounded-3xl border border-white/5 shadow-2xl">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-white/5 bg-[#112240]">
            <th className="py-5 px-6 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest w-1/3">Item</th>
            <th className="py-5 px-4 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">Labour Charges</th>
            <th className="py-5 px-4 text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">With Material</th>
            <th className="py-5 px-6 text-right text-[10px] font-black text-[#64FFDA] uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {subCategories.map((sub) => {
            const hasLabour = (typeof sub.labourMin === 'number' && sub.labourMin > 0) || (typeof sub.labourMax === 'number' && sub.labourMax > 0);
            const hasMaterial = (typeof sub.materialMin === 'number' && sub.materialMin > 0) || (typeof sub.materialMax === 'number' && sub.materialMax > 0);
            const labourText = formatPriceDisplay(sub.labourMin, sub.labourMax, sub.unit);
            const materialText = formatPriceDisplay(sub.materialMin, sub.materialMax, sub.unit);

            return (
              <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-5 px-6">
                  <div className="font-bold text-white group-hover:text-[#64FFDA] transition-colors text-sm truncate max-w-[220px]">{sub.name}</div>
                  <div className="text-[9px] text-[#8892B0] font-bold uppercase tracking-widest mt-0.5 opacity-50">{serviceName}</div>
                </td>
                <td className="py-5 px-4">
                  {hasLabour ? (
                    <div className="text-sm font-black text-white whitespace-nowrap">
                      {labourText}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8892B0]/40 font-bold">—</span>
                  )}
                </td>
                <td className="py-5 px-4">
                  {hasMaterial ? (
                    <div className="text-sm font-black text-orange-500 whitespace-nowrap">
                      {materialText}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8892B0]/40 font-bold">—</span>
                  )}
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    {hasLabour && (
                      <button 
                        onClick={() => onBook(sub.name, 'LABOUR', sub.labourMin || sub.labourMax || 0)}
                        className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl transition-all border border-blue-500/30 text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm"
                        title="Book Labour Charges"
                      >
                        Labour Charges
                      </button>
                    )}
                    {hasMaterial && (
                      <button 
                        onClick={() => onBook(sub.name, 'MATERIAL', sub.materialMin || sub.materialMax || 0)}
                        className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-orange-500/30"
                        title="Book With Material"
                      >
                        With Material
                      </button>
                    )}
                    {!hasLabour && !hasMaterial && (
                      <button 
                        onClick={() => onBook(sub.name, 'GENERAL', sub.minPrice || 0)}
                        className="px-4 py-2.5 bg-white/10 hover:bg-[#64FFDA] text-white hover:text-[#0A192F] rounded-xl transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      >
                        Book Now
                      </button>
                    )}
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

