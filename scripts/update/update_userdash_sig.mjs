import fs from 'fs';

let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

const signatureArea = `
    // Signature Area
    doc.setFontSize(12);
    doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 20, footerY + 5, { align: 'right' });
    
    try {
      doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 50, footerY + 8, 30, 12);
    } catch(e) {}
    
    doc.setFontSize(8);
    doc.text('CEO & FOUNDER: MUSTAK ANSARI', pageWidth - 20, footerY + 23, { align: 'right' });
    
    doc.setFontSize(9);
    doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 35, { align: 'right' });
`;

// It seems in UserDashboard.tsx there's: doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 20, footerY + 5, { align: 'right' });
// and doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 25, { align: 'right' });
// Let's do a more robust replace using a regex.

content = content.replace(
  /doc\.setFontSize\(12\);\s*doc\.text\('FOR :- ATOMIC SOLUTIONS', pageWidth - 20, footerY \+ 5, \{ align: 'right' \}\);\s*doc\.setFontSize\(9\);\s*doc\.text\('CUSTOMER SIGNATURE\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.', pageWidth - 20, footerY \+ 25, \{ align: 'right' \}\);/g,
  signatureArea
);

fs.writeFileSync('src/components/UserDashboard.tsx', content);
console.log('Updated UserDashboard.tsx signature');
