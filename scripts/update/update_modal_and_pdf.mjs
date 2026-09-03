import fs from 'fs';

// 1. Update DirectBookingModal.tsx
let modal = fs.readFileSync('src/components/DirectBookingModal.tsx', 'utf-8');

modal = modal.replace(
  '<h4 className="text-sm font-black text-navy uppercase tracking-tight">Schedule via WhatsApp</h4>',
  '<h4 className="text-sm font-black text-navy uppercase tracking-tight">Invoice & Scheduling</h4>'
);

modal = modal.replace(
  'Booking confirm karne ke liye aapko WhatsApp pe redirect kiya jayega. Hamari team aapse contact karke visit date final karegi.',
  'To secure your booking, an official invoice will be generated. A 50% advance payment is required to proceed. Our team will connect with you via WhatsApp to assist with the payment and finalize your visit schedule.'
);

fs.writeFileSync('src/components/DirectBookingModal.tsx', modal);

// 2. Update BillingCenter.tsx
let bc = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

const contactText = `
  // Contact info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('For Support & Queries, WhatsApp us at: +91 95822 68658', pageWidth / 2, footerY + 38, { align: 'center' });
`;

if (!bc.includes('For Support & Queries')) {
  bc = bc.replace(
    "doc.text(`CUSTOMER: ${customerName?.toUpperCase() || ''}`, 15, footerY + 32);",
    "doc.text(`CUSTOMER: ${customerName?.toUpperCase() || ''}`, 15, footerY + 32);\n" + contactText
  );
  fs.writeFileSync('src/components/BillingCenter.tsx', bc);
}

// 3. Update UserDashboard.tsx
let ud = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

if (!ud.includes('For Support & Queries')) {
  ud = ud.replace(
    "doc.text(`CUSTOMER: ${invoice?.customerName?.toUpperCase() || ''}`, 15, footerY + 35);",
    "doc.text(`CUSTOMER: ${invoice?.customerName?.toUpperCase() || ''}`, 15, footerY + 35);\n" + contactText
  );
  fs.writeFileSync('src/components/UserDashboard.tsx', ud);
}

// 4. Update generate_test_pdf2.mjs
let testPdf = fs.readFileSync('generate_test_pdf2.mjs', 'utf-8');

if (!testPdf.includes('For Support & Queries')) {
  testPdf = testPdf.replace(
    "doc.text('CUSTOMER: JOHN DOE', 15, footerY + 32, { align: 'left' });",
    "doc.text('CUSTOMER: JOHN DOE', 15, footerY + 32, { align: 'left' });\n" + contactText
  );
  fs.writeFileSync('generate_test_pdf2.mjs', testPdf);
}

console.log('Updated Modal and added WhatsApp contact line to PDFs.');
