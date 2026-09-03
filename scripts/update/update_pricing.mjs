import fs from 'fs';

let content = fs.readFileSync('src/components/Pricing.tsx', 'utf-8');

// Update state type
content = content.replace(
  "type: 'LABOUR' | 'MATERIAL' | 'GENERAL';",
  "type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH';\n    labourPrice?: number;\n    materialPrice?: number;"
);

// Update ServiceCardProps onBook type
content = content.replace(
  "onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL') => void;",
  "onBook: (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice?: number, materialPrice?: number) => void;"
);

// Update onBook invocations inside Pricing component mapping
content = content.replace(
  "onBook={(subName, type) => setBookingDetails({",
  "onBook={(subName, type, labourPrice, materialPrice) => setBookingDetails({"
);
content = content.replace(
  "type,",
  "type,\n                labourPrice,\n                materialPrice,"
);

// Update DirectBookingModal props
content = content.replace(
  "bookingType={bookingDetails?.type || 'GENERAL'}",
  "bookingType={bookingDetails?.type || 'GENERAL'}\n        labourPrice={bookingDetails?.labourPrice}\n        materialPrice={bookingDetails?.materialPrice}"
);

// Add 'BOTH' button rendering in ServiceCard
const labourBtnRegex = /onClick=\{\(\) => onBook\(sub\.name, 'LABOUR'\)\}/g;
content = content.replace(labourBtnRegex, "onClick={() => onBook(sub.name, 'LABOUR', labourMin, 0)}");

const materialBtnRegex = /onClick=\{\(\) => onBook\(sub\.name, 'MATERIAL'\)\}/g;
content = content.replace(materialBtnRegex, "onClick={() => onBook(sub.name, 'MATERIAL', 0, materialMin)}");

const generalBtnRegex = /onClick=\{\(\) => onBook\(sub\.name, 'GENERAL'\)\}/g;
content = content.replace(generalBtnRegex, "onClick={() => onBook(sub.name, 'GENERAL', 0, 0)}");

// Insert the BOTH button if both exist
// We will look for `{/* Material Option */}` and insert the BOTH option after it.
const materialBlockRegex = /\{\/\* Material Option \*\/\}([\s\S]*?)\{\/\* Fallback for no prices \*\/\}/g;

const bothBlock = `
                    {/* Both Option */}
                    {(labourMin > 0 || labourMax > 0) && (materialMin > 0 || materialMax > 0) && (
                        <div className="flex items-center gap-4 bg-navy/5 p-4 sm:p-5 rounded-lg border border-navy/10 flex-1 sm:flex-none sm:min-w-[200px] mb-2 shadow-sm transition-all hover:bg-navy/10 w-full sm:w-auto">
                        <div className="flex-1">
                          <span className="text-[9px] font-bold text-navy uppercase tracking-widest block mb-0.5">Both (Labour + Material)</span>
                          <div className="text-sm font-extrabold text-navy numeric">
                            Rs. {labourMin + materialMin} <span className="opacity-60 text-[10px] font-sans">{displayUnit}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onBook(sub.name, 'BOTH', labourMin, materialMin)}
                          className="px-4 py-2 bg-navy text-white rounded-lg flex items-center justify-center transition-all shadow-[0_16px_30px_-18px_rgba(10,25,47,0.8)] active:scale-[0.98] text-[9px] font-bold uppercase tracking-widest"
                        >
                          Book Both
                        </button>
                      </div>
                    )}

                    {/* Fallback for no prices */}`;

content = content.replace(materialBlockRegex, (match, p1) => {
  return `{/* Material Option */}${p1}${bothBlock}`;
});

fs.writeFileSync('src/components/Pricing.tsx', content);
console.log('Pricing.tsx updated');
