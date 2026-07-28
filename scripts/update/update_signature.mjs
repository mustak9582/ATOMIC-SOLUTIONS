import fs from 'fs';

let content = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

const signatureArea = `
    // Signature Area
    doc.setFontSize(12);
    doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY + 2, { align: 'right' });
    
    try {
      doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 45, footerY + 4, 30, 12);
    } catch(e) {}
    
    doc.setFontSize(8);
    doc.text('CEO & FOUNDER: MUSTAK ANSARI', pageWidth - 15, footerY + 19, { align: 'right' });
    
    doc.setFontSize(9);
    doc.text('CUSTOMER SIGNATURE............................................................', pageWidth - 15, footerY + 32, { align: 'right' });
`;

content = content.replace(
  /\/\/ Signature Area\s*doc\.setFontSize\(12\);\s*doc\.text\('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY \+ 5, \{ align: 'right' \}\);\s*doc\.setFontSize\(9\);\s*doc\.text\('CUSTOMER SIGNATURE\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.', pageWidth - 15, footerY \+ 22, \{ align: 'right' \}\);/g,
  signatureArea
);

fs.writeFileSync('src/components/BillingCenter.tsx', content);
console.log('Updated BillingCenter.tsx with signature');
