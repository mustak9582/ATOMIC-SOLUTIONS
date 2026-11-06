import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { numberToWords, PDFInvoiceData } from './pdfGenerator';
import { logoBase64 } from './pdfAssets';
import { autoDetectStateCode } from './stateCodeHelper';

const autoTable = (autoTablePkg as any).default || autoTablePkg;

/**
 * Generates an executive corporate Quotation / Commercial Rate Proposal PDF.
 * Strict Structure:
 * 1. Top Left: Logo first (~8.5mm, matching font), followed immediately by ATOMIC SOLUTIONS and 'Contracting Services' underneath.
 * 2. Top Right: Phone No. first (top), Email, MSME, GSTIN, and Address at the bottom (all right-aligned, zero overlap).
 * 3. Commercial Rate Quotation Title Banner & Two-Column Client/Validity Card.
 * 4. Line Items Table:
 *    - Columns: #, Item / Service, Description & Scope of Work, HSN/SAC, Qty, Unit, Rate (INR), Amount (INR)
 *    - NO GST column in table (moved to summary above Grand Total)
 *    - HSN/SAC (18mm) and Unit (15mm) never wrap lines
 *    - Only actual services entered by user are printed (NO fake blank rows)
 *    - Seamless vertical column grid lines extend all the way down to the bottom footer box (exactly like in Tax / Proforma Invoice)
 * 5. Anchored Bottom Footer Section:
 *    - Left: Amount in Words & Commercial Terms & Proposal Guidelines
 *    - Right: Sub Total (INR), GST Tax (directly above Grand Total), Grand Total (Navy highlight box), and 'ISSUED BY: ATOMIC SOLUTIONS'
 * 6. Page Footer: Bank Transfer Details & Enterprise Portal Notice.
 */
