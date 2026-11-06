import { Invoice, Expense, BillingItem } from '../types';
import { indianStateCodes, autoDetectStateCode } from './stateCodeHelper';

export const ATOMIC_STATE_CODE = '20'; // Jharkhand
export const ATOMIC_STATE_NAME = 'Jharkhand';

/**
 * Validates a 15-character Indian GST Identification Number (GSTIN)
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(clean);
}

/**
 * Extracts State Name & Code from GSTIN
 */
export function getStateFromGSTIN(gstin: string): { code: string; name: string } | null {
  if (!gstin || gstin.trim().length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  const st = indianStateCodes[code];
  return st ? { code: st.code, name: st.name } : null;
}

/**
 * Determines whether supply is Inter-State (IGST) or Intra-State (CGST + SGST)
 */
export function isInterStateSupply(customerStateOrCode: string, businessStateCode: string = ATOMIC_STATE_CODE): boolean {
  if (!customerStateOrCode) return false;
  const trimmed = customerStateOrCode.trim();
  
  // If input has 2 digits at the end or beginning
  const codeMatch = trimmed.match(/\b(\d{2})\b/);
  if (codeMatch) {
    return codeMatch[1] !== businessStateCode;
  }
  
  // If matched by state name
  const detected = autoDetectStateCode(trimmed);
  const detectedCodeMatch = detected.match(/\b(\d{2})\b/);
  if (detectedCodeMatch) {
    return detectedCodeMatch[1] !== businessStateCode;
  }
  
  return false;
}

/**
 * Formats a number to Indian Rupee string with proper Indian number grouping
 */
export function formatINR(val: number = 0): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

export interface HSNSummaryRow {
  hsnCode: string;
  description: string;
  uom: string;
  totalQuantity: number;
  totalTaxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalValue: number;
}

export interface GSTR1Summary {
  b2bInvoices: Invoice[];
  b2cInvoices: Invoice[];
  hsnSummary: HSNSummaryRow[];
  totalInvoicesCount: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  totalInvoiceValue: number;
}

export interface GSTR3BSummary {
  // 3.1 Outward Taxable Supplies (Sales)
  outwardTaxableValue: number;
  outwardIgst: number;
  outwardCgst: number;
  outwardSgst: number;
  outwardTotalGst: number;

  // 4. Eligible Input Tax Credit (ITC from Expenses)
  itcTaxableValue: number;
  itcIgst: number;
  itcCgst: number;
  itcSgst: number;
  itcTotalGst: number;

  // 5. Net Tax Payable (Outward - ITC)
  netIgstPayable: number;
  netCgstPayable: number;
  netSgstPayable: number;
  netTotalPayable: number;
}

/**
 * Calculates GSTR-1 Outward Supplies Summary (B2B, B2C, HSN breakup)
 */
export function calculateGSTR1(invoices: Invoice[]): GSTR1Summary {
  // Only consider Tax Invoices (exclude pure estimates that haven't been converted)
  const salesInvoices = invoices.filter(inv => {
    const t = (inv.type || '').toLowerCase();
    return t === 'tax invoice' || t === 'invoice' || t === 'simple invoice';
  });

  const b2bInvoices: Invoice[] = [];
  const b2cInvoices: Invoice[] = [];
  const hsnMap = new Map<string, HSNSummaryRow>();

  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalInvoiceValue = 0;

  salesInvoices.forEach(inv => {
    const isB2B = Boolean(inv.customerGSTIN && validateGSTIN(inv.customerGSTIN));
    if (isB2B) {
      b2bInvoices.push(inv);
    } else {
      b2cInvoices.push(inv);
    }

    const invTaxable = inv.subTotal - (inv.discount || 0);
    const invCgst = inv.cgstAmount ?? (inv.gstType === 'cgst_sgst' ? (inv.gstAmount || 0) / 2 : 0);
    const invSgst = inv.sgstAmount ?? (inv.gstType === 'cgst_sgst' ? (inv.gstAmount || 0) / 2 : 0);
    const invIgst = inv.igstAmount ?? (inv.gstType === 'igst' ? (inv.gstAmount || 0) : 0);

    totalTaxableValue += invTaxable;
    totalCgst += invCgst;
    totalSgst += invSgst;
    totalIgst += invIgst;
    totalInvoiceValue += (inv.totalAmount || 0);

    // HSN aggregation
    const gstRate = inv.gstPercentage || 0;
    const isIgst = inv.gstType === 'igst' || invIgst > 0;

    (inv.items || []).forEach(item => {
      const code = (item.hsn || '9987').trim().toUpperCase();
      const itemTaxable = (item.rate || 0) * (item.quantity || 1);
      const itemGst = (itemTaxable * gstRate) / 100;
      const itemCgst = isIgst ? 0 : itemGst / 2;
      const itemSgst = isIgst ? 0 : itemGst / 2;
      const itemIgst = isIgst ? itemGst : 0;

      if (!hsnMap.has(code)) {
        hsnMap.set(code, {
          hsnCode: code,
          description: item.name || 'HVAC / Electrical Service',
          uom: item.unit || 'Unit',
          totalQuantity: 0,
          totalTaxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
          totalValue: 0
        });
      }

      const row = hsnMap.get(code)!;
      row.totalQuantity += (item.quantity || 1);
      row.totalTaxableValue += itemTaxable;
      row.cgstAmount += itemCgst;
      row.sgstAmount += itemSgst;
      row.igstAmount += itemIgst;
      row.totalTax += itemGst;
      row.totalValue += (itemTaxable + itemGst);
    });
  });

  return {
    b2bInvoices,
    b2cInvoices,
    hsnSummary: Array.from(hsnMap.values()),
    totalInvoicesCount: salesInvoices.length,
    totalTaxableValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst: totalCgst + totalSgst + totalIgst,
    totalInvoiceValue
  };
}

/**
 * Calculates GSTR-3B Monthly Return Summary (Outward vs Eligible ITC -> Net Tax Payable)
 */
export function calculateGSTR3B(invoices: Invoice[], expenses: Expense[]): GSTR3BSummary {
  const gstr1 = calculateGSTR1(invoices);

  // Filter expenses with eligible ITC
  let itcTaxableValue = 0;
  let itcIgst = 0;
  let itcCgst = 0;
  let itcSgst = 0;

  expenses.forEach(exp => {
    // Check if expense has GST and is ITC eligible
    if (exp.isGstApplicable && exp.isItcEligible !== false) {
      const taxable = exp.taxableAmount || (exp.gstRate ? (exp.amount / (1 + exp.gstRate / 100)) : exp.amount);
      const gst = exp.gstAmount || (exp.amount - taxable);
      const isIgst = Boolean(exp.igstAmount && exp.igstAmount > 0) || (exp.vendorStateCode && exp.vendorStateCode !== ATOMIC_STATE_CODE);

      itcTaxableValue += taxable;
      if (isIgst) {
        itcIgst += (exp.igstAmount ?? gst);
      } else {
        const half = exp.cgstAmount ?? (gst / 2);
        itcCgst += half;
        itcSgst += (exp.sgstAmount ?? half);
      }
    }
  });

  const netIgstPayable = Math.max(0, gstr1.totalIgst - itcIgst);
  const netCgstPayable = Math.max(0, gstr1.totalCgst - itcCgst);
  const netSgstPayable = Math.max(0, gstr1.totalSgst - itcSgst);

  return {
    outwardTaxableValue: gstr1.totalTaxableValue,
    outwardIgst: gstr1.totalIgst,
    outwardCgst: gstr1.totalCgst,
    outwardSgst: gstr1.totalSgst,
    outwardTotalGst: gstr1.totalGst,

    itcTaxableValue,
    itcIgst,
    itcCgst,
    itcSgst,
    itcTotalGst: itcIgst + itcCgst + itcSgst,

    netIgstPayable,
    netCgstPayable,
    netSgstPayable,
    netTotalPayable: netIgstPayable + netCgstPayable + netSgstPayable
  };
}

/**
 * Exports data to CSV and triggers instant file download in browser
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports GSTR-1 B2B Invoices to CA-Ready CSV
 */
export function exportGSTR1B2BCSV(invoices: Invoice[]) {
  const gstr1 = calculateGSTR1(invoices);
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate (%)',
    'Taxable Value',
    'Cess Amount'
  ];

  const rows = gstr1.b2bInvoices.map(inv => {
    const pos = inv.customerState || inv.customerStateCode || `${ATOMIC_STATE_NAME} ${ATOMIC_STATE_CODE}`;
    const taxable = inv.subTotal - (inv.discount || 0);
    return [
      inv.customerGSTIN || '',
      inv.customerName || '',
      inv.estimateNumber || '',
      inv.date || '',
      (inv.totalAmount || 0).toFixed(2),
      pos,
      'N',
      '',
      'Regular',
      '',
      (inv.gstPercentage || 0).toString(),
      taxable.toFixed(2),
      '0.00'
    ];
  });

  exportToCSV(`GSTR1_B2B_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

/**
 * Exports GSTR-3B Summary to CSV
 */
export function exportGSTR3BCSV(invoices: Invoice[], expenses: Expense[]) {
  const gstr3b = calculateGSTR3B(invoices, expenses);
  const headers = [
    'Nature of Supplies / Section',
    'Total Taxable Value (₹)',
    'Integrated Tax (IGST ₹)',
    'Central Tax (CGST ₹)',
    'State/UT Tax (SGST ₹)',
    'Total GST (₹)'
  ];

  const rows = [
    [
      '3.1 (a) Outward Taxable Supplies (Sales)',
      gstr3b.outwardTaxableValue.toFixed(2),
      gstr3b.outwardIgst.toFixed(2),
      gstr3b.outwardCgst.toFixed(2),
      gstr3b.outwardSgst.toFixed(2),
      gstr3b.outwardTotalGst.toFixed(2)
    ],
    [
      '4. (A) (5) Eligible ITC (All other ITC from Expenses)',
      gstr3b.itcTaxableValue.toFixed(2),
      gstr3b.itcIgst.toFixed(2),
      gstr3b.itcCgst.toFixed(2),
      gstr3b.itcSgst.toFixed(2),
      gstr3b.itcTotalGst.toFixed(2)
    ],
    [
      '6.1 Net Tax Payable in Cash (Output - Input ITC)',
      '-',
      gstr3b.netIgstPayable.toFixed(2),
      gstr3b.netCgstPayable.toFixed(2),
      gstr3b.netSgstPayable.toFixed(2),
      gstr3b.netTotalPayable.toFixed(2)
    ]
  ];

  exportToCSV(`GSTR3B_Summary_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

/**
 * Exports Expenses to CSV
 */
export function exportExpensesCSV(expenses: Expense[]) {
  const headers = [
    'Date',
    'Expense Title',
    'Category',
    'Vendor Name',
    'Vendor Phone',
    'Vendor GSTIN',
    'Payment Mode',
    'Taxable Amount (₹)',
    'GST Rate (%)',
    'GST Amount (₹)',
    'Total Amount (₹)',
    'ITC Eligible',
    'Notes'
  ];

  const rows = expenses.map(e => [
    e.date || '',
    e.title || '',
    e.category || '',
    e.vendorName || '',
    e.vendorPhone || '',
    e.vendorGSTIN || '',
    e.paymentMode || '',
    (e.taxableAmount || e.amount).toFixed(2),
    (e.gstRate || 0).toString(),
    (e.gstAmount || 0).toFixed(2),
    (e.amount || 0).toFixed(2),
    e.isItcEligible !== false ? 'Yes' : 'No',
    e.notes || ''
  ]);

  exportToCSV(`Expenses_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}


/**
 * CA Audit: Bank Reconciliation Statement CSV (बैंक समाधान विवरण)
 * Gathers all Bank & Online transactions (UPI, Bank Transfer, Cheque)
 * with UTR / Transaction IDs so the CA can match against Bank Passbook.
 */
export function exportBankReconciliationCSV(invoices: Invoice[], expenses: Expense[]) {
  const bankInvoices = invoices.filter(inv => {
    const isPaid = inv.paymentStatus === 'Paid' || (inv.paidAmount && inv.paidAmount > 0);
    const mode = (inv.paymentMode || '').toLowerCase();
    const isBank = mode.includes('upi') || mode.includes('bank') || mode.includes('transfer') || mode.includes('cheque') || mode === 'online';
    return isPaid && isBank;
  });

  const bankExpenses = expenses.filter(exp => {
    const mode = (exp.paymentMode || '').toLowerCase();
    return mode.includes('upi') || mode.includes('bank') || mode.includes('transfer') || mode.includes('cheque');
  });

  type BankItem = {
    date: string;
    type: 'BANK_CREDIT' | 'BANK_DEBIT';
    voucherRef: string;
    partyName: string;
    mode: string;
    utr: string;
    credit: number;
    debit: number;
    gstAmount: number;
    matched: string;
    notes: string;
  };

  const records: BankItem[] = [];

  bankInvoices.forEach(inv => {
    const amt = inv.paymentStatus === 'Paid' ? (inv.totalAmount || 0) : (inv.paidAmount || 0);
    records.push({
      date: inv.paymentDate || inv.date || '',
      type: 'BANK_CREDIT',
      voucherRef: inv.estimateNumber || inv.invoiceNumber || 'INV',
      partyName: inv.customerName || 'Customer',
      mode: inv.paymentMode || 'UPI',
      utr: inv.bankTransactionId || inv.paymentNotes || '',
      credit: amt,
      debit: 0,
      gstAmount: inv.gstAmount || 0,
      matched: inv.reconciledWithBank ? 'MATCHED' : 'PENDING_MATCH',
      notes: inv.paymentNotes || 'Sales Payment Received'
    });
  });

  bankExpenses.forEach(exp => {
    records.push({
      date: exp.date || '',
      type: 'BANK_DEBIT',
      voucherRef: exp.invoiceNumber || 'EXP-BILL',
      partyName: exp.vendorName || exp.title || 'Vendor',
      mode: exp.paymentMode || 'UPI',
      utr: exp.bankTransactionId || exp.notes || '',
      credit: 0,
      debit: exp.amount || 0,
      gstAmount: exp.gstAmount || 0,
      matched: exp.reconciledWithBank ? 'MATCHED' : 'PENDING_MATCH',
      notes: `${exp.title} (${exp.category})`
    });
  });

  records.sort((a, b) => (a.date > b.date ? 1 : -1));

  const headers = [
    'DATE',
    'TRANSACTION_TYPE',
    'VOUCHER_REF',
    'PARTY_NAME',
    'PAYMENT_MODE',
    'BANK_UTR_OR_REF_NO',
    'CREDIT_AMOUNT_INR',
    'DEBIT_AMOUNT_INR',
    'GST_AMOUNT_INR',
    'BANK_MATCH_STATUS',
    'DESCRIPTION_NOTES'
  ];

  const totalCredits = records.reduce((s, r) => s + r.credit, 0);
  const totalDebits = records.reduce((s, r) => s + r.debit, 0);
  const netBankFlow = totalCredits - totalDebits;

  const rows: (string | number)[][] = [
    [
      'SUMMARY',
      'BANK_STATEMENT_RECONCILIATION',
      'ATOMIC_SOLUTIONS',
      `Records: ${records.length}`,
      'ALL_MODES (UPI/BANK)',
      '-',
      totalCredits.toFixed(2),
      totalDebits.toFixed(2),
      '-',
      `Net Flow: ${netBankFlow >= 0 ? '+' : ''}${netBankFlow.toFixed(2)}`,
      'CA Audit Bank Statement Sheet'
    ],
    ['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---'],
    ...records.map(r => [
      r.date,
      r.type,
      r.voucherRef,
      r.partyName,
      r.mode,
      r.utr,
      r.credit.toFixed(2),
      r.debit.toFixed(2),
      r.gstAmount.toFixed(2),
      r.matched,
      r.notes
    ])
  ];

  exportToCSV(`CA_Bank_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

/**
 * CA Audit: Cash Book CSV (रोकड़ बही / कैश लेजर)
 * Gathers all Pure Cash transactions (Cash Sales & Petty Cash Expenses)
 * with Running Cash Balance to maintain Cash in Hand.
 */
export function exportCashBookCSV(invoices: Invoice[], expenses: Expense[]) {
  const cashInvoices = invoices.filter(inv => {
    const isPaid = inv.paymentStatus === 'Paid' || (inv.paidAmount && inv.paidAmount > 0);
    const mode = (inv.paymentMode || '').toLowerCase();
    return isPaid && (mode === 'cash' || mode.includes('नकद') || mode === '');
  });

  const cashExpenses = expenses.filter(exp => {
    const mode = (exp.paymentMode || '').toLowerCase();
    return mode === 'cash' || mode.includes('नकद');
  });

  type CashItem = {
    date: string;
    type: 'CASH_INFLOW' | 'CASH_OUTFLOW';
    ref: string;
    particulars: string;
    cashIn: number;
    cashOut: number;
    notes: string;
  };

  const records: CashItem[] = [];

  cashInvoices.forEach(inv => {
    const amt = inv.paymentStatus === 'Paid' ? (inv.totalAmount || 0) : (inv.paidAmount || 0);
    records.push({
      date: inv.paymentDate || inv.date || '',
      type: 'CASH_INFLOW',
      ref: inv.estimateNumber || inv.invoiceNumber || 'CASH-REC',
      particulars: `${inv.customerName || 'Retail Customer'} - Bill #${inv.estimateNumber || ''}`,
      cashIn: amt,
      cashOut: 0,
      notes: inv.paymentNotes || 'Cash receipt against sales'
    });
  });

  cashExpenses.forEach(exp => {
    records.push({
      date: exp.date || '',
      type: 'CASH_OUTFLOW',
      ref: exp.invoiceNumber || 'PETTY-VOUCHER',
      particulars: `${exp.title} (${exp.category}) - ${exp.vendorName || 'Supplier'}`,
      cashIn: 0,
      cashOut: exp.amount || 0,
      notes: exp.notes || 'Cash paid for business expense'
    });
  });

  records.sort((a, b) => (a.date > b.date ? 1 : -1));

  let runningBalance = 0;
  const headers = [
    'DATE',
    'VOUCHER_TYPE',
    'DOC_REF_NO',
    'PARTICULARS',
    'CASH_INFLOW_INR',
    'CASH_OUTFLOW_INR',
    'RUNNING_CASH_BALANCE_INR',
    'REMARKS'
  ];

  const rows: (string | number)[][] = records.map(r => {
    runningBalance += r.cashIn - r.cashOut;
    return [
      r.date,
      r.type,
      r.ref,
      r.particulars,
      r.cashIn.toFixed(2),
      r.cashOut.toFixed(2),
      runningBalance.toFixed(2),
      r.notes
    ];
  });

  const totalIn = records.reduce((s, r) => s + r.cashIn, 0);
  const totalOut = records.reduce((s, r) => s + r.cashOut, 0);

  rows.unshift([
    'SUMMARY',
    'OFFICIAL_CASH_BOOK',
    'ATOMIC_SOLUTIONS',
    `Total Records: ${records.length}`,
    totalIn.toFixed(2),
    totalOut.toFixed(2),
    runningBalance.toFixed(2),
    'Closing Cash Balance'
  ]);
  rows.splice(1, 0, ['---', '---', '---', '---', '---', '---', '---', '---']);

  exportToCSV(`CA_Cash_Book_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

/**
 * Categorizes an expense payment mode into:
 * - 'proprietor_capital': Owner's personal savings/capital (does NOT deduct from Business Bank or Cash Book)
 * - 'cash': Cash in Hand / Petty Cash
 * - 'bank': SBI Current A/c / Online / UPI / Bank Transfer / Cheque
 */
export function getExpensePaymentCategory(paymentMode: string = ''): 'bank' | 'cash' | 'proprietor_capital' {
  const m = (paymentMode || '').toLowerCase();
  if (
    m.includes('proprietor') || 
    m.includes('capital') || 
    m.includes('personal') || 
    m.includes('owner') || 
    m.includes('मालिक') ||
    m.includes('व्यक्तिगत पूंजी')
  ) {
    return 'proprietor_capital';
  }
  if (
    m.includes('cash') || 
    m.includes('रोकड़') || 
    m.includes('नकद') || 
    m.includes('petty')
  ) {
    return 'cash';
  }
  return 'bank';
}

/**
 * 1-Click CA Export 1: GSTR-1 Quarterly Sales Report CSV
 * Columns: Invoice No, Invoice Date, Customer Name, Customer GSTIN, Place of Supply,
 *          Taxable Value, CGST, SGST, IGST, Total Invoice Value
 */
export function exportQuarterlyGSTR1SalesReport(
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  financialYear: string,
  invoices: Invoice[]
) {
  // Filter sales invoices for specified quarter and FY
  const salesInvoices = invoices.filter(inv => {
    const t = (inv.type || '').toLowerCase();
    const isSale = t === 'tax invoice' || t === 'invoice' || t === 'simple invoice';
    if (!isSale || !inv.date) return false;

    // Check FY & Quarter
    const d = new Date(inv.date);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const startYr = mo >= 3 ? yr : yr - 1;
    const invFy = `${startYr.toString().slice(-2)}-${(startYr + 1).toString().slice(-2)}`;
    
    let invQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q4';
    if (mo >= 3 && mo <= 5) invQuarter = 'Q1';
    else if (mo >= 6 && mo <= 8) invQuarter = 'Q2';
    else if (mo >= 9 && mo <= 11) invQuarter = 'Q3';

    // Match either full FY like "2026-27" or short "26-27"
    const fyClean = financialYear.replace('20', '');
    const matchesFy = invFy === fyClean || invFy === financialYear;
    return matchesFy && invQuarter === quarter;
  });

  const headers = [
    'Invoice No',
    'Invoice Date',
    'Customer Name',
    'Customer GSTIN',
    'Place of Supply',
    'Taxable Value',
    'CGST',
    'SGST',
    'IGST',
    'Total Invoice Value'
  ];

  const rows: (string | number)[][] = salesInvoices.map(inv => {
    const taxable = (Number(inv.subTotal) || 0) - (Number(inv.discount) || 0);
    const isIgst = inv.gstType === 'igst' || (inv.igstAmount && inv.igstAmount > 0);
    const cgst = isIgst ? 0 : (inv.cgstAmount ?? ((Number(inv.gstAmount) || 0) / 2));
    const sgst = isIgst ? 0 : (inv.sgstAmount ?? ((Number(inv.gstAmount) || 0) / 2));
    const igst = isIgst ? (inv.igstAmount ?? (Number(inv.gstAmount) || 0)) : 0;
    const totalVal = Number(inv.totalAmount) || (taxable + cgst + sgst + igst);
    const pos = inv.customerState || inv.customerStateCode || `${ATOMIC_STATE_NAME} ${ATOMIC_STATE_CODE}`;

    return [
      inv.estimateNumber || inv.invoiceNumber || 'INV-001',
      inv.date || '',
      inv.customerName || 'Valued Customer',
      inv.customerGSTIN || 'URP (Unregistered)',
      pos,
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      igst.toFixed(2),
      totalVal.toFixed(2)
    ];
  });

  // Calculate totals
  const totalTaxable = rows.reduce((s, r) => s + Number(r[5] || 0), 0);
  const totalCgst = rows.reduce((s, r) => s + Number(r[6] || 0), 0);
  const totalSgst = rows.reduce((s, r) => s + Number(r[7] || 0), 0);
  const totalIgst = rows.reduce((s, r) => s + Number(r[8] || 0), 0);
  const grandTotal = rows.reduce((s, r) => s + Number(r[9] || 0), 0);

  rows.push([
    'QUARTER_TOTAL',
    `FY ${financialYear} - ${quarter}`,
    `Total Invoices: ${salesInvoices.length}`,
    '-',
    '-',
    totalTaxable.toFixed(2),
    totalCgst.toFixed(2),
    totalSgst.toFixed(2),
    totalIgst.toFixed(2),
    grandTotal.toFixed(2)
  ]);

  const cleanFy = financialYear.replace(/[^a-zA-Z0-9_-]/g, '_');
  exportToCSV(`GSTR-1_Sales_Report_${cleanFy}_${quarter}.csv`, headers, rows);
}

/**
 * 1-Click CA Export 2: Expense & ITC Summary CSV
 * Section 1: GST Purchases (Vendor, GSTIN, Invoice Date, Invoice No, Taxable, Rate, CGST, SGST, IGST, Total, ITC Eligible)
 * Section 2: Non-GST Operational Expenses (Category, Payee Name, Date, Payment Source, Amount, Description)
 */
export function exportQuarterlyExpenseITCSummary(
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  financialYear: string,
  expenses: Expense[]
) {
  // Filter expenses for specified quarter and FY
  const qExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const startYr = mo >= 3 ? yr : yr - 1;
    const expFy = `${startYr.toString().slice(-2)}-${(startYr + 1).toString().slice(-2)}`;

    let expQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q4';
    if (mo >= 3 && mo <= 5) expQuarter = 'Q1';
    else if (mo >= 6 && mo <= 8) expQuarter = 'Q2';
    else if (mo >= 9 && mo <= 11) expQuarter = 'Q3';

    const fyClean = financialYear.replace('20', '');
    const matchesFy = (exp.financialYear && (exp.financialYear === financialYear || exp.financialYear === fyClean)) || expFy === fyClean || expFy === financialYear;
    const matchesQuarter = (exp.quarter || expQuarter) === quarter;
    return matchesFy && matchesQuarter;
  });

  const gstPurchases = qExpenses.filter(e => e.isGstApplicable || e.isGstRegisteredVendor || Boolean(e.vendorGSTIN));
  const nonGstExpenses = qExpenses.filter(e => !e.isGstApplicable && !e.isGstRegisteredVendor && !e.vendorGSTIN);

  const headers = [
    'REPORT_SECTION',
    'COL_1_PARTY_CATEGORY',
    'COL_2_GSTIN_PAYEE',
    'COL_3_DATE',
    'COL_4_INVOICE_SOURCE',
    'COL_5_TAXABLE_AMOUNT',
    'COL_6_GST_RATE',
    'COL_7_CGST',
    'COL_8_SGST',
    'COL_9_IGST',
    'COL_10_TOTAL_AMOUNT',
    'COL_11_ITC_ELIGIBLE_NOTES'
  ];

  const rows: (string | number)[][] = [];

  // Summary Banner
  const totalGstTaxable = gstPurchases.reduce((s, e) => s + (e.taxableAmount || (e.gstRate ? e.amount / (1 + e.gstRate / 100) : e.amount)), 0);
  const totalItcClaimed = gstPurchases.reduce((s, e) => e.isItcEligible !== false ? s + (e.gstAmount || 0) : s, 0);
  const totalGstPurchaseAmount = gstPurchases.reduce((s, e) => s + (e.amount || 0), 0);
  const totalNonGstAmount = nonGstExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grandExpenseTotal = totalGstPurchaseAmount + totalNonGstAmount;

  rows.push([
    'SUMMARY',
    `FY ${financialYear} - ${quarter}`,
    'ATOMIC SOLUTIONS (20 - Jharkhand)',
    new Date().toISOString().split('T')[0],
    'ALL EXPENSE SOURCES',
    totalGstTaxable.toFixed(2),
    '-',
    '-',
    '-',
    '-',
    grandExpenseTotal.toFixed(2),
    `Total ITC Claimed: ₹${totalItcClaimed.toFixed(2)} | Non-GST Site Ops: ₹${totalNonGstAmount.toFixed(2)}`
  ]);

  rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);

  // SECTION 1: GST PURCHASES (WITH ITC BREAKUP)
  rows.push([
    'HEADER_SECTION_1',
    'VENDOR_NAME',
    'VENDOR_GSTIN',
    'INVOICE_DATE',
    'INVOICE_NO',
    'TAXABLE_VALUE (INR)',
    'GST_RATE (%)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'TOTAL_BILL_VALUE (INR)',
    'ITC_ELIGIBILITY'
  ]);

  gstPurchases.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    const rate = Number(exp.gstRate) || 18;
    const taxable = exp.taxableAmount !== undefined ? Number(exp.taxableAmount) : (rate > 0 ? amt / (1 + rate / 100) : amt);
    const gst = exp.gstAmount !== undefined ? Number(exp.gstAmount) : (amt - taxable);

    const isIgst = Boolean(exp.igstAmount && exp.igstAmount > 0) || (Boolean(exp.vendorGSTIN) && exp.vendorGSTIN.trim().substring(0, 2) !== ATOMIC_STATE_CODE);
    const cgst = isIgst ? 0 : (exp.cgstAmount ?? (gst / 2));
    const sgst = isIgst ? 0 : (exp.sgstAmount ?? (gst / 2));
    const igst = isIgst ? (exp.igstAmount ?? gst) : 0;

    rows.push([
      'GST_PURCHASE_BILL',
      exp.vendorName || exp.title || 'Supplier',
      exp.vendorGSTIN || 'GST_UNSPECIFIED',
      exp.date || '',
      exp.invoiceNumber || 'PUR-BILL',
      taxable.toFixed(2),
      rate.toString(),
      cgst.toFixed(2),
      sgst.toFixed(2),
      igst.toFixed(2),
      amt.toFixed(2),
      exp.isItcEligible !== false ? 'YES (Eligible ITC)' : 'NO (Blocked/Ineligible)'
    ]);
  });

  rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);

  // SECTION 2: NON-GST OPERATIONAL SITE EXPENSES
  rows.push([
    'HEADER_SECTION_2',
    'EXPENSE_CATEGORY',
    'PAYEE_WORKER_NAME',
    'EXPENSE_DATE',
    'PAYMENT_SOURCE',
    'AMOUNT (INR)',
    'GST_RATE (%)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'TOTAL_PAID (INR)',
    'DESCRIPTION_WORK_SCOPE'
  ]);

  nonGstExpenses.forEach(exp => {
    rows.push([
      'DIRECT_SITE_EXPENSE',
      exp.category || 'Site Operations',
      exp.payeeName || exp.vendorName || 'Site Staff/Payee',
      exp.date || '',
      exp.paymentMode || 'Cash-in-Hand',
      (exp.amount || 0).toFixed(2),
      '0',
      '0.00',
      '0.00',
      '0.00',
      (exp.amount || 0).toFixed(2),
      exp.notes || exp.title || 'Unbilled site expense'
    ]);
  });

  const cleanFy = financialYear.replace(/[^a-zA-Z0-9_-]/g, '_');
  exportToCSV(`Expense_ITC_Summary_${cleanFy}_${quarter}.csv`, headers, rows);
}
