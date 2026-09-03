import fs from 'fs';

// 1. BillingCenter.tsx
let bc = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

// Logo
bc = bc.replace(
  "doc.addImage(logoUrl, 'PNG', 15, 10, 35, 14);",
  "doc.addImage(logoUrl, 'PNG', 15, 10, 27, 18);"
);

// Signature
bc = bc.replace(
  "doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 45, footerY + 4, 30, 12);",
  "doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 35, footerY + 4, 18, 12);"
);

fs.writeFileSync('src/components/BillingCenter.tsx', bc);

// 2. UserDashboard.tsx
let ud = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// Logo
ud = ud.replace(
  "doc.addImage(window.location.origin + '/logo.png', 'PNG', 15, 10, 35, 14);",
  "doc.addImage(window.location.origin + '/logo.png', 'PNG', 15, 10, 27, 18);"
);

// Signature
ud = ud.replace(
  "doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 50, footerY + 8, 30, 12);",
  "doc.addImage(window.location.origin + '/signature.png', 'PNG', pageWidth - 35, footerY + 8, 18, 12);"
);

// Because I moved the signature right, wait:
// UserDashboard previously had `pageWidth - 50`, `footerY + 8`.
// Let's make sure it fits `footerY + 8` up to `footerY + 20`. 
// "CEO & FOUNDER" is at `footerY + 23`. So height 12 is perfect (8 + 12 = 20).
// And width 18 at `pageWidth - 35` goes up to `pageWidth - 17`. The right margin is ~15. So it aligns perfectly on the right.

fs.writeFileSync('src/components/UserDashboard.tsx', ud);

// 3. Test PDF script
let testPdf = fs.readFileSync('generate_test_pdf2.mjs', 'utf-8');

testPdf = testPdf.replace(
  "doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', 15, 10, 35, 14);",
  "doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', 15, 10, 27, 18);"
);

testPdf = testPdf.replace(
  "doc.addImage(`data:image/png;base64,${sigData}`, 'PNG', pageWidth - 45, footerY + 4, 30, 12);",
  "doc.addImage(`data:image/png;base64,${sigData}`, 'PNG', pageWidth - 35, footerY + 4, 18, 12);"
);

fs.writeFileSync('generate_test_pdf2.mjs', testPdf);

console.log('Aspect ratio fixed for Logo and Signature in all 3 files.');
