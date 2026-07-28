import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { logoBase64, signatureBase64, qrCodeBase64 } from './pdfAssets';
const autoTable = (autoTablePkg as any).default || autoTablePkg;

export interface PDFInvoiceData {
  type: 'Invoice' | 'Estimate';
  number: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerState?: string;
  customerGSTIN?: string;
  ownerGSTIN?: string;
  payMode?: string;
  buyerOrder?: string;
  transport?: string;
  delivDate?: string;
  originalDup?: string;
  stateSupply?: string;
  items: {
    name: string;
    description?: string;
    hsn?: string;
    uom?: string;
    quantity: number;
    rate: number;
    taxable: number;
    gstPercent?: number;
    gstAmount?: number;
    amount: number;
  }[];
  summary: {
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    freightCharges: number;
    discountAmount: number;
    roundOff: number;
  };
  totalAmount: number;
  bankDetails: string;
  terms?: string;
  declaration?: string;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyGSTIN?: string;
  customerEmail?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
}

// Convert numbers to Indian words
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let res = convert(rupees) + 'Rupees';
  if (paise > 0) {
    res += ' and ' + convert(paise) + 'Paise';
  }
  return res + ' Only';
}

import { generateEstimatePDF } from './estimateGenerator';

export const generateInvoicePDF = (data: PDFInvoiceData): jsPDF => {
  const isEstimate = data.type === 'Estimate';

  if (isEstimate) {
    return generateEstimatePDF(data);
  }

  const doc = new jsPDF('p', 'mm', 'a4') as any;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  const headerHeight = 85; 

  const tableStartY = margin + headerHeight; 
  
  // isEstimate already declared above

  let colW: any;
  let headCols: string[];
  
  if (isEstimate) {
    colW = { sr: 10, desc: 100, uom: 15, qty: 15, rate: 20, tot: 30 };
    headCols = ['Sr', 'Goods & Service Description', 'Unit', 'Qty', 'Rate', 'Amount'];
  } else {
    colW = { sr: 8, desc: 62, hsn: 15, uom: 12, qty: 10, rate: 15, taxable: 18, gstP: 12, gstA: 18, tot: 20 };
    headCols = ['Sr', 'Goods & Service Description', 'HSN', 'Unit', 'Qty', 'Rate', 'Taxable', 'GST\n%', 'GST\nAmt.', 'Total'];
  }

  const getColX = () => {
    let x = margin;
    const arr = [x];
    Object.values(colW).forEach((w: any) => {
      x += w;
      arr.push(x);
    });
    return arr;
  };
  const colX = getColX();

  const drawHeader = () => {
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);

    // --- TOP HEADER ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const docTitle = isEstimate ? 'ESTIMATE' : 'TAX INVOICE';
    doc.text(docTitle, pageWidth / 2, margin + 4, { align: 'center' });
    doc.text(data.originalDup || 'Original Copy', margin + contentWidth - 2, margin + 4, { align: 'right' });
    
    // Top border box
    doc.rect(margin, margin, contentWidth, headerHeight);
    doc.line(margin, margin + 6, margin + contentWidth, margin + 6);

    const logoImg = (data.logoUrl && data.logoUrl.startsWith('data:')) ? data.logoUrl : logoBase64;
    if (logoImg) {
      try {
        doc.addImage(logoImg, 'PNG', margin + 5, margin + 8, 20, 15);
      } catch (e) {}
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 25, 60);
    doc.text('ATOMIC SOLUTIONS', pageWidth / 2, margin + 14, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('We Bring Comfort Life', pageWidth / 2, margin + 18, { align: 'center' });
    doc.text(data.companyAddress || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149', pageWidth / 2, margin + 22, { align: 'center' });
    doc.text(`Contact No.: +91-${data.companyPhone || '9582268658'} , Email: ${data.companyEmail || 'atomichvacsolutions@gmail.com'}`, pageWidth / 2, margin + 26, { align: 'center' });

    const topBoxY = margin + 30;
    doc.line(margin, topBoxY, margin + contentWidth, topBoxY);

    const col1Width = 60;
    const col2Width = 60;
    const col3Width = contentWidth - col1Width - col2Width;
    const v1X = margin + col1Width;
    const v2X = v1X + col2Width;
    
    doc.line(v1X, topBoxY, v1X, tableStartY);
    doc.line(v2X, topBoxY, v2X, tableStartY);

    // Bill To
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 25, 60);
    doc.text(isEstimate ? 'Estimate To' : 'Bill To', margin + 2, topBoxY + 4);
    doc.setTextColor(0, 0, 0);
    doc.text('Name:', margin + 2, topBoxY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerName || '', margin + 14, topBoxY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', margin + 2, topBoxY + 15);
    doc.setFont('helvetica', 'normal');
    const splitAddress = doc.splitTextToSize(data.customerAddress || '', col1Width - 16);
    doc.text(splitAddress, margin + 14, topBoxY + 15);
    
    const stateY = topBoxY + 15 + (splitAddress.length * 4) + 2;
    doc.setFont('helvetica', 'bold');
    doc.text('State:', margin + 2, stateY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerState || 'Jharkhand - 20', margin + 14, stateY);
    
    if (!isEstimate) {
      doc.setFont('helvetica', 'bold');
      doc.text('GSTIN:', margin + 2, stateY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(data.customerGSTIN || '', margin + 14, stateY + 5);
    }

    if (!isEstimate) {
      // Shipp To (Only for Invoice)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 25, 60);
      doc.text('Shipp To', v1X + 2, topBoxY + 4);
      doc.setTextColor(0, 0, 0);
      doc.text('Name:', v1X + 2, topBoxY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(data.customerName || '', v1X + 14, topBoxY + 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', v1X + 2, topBoxY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(splitAddress, v1X + 14, topBoxY + 15);
      
      doc.setFont('helvetica', 'bold');
      doc.text('State:', v1X + 2, stateY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.customerState || 'Jharkhand - 20', v1X + 14, stateY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('GSTIN:', v1X + 2, stateY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(data.customerGSTIN || '', v1X + 14, stateY + 5);
    }

    // Inv / Est Details
    const rowH = (tableStartY - topBoxY) / 4;
    
    // Draw horizontal lines for details section
    if (isEstimate) {
      // For estimate, we only need 2 rows of data, but we'll draw 1 line to separate them 
      // and keep the same row height as invoice.
      doc.line(v2X, topBoxY + rowH, margin + contentWidth, topBoxY + rowH);
    } else {
      doc.line(v2X, topBoxY + rowH, margin + contentWidth, topBoxY + rowH);
      doc.line(v2X, topBoxY + 2*rowH, margin + contentWidth, topBoxY + 2*rowH);
      doc.line(v2X, topBoxY + 3*rowH, margin + contentWidth, topBoxY + 3*rowH);
    }
    
    const subColMid = v2X + (col3Width / 2);
    doc.line(subColMid, topBoxY, subColMid, isEstimate ? (topBoxY + 2*rowH) : tableStartY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(isEstimate ? '# Est. No.:' : '# Inv. No.:', v2X + 1, topBoxY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(data.number, v2X + 15, topBoxY + 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text(isEstimate ? 'Est. Date:' : 'Inv. Date:', subColMid + 1, topBoxY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(data.date ? new Date(data.date).toISOString().split('T')[0] : '', subColMid + 15, topBoxY + 4);
    
    if (isEstimate) {
      doc.setFont('helvetica', 'bold');
      doc.text('Pay Mode:', v2X + 1, topBoxY + rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.payMode || 'UPI', v2X + 15, topBoxY + rowH + 4);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('Pay Mode:', v2X + 1, topBoxY + rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.payMode || 'UPI', v2X + 15, topBoxY + rowH + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Buyer Order:', subColMid + 1, topBoxY + rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.buyerOrder || '', subColMid + 15, topBoxY + rowH + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Transport:', v2X + 1, topBoxY + 2*rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.transport || '', v2X + 15, topBoxY + 2*rowH + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Deliv Date:', subColMid + 1, topBoxY + 2*rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.delivDate || '', subColMid + 15, topBoxY + 2*rowH + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Original/Dup:', v2X + 1, topBoxY + 3*rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.originalDup || 'Original Copy', v2X + 16, topBoxY + 3*rowH + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text('State Supply:', subColMid + 1, topBoxY + 3*rowH + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(data.stateSupply || 'Jharkhand - 20', subColMid + 16, topBoxY + 3*rowH + 4);
    }
  };

  let tableData = [];
  if (isEstimate) {
    tableData = data.items.map((item, idx) => [
      idx + 1,
      item.name + (item.description ? `\n${item.description}` : ''),
      item.uom || 'Nos',
      item.quantity,
      item.rate.toFixed(2),
      item.amount.toFixed(2)
    ]);
  } else {
    tableData = data.items.map((item, idx) => [
      idx + 1,
      item.name + (item.description ? `\n${item.description}` : ''),
      item.hsn || '',
      item.uom || 'Nos',
      item.quantity,
      item.rate.toFixed(2),
      item.taxable.toFixed(2),
      item.gstPercent ? `${item.gstPercent}%` : '',
      item.gstAmount ? item.gstAmount.toFixed(2) : '',
      item.amount.toFixed(2)
    ]);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [headCols],
    body: tableData,
    theme: 'plain',
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: { 
      fontStyle: 'bold', 
      halign: 'center',
      textColor: [0, 0, 0],
      fillColor: false
    },
    columnStyles: isEstimate ? {
      0: { cellWidth: colW.sr, halign: 'center' },
      1: { cellWidth: colW.desc },
      2: { cellWidth: colW.uom, halign: 'center' },
      3: { cellWidth: colW.qty, halign: 'center' },
      4: { cellWidth: colW.rate, halign: 'right' },
      5: { cellWidth: colW.tot, halign: 'right' }
    } : {
      0: { cellWidth: colW.sr, halign: 'center' },
      1: { cellWidth: colW.desc },
      2: { cellWidth: colW.hsn, halign: 'center' },
      3: { cellWidth: colW.uom, halign: 'center' },
      4: { cellWidth: colW.qty, halign: 'center' },
      5: { cellWidth: colW.rate, halign: 'right' },
      6: { cellWidth: colW.taxable, halign: 'right' },
      7: { cellWidth: colW.gstP, halign: 'center' },
      8: { cellWidth: colW.gstA, halign: 'right' },
      9: { cellWidth: colW.tot, halign: 'right' }
    },
    margin: { 
      top: 15, 
      bottom: 15,
      left: margin, 
      right: margin 
    },
    didDrawPage: (hookData: any) => {
      if (hookData.pageNumber === 1) {
        drawHeader();
      }
      
      const currentTopY = hookData.pageNumber === 1 ? tableStartY : 15;
      
      // Draw vertical lines for the table
      doc.setLineWidth(0.2);
      colX.forEach((x) => {
        doc.line(x, currentTopY, x, hookData.cursor.y);
      });
      // Draw bottom line of the table for the current page
      doc.line(margin, hookData.cursor.y, margin + contentWidth, hookData.cursor.y);
    },
    willDrawCell: (hookData: any) => {
      if (hookData.section === 'head') {
        doc.setLineWidth(0.2);
        doc.setDrawColor(0,0,0);
        doc.line(margin, hookData.cell.y + hookData.cell.height, margin + contentWidth, hookData.cell.y + hookData.cell.height);
        if (hookData.pageNumber > 1) {
          doc.line(margin, hookData.cell.y, margin + contentWidth, hookData.cell.y);
        }
      }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setPage(pageCount);
  let finalY = (doc as any).lastAutoTable.finalY;

  // We need 85 units of space for the final footer (summary, bank, signatures)
  const requiredSpace = isEstimate ? 60 : 85; 
  if (finalY + requiredSpace > pageHeight - margin) {
    doc.addPage();
    drawHeader();
    finalY = tableStartY;
    // Draw an empty table top border if it spilled to a completely new page just for the footer
    doc.line(margin, finalY, margin + contentWidth, finalY);
  }

  // Draw the Final Footer
  doc.setLineWidth(0.2);
  doc.line(margin, finalY, margin + contentWidth, finalY);

  const footerBoxStartY = finalY;
  const sumBoxX = margin + 120;
  const summaryHeight = isEstimate ? 45 : 60;
  
  // Left side: Bank Details or Notes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Our Bank Details', margin + 2, footerBoxStartY + 5);
  
  const bankLines = data.bankDetails.split('\n').filter(l => l.trim().length > 0);
  bankLines.forEach((line, i) => {
    if (line.includes(':')) {
      const parts = line.split(':');
      doc.setFont('helvetica', 'bold');
      doc.text(parts[0].trim() + ' :', margin + 2, footerBoxStartY + 10 + (i * 4));
      doc.setFont('helvetica', 'normal');
      doc.text(parts.slice(1).join(':').trim(), margin + 25, footerBoxStartY + 10 + (i * 4));
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(line, margin + 2, footerBoxStartY + 10 + (i * 4));
    }
  });

  // Right side: Summary
  doc.line(sumBoxX, footerBoxStartY, sumBoxX, footerBoxStartY + summaryHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', sumBoxX + 2, footerBoxStartY + 5);
  doc.text('AMOUNT', margin + contentWidth - 2, footerBoxStartY + 5, { align: 'right' });
  doc.line(sumBoxX, footerBoxStartY + 7, margin + contentWidth, footerBoxStartY + 7);
  
  doc.setFont('helvetica', 'normal');
  const sY = footerBoxStartY + 11;
  const lh = 4.5;
  
  if (isEstimate) {
    doc.text('Total Amount :', sumBoxX + 2, sY);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, sY, { align: 'right' });
  } else {
    doc.text('Taxable Amount :', sumBoxX + 2, sY);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.taxableAmount.toFixed(2), margin + contentWidth - 2, sY, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('CGST Amt :', sumBoxX + 2, sY + lh);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.cgstAmount.toFixed(2), margin + contentWidth - 2, sY + lh, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('SGST Amt :', sumBoxX + 2, sY + 2*lh);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.sgstAmount.toFixed(2), margin + contentWidth - 2, sY + 2*lh, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('IGST Amt :', sumBoxX + 2, sY + 3*lh);
    doc.setFont('helvetica', 'bold');
    doc.text(data.summary.igstAmount > 0 ? 'Rs. ' + data.summary.igstAmount.toFixed(2) : 'Rs. 0.00', margin + contentWidth - 2, sY + 3*lh, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Freight Packing Charges :', sumBoxX + 2, sY + 4*lh);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.freightCharges.toFixed(2), margin + contentWidth - 2, sY + 4*lh, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Discount Amount :', sumBoxX + 2, sY + 5*lh);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.discountAmount.toFixed(2), margin + contentWidth - 2, sY + 5*lh, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Round off :', sumBoxX + 2, sY + 6*lh);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.summary.roundOff.toFixed(2), margin + contentWidth - 2, sY + 6*lh, { align: 'right' });

    doc.line(sumBoxX, footerBoxStartY + 45, margin + contentWidth, footerBoxStartY + 45);
    doc.setFontSize(10);
    doc.text('Total Amount :', sumBoxX + 2, footerBoxStartY + 51);
    doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, footerBoxStartY + 51, { align: 'right' });
    doc.line(margin, footerBoxStartY + 45, sumBoxX, footerBoxStartY + 45);
  }

  // Draw the outer border of the summary/bank box
  doc.line(margin, footerBoxStartY, margin, footerBoxStartY + summaryHeight);
  doc.line(margin + contentWidth, footerBoxStartY, margin + contentWidth, footerBoxStartY + summaryHeight);
  doc.line(margin, footerBoxStartY + summaryHeight, margin + contentWidth, footerBoxStartY + summaryHeight);

  // Number to words
  const wordY = footerBoxStartY + summaryHeight - 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total in Word :', margin + 2, wordY);
  doc.setFont('helvetica', 'normal');
  doc.text(numberToWords(data.totalAmount), margin + 2, wordY + 5);

  const decY = footerBoxStartY + summaryHeight + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', margin + 2, decY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const defaultDeclaration = '1. Subject to Deoghar (Jharkhand) jurisdiction\n2. Terms & conditions are subject to our trade policy\n3. Our risk & responsibility ceases after the delivery of goods.\nE. & O.E.';
  const decLines = (data.declaration || defaultDeclaration).split('\n').filter((l: string) => l.trim().length > 0);
  decLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 2, decY + 4 + (i * 4));
  });

  // QR Code nicely placed left of the CEO signature
  const qrImg = (data.qrCodeUrl && data.qrCodeUrl.startsWith('data:')) ? data.qrCodeUrl : qrCodeBase64;
  const qrX = sumBoxX - 10;
  const qrY = decY;
  try {
    if (qrImg) doc.addImage(qrImg, 'JPEG', qrX, qrY, 18, 18);
  } catch (e) {}
  doc.setFontSize(6);
  doc.text('SCAN TO PAY', qrX + 9, qrY + 21, { align: 'center' });

  // Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('For, ATOMIC SOLUTIONS', margin + contentWidth - 2, decY, { align: 'right' });
  
  const sigImg = (data.signatureUrl && data.signatureUrl.startsWith('data:')) ? data.signatureUrl : signatureBase64;
  try {
    if (sigImg) doc.addImage(sigImg, 'PNG', margin + contentWidth - 30, decY + 3, 25, 10);
  } catch (e) {}
  
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', margin + contentWidth - 2, decY + 16, { align: 'right' });
  
  // Customer Signature
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Signature', margin + 40, decY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName || '', margin + 40, decY + 21, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const thX = pageWidth / 2 - 30;
  const thY = pageHeight - margin - 5;
  doc.rect(thX, thY, 60, 5);
  doc.text('Thank You For Business With US!', pageWidth / 2, thY + 3.5, { align: 'center' });

  return doc;
};
