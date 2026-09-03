import fs from 'fs';

let content = fs.readFileSync('src/components/ServiceDetailPage.tsx', 'utf-8');

// Update bookingData state
content = content.replace(
  "const [bookingData, setBookingData] = useState<{ subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL', price: number } | null>(null);",
  "const [bookingData, setBookingData] = useState<{ subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', price: number, labourPrice?: number, materialPrice?: number } | null>(null);"
);

// Update handleBook definition
content = content.replace(
  "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL', price: number = 0) => {",
  "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice: number = 0, materialPrice: number = 0) => {"
);

content = content.replace(
  "setBookingData({ subName, type, price });",
  "setBookingData({ subName, type, price: labourPrice || materialPrice, labourPrice, materialPrice });"
);

// Update DirectBookingModal props at the bottom
content = content.replace(
  "bookingType={bookingData.type}\n          price={bookingData.price}",
  "bookingType={bookingData.type}\n          price={bookingData.price}\n          labourPrice={bookingData.labourPrice}\n          materialPrice={bookingData.materialPrice}"
);

// Insert BOTH button in ServiceDetailPage if applicable
const materialBtnRegex = /<button[\s\S]*?onClick=\{\(\) => handleBook\(sub\.name, 'MATERIAL', sub\.materialMin \|\| sub\.minPrice\)\}[\s\S]*?<\/button>/g;

const bothBlock = `
                                                {/* Both Option */}
                                                {(sub.labourMin || sub.minPrice) > 0 && (sub.materialMin || sub.minPrice) > 0 && (
                                                    <button 
                                                        onClick={() => handleBook(sub.name, 'BOTH', sub.labourMin || sub.minPrice, sub.materialMin || sub.minPrice)}
                                                        className="flex-1 sm:flex-none h-11 px-4 rounded-lg bg-navy text-white hover:bg-[#001f3f]/90 transition-all font-bold text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-[0.98]"
                                                    >
                                                        Both
                                                    </button>
                                                )}
`;

content = content.replace(materialBtnRegex, (match) => {
  return `${match}${bothBlock}`;
});

fs.writeFileSync('src/components/ServiceDetailPage.tsx', content);
console.log('ServiceDetailPage.tsx updated');
