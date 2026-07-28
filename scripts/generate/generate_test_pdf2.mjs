import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';

try {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TAX INVOICE', pageWidth / 2, 15, { align: 'center' });
  doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 15, { align: 'right' });

  doc.setFontSize(22);
  doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('MOB:- 9582268658', pageWidth - 15, 21, { align: 'right' });

  doc.setFontSize(8);
  doc.text('96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149', pageWidth / 2, 31, { align: 'center' });

  // Add Logo
  try {
    const logoData = fs.readFileSync('public/logo.png', 'base64');
    doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', 15, 10, 27, 18);
  } catch(e) {}

  // SL NO and DATE
  doc.setFontSize(10);
  doc.text('SL NO:- INV-101', 15, 45);
  doc.text(`DATE:- ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 15, 45, { align: 'right' });

  doc.text('M/S JOHN DOE', 15, 55);
  doc.setFont('helvetica', 'normal');
  doc.text('..........................................................................................................................................................................', 24, 56);

  const tableData = [
    [{ content: 'LABOR CHARGES', colSpan: 5, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 8 } }],
    [1, 'AC Repair (Labor Only)', 1, '1,500', '1,500'],
    [{ content: 'MATERIAL CHARGES', colSpan: 5, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 8 } }],
    [2, 'AC Compressor', 1, '4,500', '4,500'],
    [{ content: 'GENERAL CHARGES', colSpan: 5, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 8 } }],
    [3, 'Fuel Charges', 1, '200', '200']
  ];

  doc.autoTable({
    startY: 63,
    head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
    body: tableData,
    theme: 'grid', 
    styles: { fontSize: 9, cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.2, font: 'helvetica' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = doc.lastAutoTable.finalY;
  const footerY = pageHeight - 50;
  
  // Signature Area
  doc.setFontSize(12);
  doc.text('FOR :- ATOMIC SOLUTIONS', pageWidth - 15, footerY + 2, { align: 'right' });
  
  try {
    const sigData = fs.readFileSync('public/signature.png', 'base64');
    doc.addImage(`data:image/png;base64,${sigData}`, 'PNG', pageWidth - 35, footerY + 4, 18, 12);
  } catch(e) {}
  
  doc.setFontSize(8);
  doc.text('CEO & FOUNDER: MUSTAK ANSARI', pageWidth - 15, footerY + 19, { align: 'right' });
  
  doc.setFontSize(9);
  doc.text('CUSTOMER: JOHN DOE', 15, footerY + 32, { align: 'left' });

  // Contact info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('For Support & Queries, WhatsApp us at: +91 95822 68658', pageWidth / 2, footerY + 38, { align: 'center' });


  // Bank Info
  doc.setFont('helvetica', 'bold');
  const bankLabels = [
    ['NAME', ': MUSTAK ANSARI'],
    ['BANK NAME', ': BANK OF BARODA'],
    ['IFSC CODE', ': BARB0DEOGHA'],
    ['A/C', ': 26450200001659'],
    ['PAN', ': CVVPA9010L']
  ];
  
  bankLabels.forEach((item, i) => {
    doc.text(item[0], 15, footerY + (i * 5));
    doc.text(item[1], 40, footerY + (i * 5));
  });

  // Bottom thin line border
  doc.setLineWidth(0.3);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  const pdfOutput = doc.output();
  fs.writeFileSync('C:\\Users\\Ahad\\Desktop\\test_invoice.pdf', pdfOutput, 'binary');
  console.log('Successfully generated test invoice on Desktop.');
} catch (error) {
  console.error('Failed to generate PDF:', error);
}
