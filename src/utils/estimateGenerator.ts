import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { numberToWords, PDFInvoiceData } from './pdfGenerator';
import { logoBase64, signatureBase64 } from './pdfAssets';
import { autoDetectStateCode } from './stateCodeHelper';

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
  doc.text('Proforma Invoice', pageWidth / 2, currentY + 6, { align: 'center' });
  
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

  if (data.companyGSTIN) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN:', leftColX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.companyGSTIN, leftValX, currentY);
    currentY += 4;
  }

  if (data.msmeNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('MSME/Udyam:', leftColX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.msmeNumber, leftValX, currentY);
    currentY += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('State:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text('Jharkhand 20', leftValX, currentY);
  currentY += 8;

  // Customer Info & Document Info
  doc.setFontSize(9);
  const rightColX = pageWidth / 2 + 10; // 115mm
  const rightValX = rightColX + 32;
  const maxLeftValWidth = rightColX - margin - 30; // 75mm max width to prevent collision with right column

  let customerY = currentY;

  // Proforma Invoice For (Bill To) Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Proforma Invoice For (Bill To):', leftColX, customerY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Proforma Inv No.:', rightColX, customerY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.number || 'PI/26-27/01', rightValX, customerY);
  customerY += 4.5;

  // Customer Name & Date
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  const splitCustName = doc.splitTextToSize(data.customerName || '', maxLeftValWidth);
  doc.text(splitCustName, margin + 28, customerY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date ? new Date(data.date).toISOString().split('T')[0] : '', rightValX, customerY);
  customerY += Math.max(splitCustName.length * 4, 4.5);

  // Address & State of supply
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  const splitCustAddr = doc.splitTextToSize(data.customerAddress || '', maxLeftValWidth);
  doc.text(splitCustAddr, margin + 28, customerY);
  
  const stateSupplyStr = autoDetectStateCode(data.stateSupply || data.shippingState || data.customerState || 'Jharkhand 20');
  doc.setFont('helvetica', 'bold');
  doc.text('State of supply:', rightColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(stateSupplyStr, rightValX, customerY);
  customerY += Math.max(splitCustAddr.length * 4, 4.5);

  // Phone No.
  doc.setFont('helvetica', 'bold');
  doc.text('Phone No.:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerPhone || '', margin + 28, customerY);
  customerY += 4.5;

  // GSTIN (if present)
  if (data.customerGSTIN) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN:', leftColX, customerY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerGSTIN, margin + 28, customerY);
    customerY += 4.5;
  }

  // State
  const custStateStr = autoDetectStateCode(data.customerState || 'Jharkhand 20');
  doc.setFont('helvetica', 'bold');
  doc.text('State:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(custStateStr, margin + 28, customerY);
  customerY += 5;

  // Ship To Details (if present and different/provided)
  const hasShipTo = data.shippingName || data.shippingAddress;
  if (hasShipTo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Ship To:', leftColX, customerY);
    customerY += 4;
    doc.setFontSize(9);

    doc.setFont('helvetica', 'bold');
    doc.text('Name:', leftColX, customerY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.shippingName || data.customerName || '', leftValX + 15, customerY);
    customerY += 4;

    if (data.shippingAddress) {
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingAddress, leftValX + 15, customerY);
      customerY += 4;
    }

    if (data.shippingGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text('GSTIN:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingGSTIN, leftValX + 15, customerY);
      customerY += 4;
    }

    if (data.shippingState) {
      doc.setFont('helvetica', 'bold');
      doc.text('State:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(autoDetectStateCode(data.shippingState), leftValX + 15, customerY);
      customerY += 4;
    }
    customerY += 2;
  }

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
  let tableEndY = (doc as any).lastAutoTable.finalY;

  // Anchored Bottom Footer for Proforma Invoice (pushed lower down to eliminate blank space)
  const totalFooterHeight = 56;
  let footerBoxStartY = pageHeight - margin - totalFooterHeight;

  if (tableEndY > footerBoxStartY) {
    doc.addPage();
    footerBoxStartY = pageHeight - margin - totalFooterHeight;
  }

  // Extend vertical table grid lines seamlessly down to the top of the footer box
  const colWidths = [12, 65, 18, 15, 15, 25, 15, 25];
  let curColX = margin;
  const colPositions = [curColX];
  colWidths.forEach(w => {
    curColX += w;
    colPositions.push(curColX);
  });

  doc.setLineWidth(0.1);
  doc.setDrawColor(0, 0, 0);
  colPositions.forEach((x) => {
    doc.line(x, tableEndY, x, footerBoxStartY);
  });
  doc.line(margin, footerBoxStartY, margin + contentWidth, footerBoxStartY);

  const finalY = footerBoxStartY;

  // Footer: Amount in words & Terms on left, Totals & Signature on right
  const leftWidth = contentWidth * 0.54;
  const rightWidth = contentWidth * 0.42;
  const rightColStart = margin + contentWidth - rightWidth;

  // --- LEFT COLUMN ---
  // Words Box
  doc.setFillColor(...yellowColor);
  doc.rect(margin, finalY + 1.5, leftWidth, 5.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Proforma Invoice Amount in Words:', margin + 2, finalY + 5.2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const wordsText = doc.splitTextToSize(numberToWords(data.totalAmount), leftWidth - 4);
  doc.text(wordsText, margin + 2, finalY + 10.5);
  const wordsHeight = (Array.isArray(wordsText) ? wordsText.length : 1) * 3.5;

  // Terms Box - placed cleanly below Words Box
  const termsY = finalY + 11.5 + wordsHeight;
  doc.setFillColor(...yellowColor);
  doc.rect(margin, termsY, leftWidth, 5.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms and Conditions:', margin + 2, termsY + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const defaultTerms = '1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.';
  const termsLines = (data.terms || defaultTerms).split('\n').filter((l: string) => l.trim().length > 0);
  termsLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 2, termsY + 8 + (i * 3.5));
  });

  // --- RIGHT COLUMN ---
  // Totals
  let rightY = finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Sub Total:', rightColStart, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text('Rs. ' + (data.summary?.taxableAmount || data.totalAmount).toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
  rightY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Discount:', rightColStart, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text('Rs. ' + (data.summary?.discountAmount || 0).toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
  rightY += 4.5;

  const cgst = data.summary?.cgstAmount || 0;
  const sgst = data.summary?.sgstAmount || 0;
  const igst = data.summary?.igstAmount || 0;

  if (igst > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('IGST Amt:', rightColStart, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text('Rs. ' + igst.toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
    rightY += 4.5;
  } else if (cgst > 0 || sgst > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('CGST Amt:', rightColStart, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text('Rs. ' + cgst.toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
    rightY += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('SGST Amt:', rightColStart, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text('Rs. ' + sgst.toFixed(2), margin + contentWidth - 2, rightY, { align: 'right' });
    rightY += 4.5;
  }

  // Final Amount Box
  doc.setFillColor(...yellowColor);
  doc.rect(rightColStart, rightY - 2.5, rightWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Final Amount:', rightColStart + 2, rightY + 1.8);
  doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, rightY + 1.8, { align: 'right' });

  // Signature - positioned right below Final Amount on the right side
  const sigY = pageHeight - margin - 8;
  const sigImg = (data.signatureUrl && data.signatureUrl.startsWith('data:')) ? data.signatureUrl : signatureBase64;
  try {
    if (sigImg) doc.addImage(sigImg, 'PNG', pageWidth - margin - 40, sigY - 12, 35, 12);
  } catch (e) {}

  doc.setLineWidth(0.2);
  doc.line(pageWidth - margin - 45, sigY, pageWidth - margin, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Seal & Signature', pageWidth - margin - 22.5, sigY + 4.5, { align: 'center' });

  // Draw outer border around content area down to page bottom
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);

  return doc;
};
