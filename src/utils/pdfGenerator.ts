import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { logoBase64, signatureBase64, qrCodeBase64 } from './pdfAssets';
const autoTable = (autoTablePkg as any).default || autoTablePkg;

export interface PDFInvoiceData {
  type: 'Invoice' | 'Estimate' | 'Simple Invoice' | 'Tax Invoice';
  number: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerState?: string;
  customerGSTIN?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingState?: string;
  shippingGSTIN?: string;
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
  msmeNumber?: string;
  customerEmail?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
  upiId?: string;
  upiString?: string;
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

export const generateInvoicePDF = async (data: PDFInvoiceData, options?: { includeQR?: boolean }): Promise<jsPDF> => {
  const isEstimate = data.type === 'Estimate';
  const includeQR = options?.includeQR !== false; // default true

  let dynamicQrCodeUrl = data.qrCodeUrl;
  if (includeQR && !isEstimate && !dynamicQrCodeUrl) {
    try {
      const QRCode = (await import('qrcode')).default;
      const targetUpi = data.upiId || 'mustakansari9582-3@okhdfcbank';
      const upiString = targetUpi.startsWith('upi://')
        ? targetUpi
        : `upi://pay?pa=${targetUpi}&pn=${encodeURIComponent(data.companyName || 'Atomic Solutions')}&am=${data.totalAmount}&cu=INR`;
      dynamicQrCodeUrl = await QRCode.toDataURL(upiString, { width: 150, margin: 1 });
    } catch (e) {
      console.error('Failed to generate dynamic QR code', e);
    }
  }

  if (isEstimate) {
    return (await import('./estimateGenerator')).generateEstimatePDF(data);
  }

  const doc = new jsPDF('p', 'mm', 'a4') as any;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  const headerHeight = 85; 

  const tableStartY = margin + headerHeight; 
  
  const isSimpleInvoice = data.type === 'Simple Invoice';

  let colW: any;
  let headCols: string[];
  
  if (isSimpleInvoice) {
    colW = { sr: 10, desc: 85, hsn: 15, uom: 15, qty: 15, rate: 20, tot: 30 };
    headCols = ['Sr', 'Goods & Service Description', 'HSN', 'Unit', 'Qty', 'Rate', 'Amount'];
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
    const docTitle = isSimpleInvoice ? 'INVOICE' : 'TAX INVOICE';
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
    doc.text(data.companyName || 'ATOMIC SOLUTIONS', pageWidth / 2, margin + 14, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('We Bring Comfort Life', pageWidth / 2, margin + 18, { align: 'center' });
    doc.text(data.companyAddress || '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149', pageWidth / 2, margin + 22, { align: 'center' });
    const cleanPhone = (data.companyPhone || '9582268658').replace(/^\+?91-?\s*/, '');
    doc.text(`Contact No.: +91 ${cleanPhone} | Email: ${data.companyEmail || 'atomichvacsolution@gmail.com'}`, pageWidth / 2, margin + 26, { align: 'center' });
    
    let topBoxY = margin + 30;
    if (data.ownerGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${data.ownerGSTIN}`, pageWidth / 2, margin + 30, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      topBoxY = margin + 34;
    }
    if (data.msmeNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`MSME/Udyam: ${data.msmeNumber}`, pageWidth / 2, topBoxY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      topBoxY += 4;
    }

    doc.line(margin, topBoxY, margin + contentWidth, topBoxY);

    const col1Width = 60;
    const col2Width = 60;
    const col3Width = contentWidth - col1Width - col2Width;
    const v1X = margin + col1Width;
    const v2X = v1X + col2Width;
    
    if (!isSimpleInvoice) {
      doc.line(v1X, topBoxY, v1X, tableStartY);
    }
    doc.line(v2X, topBoxY, v2X, tableStartY);

    // Bill To
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 25, 60);
    doc.text('Bill To', margin + 2, topBoxY + 4);
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
    
    if (!isSimpleInvoice && data.customerGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text('GSTIN:', margin + 2, stateY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(data.customerGSTIN, margin + 14, stateY + 5);
    }

    if (!isSimpleInvoice) {
      // Shipp To (Only for Invoice)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 25, 60);
      doc.text('Shipp To', v1X + 2, topBoxY + 4);
      doc.setTextColor(0, 0, 0);
      doc.text('Name:', v1X + 2, topBoxY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingName ?? data.customerName ?? '', v1X + 14, topBoxY + 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', v1X + 2, topBoxY + 15);
      doc.setFont('helvetica', 'normal');
      const splitShippingAddress = doc.splitTextToSize(data.shippingAddress ?? data.customerAddress ?? '', col2Width - 16);
      doc.text(splitShippingAddress, v1X + 14, topBoxY + 15);
      
      // Calculate max stateY based on the longer address to avoid overlap
      const shippingStateY = topBoxY + 15 + (splitShippingAddress.length * 4) + 2;
      const finalStateY = Math.max(stateY, shippingStateY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('State:', v1X + 2, finalStateY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingState ?? data.customerState ?? 'Jharkhand - 20', v1X + 14, finalStateY);
      
      const shippingGSTIN = data.shippingGSTIN ?? data.customerGSTIN;
      if (shippingGSTIN) {
        doc.setFont('helvetica', 'bold');
        doc.text('GSTIN:', v1X + 2, finalStateY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(shippingGSTIN, v1X + 14, finalStateY + 5);
      }
    }

    // Inv / Est Details
    const fields: { label: string; value: string }[] = [];
    fields.push({ label: '# Inv. No.:', value: data.number || 'AS/26-27/01' });
    fields.push({ label: 'Inv. Date:', value: data.date ? new Date(data.date).toISOString().split('T')[0] : '' });
    
    if (data.payMode) {
      fields.push({ label: 'Pay Mode:', value: data.payMode });
    }
    if (!isSimpleInvoice && data.buyerOrder) {
      fields.push({ label: 'Buyer Order:', value: data.buyerOrder });
    }
    if (!isSimpleInvoice && data.transport) {
      fields.push({ label: 'Transport:', value: data.transport });
    }
    if (!isSimpleInvoice && data.delivDate) {
      fields.push({ label: 'Deliv Date:', value: data.delivDate });
    }
    if (!isSimpleInvoice) {
      fields.push({ label: '', value: data.originalDup || 'Original Copy' });
      fields.push({ label: 'State Supply:', value: data.stateSupply || data.shippingState || data.customerState || 'Jharkhand - 20' });
    }

    const numRows = Math.ceil(fields.length / 2);
    // Keep row height fixed to at least 4 rows so it matches the left side properly
    const rowH = (tableStartY - topBoxY) / 4;
    const subColMid = v2X + (col3Width / 2);

    // Draw horizontal lines for the populated rows
    for (let i = 1; i < numRows; i++) {
       doc.line(v2X, topBoxY + i * rowH, margin + contentWidth, topBoxY + i * rowH);
    }
    // Draw vertical separator all the way down to maintain table structure
    if (fields.length > 1) {
       doc.line(subColMid, topBoxY, subColMid, tableStartY);
    }

    doc.setFontSize(7);
    for (let i = 0; i < fields.length; i++) {
       const rowIdx = Math.floor(i / 2);
       const colIdx = i % 2;
       const xBase = colIdx === 0 ? v2X : subColMid;
       const yBase = topBoxY + rowIdx * rowH + 4;
       
       if (fields[i].label) {
         doc.setFont('helvetica', 'bold');
         doc.text(fields[i].label, xBase + 1, yBase);
         if (i === 0) {
           doc.setFont('helvetica', 'bold');
           doc.setTextColor(20, 25, 60);
         } else {
           doc.setFont('helvetica', 'normal');
           doc.setTextColor(0, 0, 0);
         }
         doc.text(fields[i].value || '', xBase + 16, yBase);
         doc.setTextColor(0, 0, 0);
       } else {
         // Direct standalone value (e.g., "Original Copy", "Duplicate Copy", "Triplicate Copy")
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(20, 25, 60);
         doc.text(fields[i].value || '', xBase + 1, yBase);
         doc.setTextColor(0, 0, 0);
       }
    }
  };

  let tableData = [];
  if (isSimpleInvoice) {
    tableData = data.items.map((item, idx) => [
      idx + 1,
      item.name + (item.description ? `\n${item.description}` : ''),
      item.hsn || '',
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
    columnStyles: isSimpleInvoice ? {
      0: { cellWidth: colW.sr, halign: 'center' },
      1: { cellWidth: colW.desc },
      2: { cellWidth: colW.hsn, halign: 'center' },
      3: { cellWidth: colW.uom, halign: 'center' },
      4: { cellWidth: colW.qty, halign: 'center' },
      5: { cellWidth: colW.rate, halign: 'right' },
      6: { cellWidth: colW.tot, halign: 'right' }
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
  let tableEndY = (doc as any).lastAutoTable.finalY;

  // Fixed footer anchoring: footer ALWAYS sits at the bottom of the page
  const totalFooterHeight = isSimpleInvoice ? 75 : 93;
  let footerBoxStartY = pageHeight - margin - totalFooterHeight;

  // If items spill past footer start, create a new page for footer
  if (tableEndY > footerBoxStartY) {
    doc.addPage();
    drawHeader();
    tableEndY = tableStartY;
  }

  // Extend vertical table grid lines seamlessly down to the top of the footer box
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
  colX.forEach((x) => {
    doc.line(x, tableEndY, x, footerBoxStartY);
  });
  doc.line(margin, footerBoxStartY, margin + contentWidth, footerBoxStartY);
  const sumBoxX = margin + 120;
  const summaryHeight = isSimpleInvoice ? 45 : 60;
  
  // Left side: Bank Details or Notes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Our Bank Details', margin + 2, footerBoxStartY + 5);
  
  const bankLines = data.bankDetails.split('\n').filter(l => l.trim().length > 0);
  bankLines.forEach((line, i) => {
    if (line.includes(':')) {
      const parts = line.split(':');
      const label = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin + 2, footerBoxStartY + 10 + (i * 4));
      // Draw aligned colon
      doc.text(':', margin + 22, footerBoxStartY + 10 + (i * 4));
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 25, footerBoxStartY + 10 + (i * 4));
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
  
  if (isSimpleInvoice) {
    doc.text('Total Amount :', sumBoxX + 2, sY);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, sY, { align: 'right' });
  } else {
    // Dynamic summary: ONLY show rows that are active / non-zero!
    const summaryRows: { label: string; value: string }[] = [
      { label: 'Taxable Amount :', value: `Rs. ${data.summary.taxableAmount.toFixed(2)}` }
    ];

    if (data.summary.cgstAmount > 0) {
      summaryRows.push({ label: 'CGST Amt :', value: `Rs. ${data.summary.cgstAmount.toFixed(2)}` });
    }
    if (data.summary.sgstAmount > 0) {
      summaryRows.push({ label: 'SGST Amt :', value: `Rs. ${data.summary.sgstAmount.toFixed(2)}` });
    }
    if (data.summary.igstAmount > 0) {
      summaryRows.push({ label: 'IGST Amt :', value: `Rs. ${data.summary.igstAmount.toFixed(2)}` });
    }
    if (data.summary.freightCharges && data.summary.freightCharges > 0) {
      summaryRows.push({ label: 'Freight Charges :', value: `Rs. ${data.summary.freightCharges.toFixed(2)}` });
    }
    if (data.summary.discountAmount && data.summary.discountAmount > 0) {
      summaryRows.push({ label: 'Discount Amount (-):', value: `Rs. ${data.summary.discountAmount.toFixed(2)}` });
    }
    if (data.summary.roundOff && Math.abs(data.summary.roundOff) >= 0.01) {
      const sign = data.summary.roundOff > 0 ? '+' : '';
      summaryRows.push({ label: 'Round Off :', value: `Rs. ${sign}${data.summary.roundOff.toFixed(2)}` });
    }

    const rowLh = summaryRows.length > 5 ? 4.0 : 4.5;
    summaryRows.forEach((row, idx) => {
      const curY = sY + (idx * rowLh);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(row.label, sumBoxX + 2, curY);
      doc.setFont('helvetica', 'bold');
      doc.text(row.value, margin + contentWidth - 2, curY, { align: 'right' });
    });

    const totalDividerY = footerBoxStartY + 45;
    doc.line(sumBoxX, totalDividerY, margin + contentWidth, totalDividerY);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount :', sumBoxX + 2, footerBoxStartY + 51);
    doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, footerBoxStartY + 51, { align: 'right' });
    doc.line(margin, totalDividerY, sumBoxX, totalDividerY);
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
  const wordText = doc.splitTextToSize(numberToWords(data.totalAmount), sumBoxX - margin - 4);
  doc.text(wordText, margin + 2, wordY + 5);

  const decY = footerBoxStartY + summaryHeight + 5;

  // 1. Left Side: Declaration (constrained width to prevent overlapping other sections)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', margin + 2, decY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const defaultDeclaration = '1. Subject to Deoghar (Jharkhand) jurisdiction\n2. Terms & conditions are subject to our trade policy\n3. Our risk & responsibility ceases after the delivery of goods.\nE. & O.E.';
  const decLines = doc.splitTextToSize(data.declaration || defaultDeclaration, 72);
  decLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 2, decY + 4 + (i * 3.2));
  });

  // 2. Middle: Customer Signature (completely separate position, never overlaps Declaration)
  const custSigCenterX = margin + 92;
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
  doc.line(custSigCenterX - 18, decY + 12, custSigCenterX + 18, decY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Customer Signature', custSigCenterX, decY + 16, { align: 'center' });

  // 3. QR Code (placed nicely between customer signature and authorised signature)
  if (includeQR) {
    const qrImg = (dynamicQrCodeUrl && dynamicQrCodeUrl.startsWith('data:')) ? dynamicQrCodeUrl : qrCodeBase64;
    const qrX = margin + 122;
    const qrY = decY;
    try {
      if (qrImg) doc.addImage(qrImg, 'JPEG', qrX, qrY, 14, 14);
    } catch (e) {}
    doc.setFontSize(5.5);
    doc.text('SCAN TO PAY', qrX + 7, qrY + 16.5, { align: 'center' });
  }

  // 4. Right Side: For ATOMIC SOLUTIONS & Authorised Signatory
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('For, ATOMIC SOLUTIONS', margin + contentWidth - 2, decY, { align: 'right' });
  
  const sigImg = (data.signatureUrl && data.signatureUrl.startsWith('data:')) ? data.signatureUrl : signatureBase64;
  try {
    if (sigImg) doc.addImage(sigImg, 'PNG', margin + contentWidth - 30, decY + 2, 25, 10);
  } catch (e) {}
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Authorised Signatory', margin + contentWidth - 2, decY + 16, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const footerBottomY = Math.max(decY + 4 + (decLines.length * 3.2), decY + 19);
  const thX = pageWidth / 2 - 35;
  const thY = footerBottomY + 4;
  doc.rect(thX, thY, 70, 5);
  doc.text('Thank You For Business With US!', pageWidth / 2, thY + 3.5, { align: 'center' });

  return doc;
};
