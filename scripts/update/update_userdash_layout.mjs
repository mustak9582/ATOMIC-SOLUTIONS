import fs from 'fs';

let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// 1. Change "BILL/CASH MEMO"
content = content.replace(
  "doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });",
  "doc.text(invoice.type === 'Invoice' ? 'TAX INVOICE' : 'ESTIMATE', pageWidth / 2, 15, { align: 'center' });"
);

// Push slogan down
content = content.replace(
  "doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 12, { align: 'right' });",
  "doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 15, { align: 'right' });"
);

// Push mobile down
// NOTE: UserDashboard might have a different string or `invoice.phone` etc.
// Let's do a more robust regex if needed.
content = content.replace(
  /doc\.text\(`MOB:-\s*\$\{.*?\}`, pageWidth - 15, 18, \{ align: 'right' \}\);/g,
  "doc.text(`MOB:- 9582268658`, pageWidth - 15, 21, { align: 'right' });"
);

// Push Company name down
content = content.replace(
  "doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 22, { align: 'center' });",
  "doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 25, { align: 'center' });"
);

// Push Address down
content = content.replace(
  /doc\.text\((.*?), pageWidth \/ 2, 28, \{ align: 'center' \}\);/g,
  "doc.text($1, pageWidth / 2, 31, { align: 'center' });"
);

// Fix logo dimensions
content = content.replace(
  /doc\.addImage\(.*? logoUrl .*?, 'PNG', 15, 13, 20, 20\);/g,
  "doc.addImage(window.location.origin + '/logo.png', 'PNG', 15, 10, 35, 14);"
);

// Fix black border from 10,10 to 5,5
content = content.replace(
  "doc.rect(10, 10, pageWidth - 20, pageHeight - 20);",
  "doc.rect(5, 5, pageWidth - 10, pageHeight - 10);"
);

fs.writeFileSync('src/components/UserDashboard.tsx', content);
console.log('Updated UserDashboard.tsx Layout');
