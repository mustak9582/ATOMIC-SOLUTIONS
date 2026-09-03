import { jsPDF } from 'jspdf';
import fs from 'fs';

try {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.text('TEST INVOICE WITH SIGNATURE', 105, 20, { align: 'center' });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 50;
  
  doc.setFontSize(12);
  doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY + 2, { align: 'right' });
  
  // Try to add image from local file
  const imgData = fs.readFileSync('public/signature.png', 'base64');
  doc.addImage(`data:image/png;base64,${imgData}`, 'PNG', pageWidth - 45, footerY + 4, 30, 12);
  
  doc.setFontSize(8);
  doc.text('CEO & FOUNDER: MUSTAK ANSARI', pageWidth - 15, footerY + 19, { align: 'right' });
  
  doc.setFontSize(9);
  doc.text('CUSTOMER SIGNATURE............................................................', pageWidth - 15, footerY + 32, { align: 'right' });
  
  const pdfOutput = doc.output();
  fs.writeFileSync('C:\\Users\\Ahad\\.gemini\\antigravity\\brain\\93140787-d5fe-4a63-90fe-cfdc128fabad\\test_invoice.pdf', pdfOutput, 'binary');
  console.log('Successfully generated test invoice.');
} catch (error) {
  console.error('Failed to generate PDF:', error);
}
