import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { numberToWords, PDFInvoiceData } from './pdfGenerator';
import { logoBase64, signatureBase64 } from './pdfAssets';
import { autoDetectStateCode } from './stateCodeHelper';

export const generateEstimatePDF = (data: PDFInvoiceData, options?: { includeQR?: boolean }): jsPDF => {
  const includeQR = options?.includeQR !== false;
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
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Proforma Invoice', pageWidth / 2, currentY + 5.5, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(data.originalDup || 'Original Copy', margin + contentWidth - 3, currentY + 5.5, { align: 'right' });
  
  currentY += 12;

  // Brand Header: Logo + ATOMIC SOLUTIONS prominently aligned side-by-side
  const logoImg = (data.logoUrl && data.logoUrl.startsWith('data:')) ? data.logoUrl : logoBase64;
  const logoSize = 12; // 12mm x 12mm professional size
  let companyTitleX = margin;

  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', margin, currentY, logoSize, logoSize);
      companyTitleX = margin + logoSize + 3; // Position text right after logo
    } catch (e) {}
  }

  // Company Name in prominent, large bold font matching logo height
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text(data.companyName || 'ATOMIC SOLUTIONS', companyTitleX, currentY + 8);

  currentY += logoSize + 3;
  const companyInfoStartY = currentY;

  // Company Info (Address, Phone, Email, GSTIN, MSME, State)
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const leftColX = margin;
  const leftValX = margin + 26;

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  const splitCompanyAddr = doc.splitTextToSize(data.companyAddress || '', 80);
  doc.text(splitCompanyAddr, leftValX, currentY);
  currentY += Math.max(splitCompanyAddr.length * 3.8, 4);

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
  currentY += 5;

  const leftSideEndY = currentY;

  // ── TOP-RIGHT METADATA (Proforma Inv No., Date, State of supply) ──
  // Starts directly at the level of the company Address on the left (under the red line)
  const topRightColX = 120;
  const topRightValX = 154;
  let topMetaY = companyInfoStartY;

  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  // 1. Proforma Inv No.
  doc.setFont('helvetica', 'bold');
  doc.text('Proforma Inv No.:', topRightColX, topMetaY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.number || 'PI/26-27/01', topRightValX, topMetaY);
  topMetaY += 4.2;

  // 2. Date
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', topRightColX, topMetaY);
  doc.setFont('helvetica', 'normal');
  const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  doc.text(formattedDate, topRightValX, topMetaY);
  topMetaY += 4.2;

  // 3. State of supply
  const stateSupplyStr = autoDetectStateCode(data.stateSupply || data.shippingState || data.customerState || 'Jharkhand 20');
  doc.setFont('helvetica', 'bold');
  doc.text('State of supply:', topRightColX, topMetaY);
  doc.setFont('helvetica', 'normal');
  doc.text(stateSupplyStr, topRightValX, topMetaY);
  topMetaY += 4.2;

  // Optional Buyer Order / PO
  if (data.buyerOrder) {
    doc.setFont('helvetica', 'bold');
    doc.text('Buyer Order:', topRightColX, topMetaY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.buyerOrder, topRightValX, topMetaY);
    topMetaY += 4.2;
  }

  // Customer Info (Bill To) starts cleanly below the header section
  let customerY = Math.max(leftSideEndY, topMetaY) + 3;
  const maxLeftValWidth = 150;

  // Proforma Invoice For (Bill To) Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Proforma Invoice For (Bill To):', leftColX, customerY);
  customerY += 4.5;

  doc.setFontSize(9);

  // Customer Name
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  const splitCustName = doc.splitTextToSize(data.customerName || '', maxLeftValWidth);
  doc.text(splitCustName, leftValX, customerY);
  customerY += Math.max(splitCustName.length * 4, 4.5);

  // Address
  if (data.customerAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', leftColX, customerY);
    doc.setFont('helvetica', 'normal');
    const splitCustAddr = doc.splitTextToSize(data.customerAddress || '', maxLeftValWidth);
    doc.text(splitCustAddr, leftValX, customerY);
    customerY += Math.max(splitCustAddr.length * 4, 4.5);
  }

  // Phone No.
  if (data.customerPhone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone No.:', leftColX, customerY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerPhone || '', leftValX, customerY);
    customerY += 4.5;
  }

  // GSTIN (if present)
  if (data.customerGSTIN) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN:', leftColX, customerY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerGSTIN, leftValX, customerY);
    customerY += 4.5;
  }

  // State
  const custStateStr = autoDetectStateCode(data.customerState || 'Jharkhand 20');
  doc.setFont('helvetica', 'bold');
  doc.text('State:', leftColX, customerY);
  doc.setFont('helvetica', 'normal');
  doc.text(custStateStr, leftValX, customerY);
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
    doc.text(data.shippingName || data.customerName || '', leftValX, customerY);
    customerY += 4;

    if (data.shippingAddress) {
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingAddress, leftValX, customerY);
      customerY += 4;
    }

    if (data.shippingGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text('GSTIN:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shippingGSTIN, leftValX, customerY);
      customerY += 4;
    }

    if (data.shippingState) {
      doc.setFont('helvetica', 'bold');
      doc.text('State:', leftColX, customerY);
      doc.setFont('helvetica', 'normal');
      doc.text(autoDetectStateCode(data.shippingState), leftValX, customerY);
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

    // Columns totaling exactly 190mm (contentWidth):
  // S.No (12mm) | Item Name & Description (58mm) | HSN/SAC (18mm) | Qty (14mm) | Unit (14mm) | Price/Unit (25mm) | GST (17mm) | Amount (32mm)
  const colWidths = [12, 58, 18, 14, 14, 25, 17, 32];
  let curColX = margin;
  const colPositions: number[] = [curColX];
  colWidths.forEach(w => {
    curColX += w;
    colPositions.push(curColX);
  });

  (doc as any).autoTable({
    startY: customerY,
    head: [['S.No.', 'Item Name & Description', 'HSN/SAC', 'Qty', 'Unit', 'Price / Unit\n(without tax)', 'GST', 'Amount']],
    body: tableData,
    theme: 'grid',
    didParseCell: (hookData: any) => {
      if (hookData.column && colWidths[hookData.column.index] !== undefined) {
        hookData.cell.styles.cellWidth = colWidths[hookData.column.index];
      }
    },
    headStyles: {
      fillColor: yellowColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      cellPadding: 2.2,
      minCellHeight: 8,
      lineWidth: 0.15,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 7.5,
      cellPadding: 2.2,
      lineWidth: 0.15,
      lineColor: [0, 0, 0],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], halign: 'left' },
      2: { cellWidth: colWidths[2], halign: 'center' },
      3: { cellWidth: colWidths[3], halign: 'center' },
      4: { cellWidth: colWidths[4], halign: 'center' },
      5: { cellWidth: colWidths[5], halign: 'right' },
      6: { cellWidth: colWidths[6], halign: 'center' },
      7: { cellWidth: colWidths[7], halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setPage(pageCount);
  let tableEndY = (doc as any).lastAutoTable.finalY;

  // Dynamically extract the exact column positions rendered by AutoTable
  // to ensure 100% pixel-perfect vertical alignment with table headers & columns
  let activeColPositions: number[] = [];
  try {
    const headCells = (doc as any).lastAutoTable?.head?.[0]?.cells;
    if (headCells && headCells[0]) {
      activeColPositions.push(headCells[0].x);
      for (let i = 0; headCells[i]; i++) {
        activeColPositions.push(headCells[i].x + headCells[i].width);
      }
    }
  } catch (e) {}

  if (activeColPositions.length === 0) {
    activeColPositions = colPositions;
  }

  // Outer border dimensions:
  const borderBottom = margin - 2 + (pageHeight - margin * 2 + 4); // = 289mm

  // Layout Measurements for Dynamic Footer Height:
  const leftWidth = contentWidth * 0.54;
  const rightWidth = contentWidth * 0.42;
  const rightColStart = margin + contentWidth - rightWidth;

  const wordsText = doc.splitTextToSize(numberToWords(data.totalAmount), leftWidth - 4);
  const wordsLinesCount = Array.isArray(wordsText) ? wordsText.length : 1;
  const wordsBoxHeight = 5 + 1.5 + (wordsLinesCount * 3.4) + 2;

  const hasBank = Boolean(data.bankDetails && data.bankDetails.trim().length > 0);
  const bankLines = hasBank ? data.bankDetails.split('\n').filter((l) => l.trim().length > 0) : [];
  const bankBoxHeight = hasBank ? (5 + 1.5 + (bankLines.length * 3.2) + 2) : 0;

  const defaultTerms = '1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.';
  const termsLines = (data.terms || defaultTerms).split('\n').filter((l) => l.trim().length > 0);
  const termsBoxHeight = 5 + 1.5 + (termsLines.length * 3.2);

  const totalLeftHeight = wordsBoxHeight + (hasBank ? bankBoxHeight : 0) + termsBoxHeight;

  // Right column: summary rows + Final Amount + QR/Signature
  const estimateSummaryRows = [
    { label: 'Sub Total:', value: 'Rs. ' + (data.summary?.taxableAmount || data.totalAmount).toFixed(2) }
  ];

  if (data.summary?.discountAmount && data.summary.discountAmount > 0) {
    estimateSummaryRows.push({ label: 'Discount (-):', value: 'Rs. ' + data.summary.discountAmount.toFixed(2) });
  }

  const cgst = data.summary?.cgstAmount || 0;
  const sgst = data.summary?.sgstAmount || 0;
  const igst = data.summary?.igstAmount || 0;

  if (igst > 0) {
    estimateSummaryRows.push({ label: 'IGST Amt:', value: 'Rs. ' + igst.toFixed(2) });
  } else if (cgst > 0 || sgst > 0) {
    if (cgst > 0) estimateSummaryRows.push({ label: 'CGST Amt:', value: 'Rs. ' + cgst.toFixed(2) });
    if (sgst > 0) estimateSummaryRows.push({ label: 'SGST Amt:', value: 'Rs. ' + sgst.toFixed(2) });
  }

  if (data.summary?.freightCharges && data.summary.freightCharges > 0) {
    estimateSummaryRows.push({ label: 'Freight Charges:', value: 'Rs. ' + data.summary.freightCharges.toFixed(2) });
  }

  if (data.summary?.roundOff && Math.abs(data.summary.roundOff) >= 0.01) {
    const sign = data.summary.roundOff > 0 ? '+' : '';
    estimateSummaryRows.push({ label: 'Round Off:', value: 'Rs. ' + sign + data.summary.roundOff.toFixed(2) });
  }

  const totalRightHeight = (estimateSummaryRows.length * 4.2) + 9 + 22;
  const totalFooterHeight = Math.max(totalLeftHeight, totalRightHeight) + 4;

  let footerBoxStartY = borderBottom - totalFooterHeight - 2;

  if (tableEndY > footerBoxStartY) {
    doc.addPage();
    tableEndY = margin + 5;
    footerBoxStartY = borderBottom - totalFooterHeight - 2;
  }

  // Draw crisp solid vertical grid lines extending down to the top of the footer box
  // matching AutoTable column headers with 100% precision
  doc.setLineWidth(0.15);
  doc.setDrawColor(0, 0, 0);
  activeColPositions.forEach((x) => {
    doc.line(x, tableEndY, x, footerBoxStartY);
  });
  doc.line(activeColPositions[0], footerBoxStartY, activeColPositions[activeColPositions.length - 1], footerBoxStartY);

  const finalY = footerBoxStartY;

  // --- LEFT COLUMN ---
  // 1. Words Box
  doc.setFillColor(...yellowColor);
  doc.rect(margin, finalY + 1.2, leftWidth, 5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Proforma Invoice Amount in Words:', margin + 2, finalY + 4.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(wordsText, margin + 2, finalY + 9.5);

  let nextLeftY = finalY + 9.5 + (wordsLinesCount * 3.4) + 1.5;

  // 2. Bank Details Box (auto-adjusts when present)
  if (hasBank) {
    doc.setFillColor(...yellowColor);
    doc.rect(margin, nextLeftY, leftWidth, 5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Bank & Payment Details:', margin + 2, nextLeftY + 3.8);

    doc.setFontSize(7.2);
    let bY = nextLeftY + 8.0;
    bankLines.forEach((line) => {
      if (line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const label = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', margin + 2, bY);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 24, bY);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text(line, margin + 2, bY);
      }
      bY += 3.2;
    });
    nextLeftY = bY + 1.5;
  }

  // 3. Terms Box - placed cleanly below Words/Bank Box
  const termsY = nextLeftY;
  doc.setFillColor(...yellowColor);
  doc.rect(margin, termsY, leftWidth, 5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Terms and Conditions:', margin + 2, termsY + 3.8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  termsLines.forEach((line, i) => {
    const lineY = termsY + 8.0 + (i * 3.2);
    if (lineY <= borderBottom - 2) {
      doc.text(line, margin + 2, lineY);
    }
  });

  // --- RIGHT COLUMN ---
  let rightY = finalY + 4;
  const elh = estimateSummaryRows.length > 4 ? 3.8 : 4.2;
  estimateSummaryRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(row.label, rightColStart, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(row.value, margin + contentWidth - 2, rightY, { align: 'right' });
    rightY += elh;
  });

  // Final Amount Box
  doc.setFillColor(...yellowColor);
  doc.rect(rightColStart, rightY - 1.5, rightWidth, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Final Amount:', rightColStart + 2, rightY + 2.5);
  doc.text('Rs. ' + data.totalAmount.toFixed(2), margin + contentWidth - 2, rightY + 2.5, { align: 'right' });

  // Outer border on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);
  }
  doc.setPage(totalPages);

  // Bottom Signature & QR Code Area
  const sigY = borderBottom - 10;
  const hasQR = Boolean(includeQR && data.qrCodeUrl);

  if (hasQR) {
    const qrSize = 14;
    const qrX = rightColStart + 5;
    const qrY = sigY - 14;
    try {
      doc.addImage(data.qrCodeUrl, 'JPEG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('SCAN TO PAY (UPI)', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
    } catch (e) {}

    const sigCenterX = pageWidth - margin - 22;
    const sigImg = data.signatureUrl;
    if (sigImg) {
      try {
        doc.addImage(sigImg, 'PNG', sigCenterX - 15, sigY - 11, 30, 10);
      } catch (e) {}
    }
    doc.setLineWidth(0.2);
    doc.line(sigCenterX - 20, sigY, sigCenterX + 20, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Seal & Signature', sigCenterX, sigY + 4, { align: 'center' });
  } else {
    const sigCenterX = pageWidth - margin - 25;
    const sigImg = data.signatureUrl;
    if (sigImg) {
      try {
        doc.addImage(sigImg, 'PNG', sigCenterX - 18, sigY - 12, 36, 11);
      } catch (e) {}
    }
    doc.setLineWidth(0.2);
    doc.line(sigCenterX - 22, sigY, sigCenterX + 22, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Seal & Signature', sigCenterX, sigY + 4, { align: 'center' });
  }

  return doc;
};
