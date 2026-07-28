import fs from 'fs';

let content = fs.readFileSync('src/components/ServiceDetailPage.tsx', 'utf-8');

// Fix the handleBook signature
content = content.replace(
    "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL', price?: string | number) => {",
    "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice: string | number = 0, materialPrice: string | number = 0) => {"
);

// If there's another variant of handleBook signature, catch it just in case
content = content.replace(
    "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', price?: string | number) => {",
    "const handleBook = (subName: string, type: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH', labourPrice: string | number = 0, materialPrice: string | number = 0) => {"
);

fs.writeFileSync('src/components/ServiceDetailPage.tsx', content);
console.log('Fixed handleBook signature');