export const generateQuotationPDF = (data: PDFInvoiceData): jsPDF => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const navyColor = [0, 31, 63] as [number, number, number];
  const tealColor = [0, 180, 130] as [number, number, number];
  const slateDark = [33, 37, 41] as [number, number, number];
  const textMuted = [100, 116, 139] as [number, number, number];
  
  let currentY = margin;

  // ─────────────────────────────────────────────────────────────
  // 1. TOP CORPORATE ACCENT BAR (Slim Navy & Teal Line)
  // ─────────────────────────────────────────────────────────────
  doc.setFillColor(...navyColor);
  doc.rect(margin, currentY, contentWidth, 2.5, 'F');
  doc.setFillColor(...tealColor);
  doc.rect(margin, currentY + 2.5, contentWidth, 0.8, 'F');
  currentY += 6;

  // ─────────────────────────────────────────────────────────────
  // 2. COMPANY HEADER:
  //    - Left Side: LOGO first (slightly larger than font, ~8.5mm),
  //      then ATOMIC SOLUTIONS, then 'Contracting Services'
  //    - Right Side:
  //      1. Phone No. (Top)
  //      2. Email
  //      3. MSME/Udyam
  //      4. GSTIN
  //      5. Address (Bottom)
  // ─────────────────────────────────────────────────────────────
  const headerStartY = currentY;

  // A. LEFT SIDE: Logo & Company Branding
  const logoWidth = 9;
  const logoHeight = 8.5;
  const logoX = margin;
  const logoY = headerStartY + 0.5;

  const logoImg = (data.logoUrl && data.logoUrl.startsWith('data:')) ? data.logoUrl : logoBase64;
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.warn('Logo render failed:', e);
    }
  }

  // Company Name right next to the Logo (matching scale, no overlap)
  const brandNameX = logoX + logoWidth + 2.5;
  const companyTitle = data.companyName || 'ATOMIC SOLUTIONS';

  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(companyTitle, brandNameX, headerStartY + 5.5);

  // Tagline directly underneath: 'Contracting Services'
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 140, 110);
  doc.text('Contracting Services', brandNameX, headerStartY + 9.8);

  // B. RIGHT SIDE: Company Contact & Legal Credentials
  // Order: 1. Phone -> 2. Email -> 3. MSME -> 4. GSTIN -> 5. Address
  const rightEdgeX = pageWidth - margin;
  let rightTextY = headerStartY + 1;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);

  // 1. Phone No.
  const cleanPhone = (data.companyPhone || '95822 68658').replace(/^\+?91-?\s*/, '+91 ');
  doc.text(`Phone: ${cleanPhone}`, rightEdgeX, rightTextY, { align: 'right' });
  rightTextY += 3.7;

  // 2. Email
  const emailStr = data.companyEmail || 'atomichvacsolution@gmail.com';
  doc.text(`Email: ${emailStr}`, rightEdgeX, rightTextY, { align: 'right' });
  rightTextY += 3.7;

  // 3. MSME
  const msmeVal = data.msmeNumber || '';
  if (msmeVal) {
    doc.text(`MSME/Udyam: ${msmeVal}`, rightEdgeX, rightTextY, { align: 'right' });
    rightTextY += 3.7;
  }

  // 4. GSTIN (Bold Navy)
  const gstinVal = data.companyGSTIN || data.ownerGSTIN || '';
  if (gstinVal) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyColor);
    doc.text(`GSTIN: ${gstinVal}`, rightEdgeX, rightTextY, { align: 'right' });
    rightTextY += 3.7;
  }

  // 5. Address (Bottom of the right stack)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  const compAddr = data.companyAddress || 'Binjha, Post Dumaria, P.S Sonaraithari, Dist Deoghar';
  const splitCompAddr = doc.splitTextToSize(`Address: ${compAddr}`, 75);
  doc.text(splitCompAddr, rightEdgeX, rightTextY, { align: 'right' });
  rightTextY += Math.max(splitCompAddr.length * 3.5, 3.8);

  // Calculate clean spacing after header
  currentY = Math.max(headerStartY + 13, rightTextY + 1.5);

  // Thin divider line under header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 3.5;

  // ─────────────────────────────────────────────────────────────
  // 3. QUOTATION TITLE BANNER (Clean & Minimal 'QUOTATION')
  // ─────────────────────────────────────────────────────────────
  const bannerHeight = 7.5;
  doc.setFillColor(...navyColor);
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 1.2, 1.2, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('QUOTATION', pageWidth / 2, currentY + 5.2, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.originalDup || 'Original Copy', margin + contentWidth - 4, currentY + 5.2, { align: 'right' });
  currentY += bannerHeight + 3.5;

  // ─────────────────────────────────────────────────────────────
  // 4. CLIENT DETAILS & QUOTATION METADATA (Two-Column Box)
  // ─────────────────────────────────────────────────────────────
  const infoBoxY = currentY;
  const infoBoxHeight = 35;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 224, 233);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, infoBoxY, contentWidth, infoBoxHeight, 2, 2, 'FD');

  const colLeftX = margin + 5;
  const colRightX = pageWidth / 2 + 5;

  // Left Column: Client Info
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('QUOTATION ISSUED TO (CLIENT):', colLeftX, infoBoxY + 5.5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.customerName || 'Valued Corporate Client', colLeftX, infoBoxY + 11);

  let clientY = infoBoxY + 15.5;
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);

  if (data.kindAttn) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Kind Attn: ${data.kindAttn}`, colLeftX, clientY);
    clientY += 3.8;
  }

  if (data.customerAddress) {
    doc.setFont('helvetica', 'normal');
    const splitAddr = doc.splitTextToSize(data.customerAddress, 85);
    doc.text(splitAddr, colLeftX, clientY);
    clientY += Math.min(splitAddr.length * 3.6, 7.5);
  }

  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, colLeftX, clientY);
    clientY += 3.6;
  }
  if (data.customerGSTIN) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyColor);
    doc.text(`Client GSTIN: ${data.customerGSTIN}`, colLeftX, clientY);
  }

  // Right Column: Quotation Metadata & Validity
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Quotation No.:', colRightX, infoBoxY + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(data.number || 'QT/26-27/01', colRightX + 28, infoBoxY + 5.5);

  doc.setFontSize(7.8);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Issue:', colRightX, infoBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  doc.text(formattedDate, colRightX + 28, infoBoxY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Rate Validity:', colRightX, infoBoxY + 17.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 150, 90);
  doc.text(data.validUntil || '30 Days', colRightX + 28, infoBoxY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Place of Supply:', colRightX, infoBoxY + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  const posStr = autoDetectStateCode(data.stateSupply || data.customerState || 'Jharkhand 20');
  doc.text(posStr, colRightX + 28, infoBoxY + 23.5);

  if (data.buyerOrder) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('Client Ref / RFQ:', colRightX, infoBoxY + 29.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateDark);
    doc.text(data.buyerOrder, colRightX + 28, infoBoxY + 29.5);
  }

  currentY = infoBoxY + infoBoxHeight + 3.5;

  // ─────────────────────────────────────────────────────────────
  // 5. SUBJECT / WORK REFERENCE LINE (If Provided)
  // ─────────────────────────────────────────────────────────────
  if (data.subject) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 6.5, 1, 1, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyColor);
    const subjClean = `Subject: ${data.subject}`;
    doc.text(subjClean, margin + 4, currentY + 4.5);
    currentY += 8.5;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. LINE ITEMS TABLE (NO FAKE BLANK ROWS, NO GST COLUMN IN TABLE)
  //    Columns: #, Item / Service, Description & Scope of Work, HSN/SAC, Qty, Unit, Rate (INR), Amount (INR)
  // ─────────────────────────────────────────────────────────────
  const rawItems = (data.items || []).filter(item => (item.name || '').trim() !== '');
  const tableData: any[] = rawItems.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const lineAmount = item.amount !== undefined ? Number(item.amount) : qty * rate;

    const itemName = (item.name || 'Commercial Service').trim();
    const itemDesc = (item.description || '').trim();

    return [
      (index + 1).toString(),
      itemName,
      itemDesc,
      item.hsn || '',
      qty.toString(),
      item.uom || 'Unit',
      rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    ];
  });

  // Precise column widths totaling exactly 190mm (contentWidth)
  const colWidths = [8, 46, 50, 18, 10, 15, 20, 23];
  let curColX = margin;
  const colPositions = [curColX];
  colWidths.forEach(w => {
    curColX += w;
    colPositions.push(curColX);
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item / Service', 'Description & Scope of Work', 'HSN/SAC', 'Qty', 'Unit', 'Rate (INR)', 'Amount (INR)']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 2.8,
      minCellHeight: 8
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], fontStyle: 'bold', halign: 'left' },
      2: { cellWidth: colWidths[2], halign: 'left' },
      3: { cellWidth: colWidths[3], halign: 'center' }, // 18mm width for HSN/SAC (never wraps!)
      4: { cellWidth: colWidths[4], halign: 'center' },
      5: { cellWidth: colWidths[5], halign: 'center' }, // 15mm width for Unit (never wraps!)
      6: { cellWidth: colWidths[6], halign: 'right' },
      7: { cellWidth: colWidths[7], halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255]
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setPage(pageCount);
  let tableEndY = (doc as any).lastAutoTable.finalY;

  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // 7. ANCHORED BOTTOM SECTION & EXTENDED TABLE GRID LINES
  //    (Seamlessly draws vertical column lines down to footer,
  //     exactly as in Proforma & Tax Invoices)
  // ─────────────────────────────────────────────────────────────
  const totalFooterHeight = 72;
  let footerBoxStartY = pageHeight - margin - totalFooterHeight;

  if (tableEndY > footerBoxStartY) {
    doc.addPage();
    tableEndY = margin;
    footerBoxStartY = pageHeight - margin - totalFooterHeight;
  }

  // Extend vertical table grid lines seamlessly down to the top of the footer box
  doc.setLineWidth(0.15);
  doc.setDrawColor(218, 224, 233);
  colPositions.forEach((x) => {
    doc.line(x, tableEndY, x, footerBoxStartY);
  });
  // Horizontal line sealing the bottom of the table
  doc.setLineWidth(0.35);
  doc.setDrawColor(200, 210, 225);
  doc.line(margin, footerBoxStartY, margin + contentWidth, footerBoxStartY);

  // ─────────────────────────────────────────────────────────────
  // 8. ANCHORED FOOTER CONTENT:
  //    - Left Column: Amount in Words, Bank & Payment Card (with full PAN),
  //      and Commercial Terms & Proposal Guidelines.
  //    - Right Column: Sub Total, GST Tax Row, Grand Total, and ISSUED BY.
  // ─────────────────────────────────────────────────────────────
  const finalY = footerBoxStartY;
  const leftWidth = 110;
  const rightWidth = 72;
  const rightColStart = pageWidth - margin - rightWidth;

  // ── LEFT COLUMN ──
  // 1. Amount in Words
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('Amount in Words:', margin + 2, finalY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateDark);
  const wordsText = doc.splitTextToSize(numberToWords(data.totalAmount), leftWidth - 4);
  doc.text(wordsText, margin + 2, finalY + 8.2);
  const wordsH = Math.max(wordsText.length * 3.5, 4);

  // 2. Dedicated Bank Transfer & Payment Details Card (Clean 2-Column Card)
  let acName = data.companyName || 'ATOMIC SOLUTIONS';
  let bankName = 'State Bank of India';
  let ifscCode = 'SBIN0012551';
  let acNumber = '45644909906';
  let branch = 'Sonaraithari';
  let panNo = 'CVVPA9010L';

  const compGSTIN = data.companyGSTIN || data.ownerGSTIN || '';
  if (compGSTIN && compGSTIN.length >= 12) {
    panNo = compGSTIN.substring(2, 12);
  }

  if (data.bankDetails) {
    const rawLines = data.bankDetails.split('\n').map(l => l.trim()).filter(Boolean);
    rawLines.forEach(line => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.substring(0, idx).trim().toUpperCase();
        const val = line.substring(idx + 1).trim();
        if (key.includes('NAME') && !key.includes('BANK')) {
          if (val) acName = val;
        } else if (key.includes('BANK')) {
          if (val) bankName = val;
        } else if (key.includes('IFSC')) {
          if (val) ifscCode = val;
        } else if (key.includes('A/C') || key.includes('ACCOUNT')) {
          if (val) acNumber = val;
        } else if (key.includes('BRANCH')) {
          if (val) branch = val;
        } else if (key.includes('PAN')) {
          if (val) panNo = val;
        }
      }
    });
  }

  const cardX = margin;
  const cardY = finalY + 8.5 + wordsH;
  const cardW = leftWidth;
  const cardH = 20.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 224, 233);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, cardY, cardW, cardH, 1.5, 1.5, 'FD');

  doc.setFontSize(7.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('Bank Transfer & Payment Details:', cardX + 3, cardY + 4.2);

  const sub1X = cardX + 3;
  const sub2X = cardX + 55;
  const row1Y = cardY + 8.2;
  const row2Y = cardY + 12.2;
  const row3Y = cardY + 16.2;

  // Row 1
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('A/C Name:', sub1X, row1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text(acName, sub1X + 16, row1Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('IFSC Code:', sub2X, row1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(ifscCode, sub2X + 16, row1Y);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Bank Name:', sub1X, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  doc.text(bankName, sub1X + 16, row2Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Branch:', sub2X, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  doc.text(branch, sub2X + 16, row2Y);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('A/C No.:', sub1X, row3Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text(acNumber, sub1X + 16, row3Y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('PAN No.:', sub2X, row3Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(panNo, sub2X + 16, row3Y); // Complete 10-character PAN, 100% visible, never cut off!

  // 3. Commercial Terms & Proposal Guidelines
  const termsY = cardY + cardH + 2.5;
  doc.setFontSize(7.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('Commercial Terms & Proposal Guidelines:', margin + 2, termsY);

  const defaultQuotationTerms = data.terms || [
    '1. 50% Advance with official Purchase Order / Work Order confirmation.',
    '2. Balance payment on completion of installation & testing.',
    '3. Price Validity: Rates quoted above are strictly valid for 30 days from date of issue.',
    '4. Jurisdiction: Subject to Deoghar (Jharkhand) Jurisdiction only.'
  ].join('\n');

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const splitTerms = doc.splitTextToSize(defaultQuotationTerms, leftWidth - 4);
  doc.text(splitTerms, margin + 2, termsY + 3.8);

  // ── RIGHT COLUMN ──
  // Totals & GST Summary (anchored directly above Grand Total)
  const isIgst = Boolean(data.summary?.igstAmount && data.summary.igstAmount > 0);
  const cgst = data.summary?.cgstAmount || 0;
  const sgst = data.summary?.sgstAmount || 0;
  const igst = data.summary?.igstAmount || 0;
  const totalGst = cgst + sgst + igst;
  const subTotal = data.summary?.taxableAmount || (data.totalAmount - totalGst);

  let rightY = finalY + 4;

  // 1. Sub Total (INR)
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Sub Total (INR):', rightColStart, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text(subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), pageWidth - margin - 2, rightY, { align: 'right' });
  rightY += 4.2;

  // 2. Discount (if any)
  if (data.summary?.discountAmount && data.summary.discountAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text('Discount (INR):', rightColStart, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${data.summary.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 4.2;
  }

  // 3. GST Tax Row (Strictly placed right above Grand Total)
  if (isIgst) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('IGST (Tax):', rightColStart, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slateDark);
    doc.text(igst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 4.2;
  } else if (cgst > 0 || sgst > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('CGST (INR):', rightColStart, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slateDark);
    doc.text(cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 3.8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('SGST (INR):', rightColStart, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slateDark);
    doc.text(sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 4.2;
  } else if (totalGst === 0) {
    // When 0% or exempt, display GST Tax row above Grand Total
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('GST Tax (0% / Exempt):', rightColStart, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slateDark);
    doc.text('0.00', pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 4.2;
  }

  // 4. Grand Total Highlight Bar
  doc.setFillColor(...navyColor);
  doc.roundedRect(rightColStart - 2, rightY - 1, rightWidth + 2, 7.5, 1.2, 1.2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Grand Total:', rightColStart + 2, rightY + 4.2);
  doc.text(`INR ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, rightY + 4.2, { align: 'right' });
  rightY += 10.5;

  // 5. ISSUED BY Box (Positioned cleanly below Grand Total)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 224, 233);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightColStart - 2, rightY, rightWidth + 2, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ISSUED BY:', rightColStart + 3, rightY + 4.8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(data.companyName || 'ATOMIC SOLUTIONS', rightColStart + 3, rightY + 10.2);

  // ─────────────────────────────────────────────────────────────
  // 9. FOOTER: SYSTEM NOTICE (Clean single line at bottom margin)
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Atomic Solutions Enterprise Billing Portal  |  Official Commercial Quotation Document', pageWidth / 2, pageHeight - margin - 2, { align: 'center' });

  return doc;
};
