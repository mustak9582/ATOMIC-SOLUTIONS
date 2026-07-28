import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { numberToWords, PDFInvoiceData } from './pdfGenerator';
import { logoBase64, signatureBase64 } from './pdfAssets';

export const generateEstimatePDF = (data: PDFInvoiceData): jsPDF => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const yellowColor = [255, 215, 0] as [number, number, number];
  
  let currentY = margin;

  // Header Box - "Estimate Format"
  doc.setFillColor(...yellowColor);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Estimate Format', pageWidth / 2, currentY + 6, { align: 'center' });
  
  currentY += 12;

  // Logo on the right side of the company info
  const logoImg = (data.logoUrl && data.logoUrl.startsWith('data:')) ? data.logoUrl : logoBase64;
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', pageWidth - margin - 35, currentY, 30, 20);
    } catch (e) {}
  }

  // Company Info
  doc.setFontSize(9);
  const leftColX = margin;
  const leftValX = margin + 30;

  doc.setFont('helvetica', 'bold');
  doc.text('Company Name:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName || 'ATOMIC SOLUTIONS', leftValX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyAddress || '', leftValX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Phone No.:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyPhone || '', leftValX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Email ID:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyEmail || '', leftValX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('GSTIN:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyGSTIN || '', leftValX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('State:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text('Jharkhand', leftValX, currentY);
  currentY += 8;

  // Estimate For
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Estimate For:', leftColX, currentY);
  currentY += 5;

  // Customer Info & Document Info
  doc.setFontSize(9);
  const rightColX = pageWidth / 2 + 20;
  const rightValX = rightColX + 30;

  let customerY = currentY;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName || '', leftValX, customerY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Estimate No.:', rightColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.number || '', rightValX, customerY);
  customerY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerAddress || '', leftValX, customerY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date ? new Date(data.date).toISOString().split('T')[0] : '', rightValX, customerY);
  customerY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Phone No.:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerPhone || '', leftValX, customerY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('State of supply:', rightColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerState || 'Jharkhand - 20', rightValX, customerY);
  customerY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Email ID:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerEmail || '', leftValX, customerY);
  customerY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('GSTIN:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerGSTIN || '', leftValX, customerY);
  customerY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('State:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerState || 'Jharkhand - 20', leftValX, customerY);
  customerY += 8;

  // Table
  const tableData = data.items.map((item, idx) => [
    idx + 1,
    item.name + (item.description ? `\n${item.description}` : ''),
    item.hsn || '0',
    item.quantity,
    item.uom || 'Nos',
    item.rate.toFixed(2),
    `${item.gstPercent || 0}%`,
    item.amount.toFixed(2)
  ]);

  (doc as any).autoTable({
    startY: customerY,
    head: [['SL.\nNo.', 'Item Name', 'HSN/SA\nC', 'Quant\nity', 'Unit', 'Price/Unit\n(without tax)', 'GST', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: yellowColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 25 }
    },
    margin: { left: margin, right: margin }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setPage(pageCount);
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we have enough space for footer (approx 60mm)
  if (finalY + 60 > pageHeight - margin) {
    doc.addPage();
    finalY = margin + 10;
  }

  // Footer: Amount in words & Terms on left, Totals on right
  const leftWidth = contentWidth * 0.6;
  const rightWidth = contentWidth * 0.35;
  const rightColStart = margin + contentWidth - rightWidth;

  // Words Box
  doc.setFillColor(...yellowColor);
  doc.rect(margin, finalY, leftWidth, 6, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimate Amount in Words:', margin + 2, finalY + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.text(numberToWords(data.totalAmount), margin + 2, finalY + 11);

  // Totals Right Side
  let rightY = finalY + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total:', rightColStart, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text('Rs. ' + (data.summary?.taxableAmount || data.totalAmount).toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
  rightY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Discount:', rightColStart, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text('Rs. ' + (data.summary?.discountAmount || 0).toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
  rightY += 6;

  const totalGst = (data.summary?.cgstAmount || 0) + (data.summary?.sgstAmount || 0) + (data.summary?.igstAmount || 0);
  doc.setFont('helvetica', 'bold');
  doc.text('GST Total Amt:', rightColStart, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text('Rs. ' + totalGst.toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
  rightY += 8;

  // Final Amount Box
  doc.setFillColor(...yellowColor);
  doc.rect(rightColStart, rightY - 5, rightWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Final Amount:', rightColStart + 2, rightY);
  doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });

  // Terms Box
  const termsY = finalY + 18;
  doc.setFillColor(...yellowColor);
  doc.rect(margin, termsY, leftWidth, 6, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms and Conditions:', margin + 2, termsY + 4);
  
  doc.setFont('helvetica', 'normal');
  const defaultTerms = '1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.';
  const termsLines = (data.terms || defaultTerms).split('\n').filter((l: string) => l.trim().length > 0);
  termsLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 2, termsY + 11 + (i * 4));
  });

  // Signature
  const sigY = pageHeight - margin - 15;
  
  const sigImg = (data.signatureUrl && data.signatureUrl.startsWith('data:')) ? data.signatureUrl : signatureBase64;
  try {
    if (sigImg) doc.addImage(sigImg, 'PNG', pageWidth - margin - 40, sigY - 12, 35, 12);
  } catch (e) {}

  doc.setLineWidth(0.2);
  doc.line(pageWidth - margin - 45, sigY, pageWidth - margin, sigY);
  doc.setFont('helvetica', 'bold');
  doc.text('Seal & Signature', pageWidth - margin - 22.5, sigY + 5, { align: 'center' });

  // Draw border around the entire page content to match grid aesthetic if needed?
  // The provided image shows a thin border around the main container.
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);

  return doc;
};
