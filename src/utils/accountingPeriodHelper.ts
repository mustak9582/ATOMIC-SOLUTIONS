import { Invoice, Expense } from '../types';
import { formatINR, exportToCSV, ATOMIC_STATE_NAME, ATOMIC_STATE_CODE } from './gstHelper';

export interface AccountingPeriodInfo {
  key: string;
  label: string;
  shortLabel: string;
  type: 'month' | 'quarter' | 'year';
  financialYear: string; // e.g. "2026-27"
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  monthIndex?: number; // 0-11
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed' | 'Upcoming';
  invoicesCount: number;
  salesTotal: number;
  taxableTotal: number;
  gstTotal: number;
  expensesCount: number;
  expensesTotal: number;
  itcTotal: number;
  netProfit: number;
  netGstPayable: number;
  quotationsCount: number;
  quotationsTotal: number;
  receivablesTotal: number;
}

/**
 * Returns Indian Financial Year string (e.g., "2026-27")
 * FY runs from April 1 to March 31
 */
export function getFinancialYear(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

/**
 * Returns Indian Quarter string ('Q1' | 'Q2' | 'Q3' | 'Q4')
 * Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
 */
export function getQuarter(dateInput: Date | string = new Date()): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = d.getMonth(); // 0 = Jan, 3 = Apr
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
}

export const QUARTER_MONTH_NAMES_EN = {
  Q1: ['April', 'May', 'June'],
  Q2: ['July', 'August', 'September'],
  Q3: ['October', 'November', 'December'],
  Q4: ['January', 'February', 'March']
};

export const QUARTER_MONTH_NAMES_HI = {
  Q1: ['अप्रैल', 'मई', 'जून'],
  Q2: ['जुलाई', 'अगस्त', 'सितंबर'],
  Q3: ['अक्टूबर', 'नवंबर', 'दिसंबर'],
  Q4: ['जनवरी', 'फरवरी', 'मार्च']
};

export const QUARTER_MONTH_NAMES = QUARTER_MONTH_NAMES_EN;

export const MONTH_NAMES_ENGLISH = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_HINDI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

/**
 * Returns start and end date of a given month
 */
export function getMonthDateRange(year: number, monthIndex: number): { start: string; end: string } {
  const start = new Date(year, monthIndex, 1).toISOString().split('T')[0];
  const end = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

/**
 * Returns date range for a quarter in a given financial year
 */
export function getQuarterDateRange(fyStartYear: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): { start: string; end: string } {
  switch (quarter) {
    case 'Q1':
      return { start: `${fyStartYear}-04-01`, end: `${fyStartYear}-06-30` };
    case 'Q2':
      return { start: `${fyStartYear}-07-01`, end: `${fyStartYear}-09-30` };
    case 'Q3':
      return { start: `${fyStartYear}-10-01`, end: `${fyStartYear}-12-31` };
    case 'Q4':
      return { start: `${fyStartYear + 1}-01-01`, end: `${fyStartYear + 1}-03-31` };
  }
}

/**
 * Builds the complete hierarchy of Financial Years, Quarters, and Monthly Files
 * from all historical and current transactions, ensuring NO DATA IS EVER LOST!
 */
export function buildPeriodHierarchy(
  invoices: Invoice[], 
  expenses: Expense[], 
  language: 'en' | 'hi' = 'en'
): {
  activePeriod: AccountingPeriodInfo;
  activeQuarter: AccountingPeriodInfo;
  activeYear: AccountingPeriodInfo;
  allYears: string[];
  periodsList: AccountingPeriodInfo[];
} {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentFyStart = currentMonth >= 3 ? currentYear : currentYear - 1;
  const currentFy = `${currentFyStart.toString().slice(-2)}-${(currentFyStart + 1).toString().slice(-2)}`;
  const currentQuarter = getQuarter(now);

  // Discover all years present in data
  const yearsSet = new Set<number>();
  yearsSet.add(currentFyStart);
  yearsSet.add(currentFyStart - 1); // include previous year as well

  invoices.forEach(inv => {
    if (inv.date) {
      const yr = new Date(inv.date).getFullYear();
      const m = new Date(inv.date).getMonth();
      const fyStart = m >= 3 ? yr : yr - 1;
      if (!isNaN(fyStart)) yearsSet.add(fyStart);
    }
  });

  expenses.forEach(exp => {
    if (exp.date) {
      const yr = new Date(exp.date).getFullYear();
      const m = new Date(exp.date).getMonth();
      const fyStart = m >= 3 ? yr : yr - 1;
      if (!isNaN(fyStart)) yearsSet.add(fyStart);
    }
  });

  const sortedFyStarts = Array.from(yearsSet).sort((a, b) => b - a);
  const periodsList: AccountingPeriodInfo[] = [];

  sortedFyStarts.forEach(fyStart => {
    const fyStr = `${fyStart.toString().slice(-2)}-${(fyStart + 1).toString().slice(-2)}`;
    const quarters: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Generate Quarters and Months
    quarters.forEach(q => {
      const qRange = getQuarterDateRange(fyStart, q);

      // Determine months belonging to this quarter
      const qMonthIndices = q === 'Q1' ? [3, 4, 5]
        : q === 'Q2' ? [6, 7, 8]
        : q === 'Q3' ? [9, 10, 11]
        : [0, 1, 2];

      qMonthIndices.forEach(mIndex => {
        const calYear = mIndex <= 2 ? fyStart + 1 : fyStart;
        const mRange = getMonthDateRange(calYear, mIndex);
        const mKey = `${calYear}-${(mIndex + 1).toString().padStart(2, '0')}`;

        // Filter invoices & expenses for this month
        const mInvoices = invoices.filter(i => i.date && i.date >= mRange.start && i.date <= mRange.end);
        const mExpenses = expenses.filter(e => e.date && e.date >= mRange.start && e.date <= mRange.end);

        const salesInvoices = mInvoices.filter(i => {
          const t = (i.type || '').toLowerCase();
          return t === 'tax invoice' || t === 'invoice' || t === 'simple invoice';
        });

        const quotationInvoices = mInvoices.filter(i => {
          const t = (i.type || '').toLowerCase();
          return t === 'quotation' || t === 'estimate';
        });

        const salesTotal = salesInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
        const taxableTotal = salesInvoices.reduce((s, i) => s + ((Number(i.subTotal) || 0) - (Number(i.discount) || 0)), 0);
        const gstTotal = salesInvoices.reduce((s, i) => s + (Number(i.gstAmount) || 0), 0);
        const expensesTotal = mExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const itcTotal = mExpenses.reduce((s, e) => {
          return e.isGstApplicable && e.isItcEligible !== false ? s + (Number(e.gstAmount) || 0) : s;
        }, 0);
        const quotationsTotal = quotationInvoices.reduce((s, q) => s + (Number(q.totalAmount) || 0), 0);

        let receivablesTotal = 0;
        salesInvoices.forEach(inv => {
          const isPaid = inv.paymentStatus === 'Paid' || inv.status === 'Paid';
          if (!isPaid) {
            receivablesTotal += inv.balanceDue !== undefined ? inv.balanceDue : (Number(inv.totalAmount) || 0);
          }
        });

        // Determine status
        let status: 'Active' | 'Completed' | 'Upcoming' = 'Completed';
        const todayStr = now.toISOString().split('T')[0];
        if (todayStr >= mRange.start && todayStr <= mRange.end) {
          status = 'Active';
        } else if (todayStr < mRange.start) {
          status = 'Upcoming';
        }

        const mName = language === 'hi' ? MONTH_NAMES_HINDI[mIndex] : MONTH_NAMES_ENGLISH[mIndex];

        periodsList.push({
          key: mKey,
          label: `${mName} ${calYear}`,
          shortLabel: language === 'hi' ? `${mName} '${calYear.toString().slice(-2)}` : `${MONTH_NAMES_ENGLISH[mIndex].slice(0, 3)} '${calYear.toString().slice(-2)}`,
          type: 'month',
          financialYear: fyStr,
          quarter: q,
          monthIndex: mIndex,
          startDate: mRange.start,
          endDate: mRange.end,
          status,
          invoicesCount: salesInvoices.length,
          salesTotal,
          taxableTotal,
          gstTotal,
          expensesCount: mExpenses.length,
          expensesTotal,
          itcTotal,
          netProfit: salesTotal - expensesTotal,
          netGstPayable: Math.max(0, gstTotal - itcTotal),
          quotationsCount: quotationInvoices.length,
          quotationsTotal,
          receivablesTotal
        });
      });
    });
  });

  // Identify current active period
  const activeMonthPeriod = periodsList.find(p => p.status === 'Active') || periodsList[0];

  // Active Quarter Summary
  const qRange = getQuarterDateRange(currentFyStart, currentQuarter);
  const qInvoices = invoices.filter(i => i.date && i.date >= qRange.start && i.date <= qRange.end && (i.type || '').toLowerCase().includes('invoice'));
  const qExpenses = expenses.filter(e => e.date && e.date >= qRange.start && e.date <= qRange.end);
  const qSales = qInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const qExp = qExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const qGst = qInvoices.reduce((s, i) => s + (Number(i.gstAmount) || 0), 0);
  const qItc = qExpenses.reduce((s, e) => e.isGstApplicable && e.isItcEligible !== false ? s + (Number(e.gstAmount) || 0) : s, 0);

  const qName = language === 'hi' ? `तिमाही ${currentQuarter}` : `Quarter ${currentQuarter}`;

  const activeQuarterPeriod: AccountingPeriodInfo = {
    key: `Q_${currentQuarter}_${currentFy}`,
    label: `${qName} (${qRange.start} to ${qRange.end})`,
    shortLabel: language === 'hi' ? `${currentQuarter} (वित्त वर्ष ${currentFy})` : `${currentQuarter} (FY ${currentFy})`,
    type: 'quarter',
    financialYear: currentFy,
    quarter: currentQuarter,
    startDate: qRange.start,
    endDate: qRange.end,
    status: 'Active',
    invoicesCount: qInvoices.length,
    salesTotal: qSales,
    taxableTotal: 0,
    gstTotal: qGst,
    expensesCount: qExpenses.length,
    expensesTotal: qExp,
    itcTotal: qItc,
    netProfit: qSales - qExp,
    netGstPayable: Math.max(0, qGst - qItc),
    quotationsCount: 0,
    quotationsTotal: 0,
    receivablesTotal: 0
  };

  const activeYearPeriod: AccountingPeriodInfo = {
    key: `FY_${currentFy}`,
    label: language === 'hi' ? `वित्तीय वर्ष ${currentFy}` : `Financial Year ${currentFy}`,
    shortLabel: `FY ${currentFy}`,
    type: 'year',
    financialYear: currentFy,
    quarter: currentQuarter,
    startDate: `${currentFyStart}-04-01`,
    endDate: `${currentFyStart + 1}-03-31`,
    status: 'Active',
    invoicesCount: 0,
    salesTotal: 0,
    taxableTotal: 0,
    gstTotal: 0,
    expensesCount: 0,
    expensesTotal: 0,
    itcTotal: 0,
    netProfit: 0,
    netGstPayable: 0,
    quotationsCount: 0,
    quotationsTotal: 0,
    receivablesTotal: 0
  };

  return {
    activePeriod: activeMonthPeriod,
    activeQuarter: activeQuarterPeriod,
    activeYear: activeYearPeriod,
    allYears: sortedFyStarts.map(s => `${s.toString().slice(-2)}-${(s + 1).toString().slice(-2)}`),
    periodsList
  };
}

/**
 * Generates and downloads the complete Official Accounting File for any Month, Quarter, or FY.
 * Formatted with UTF-8 BOM so MS Excel opens Hindi and Indian currency properly.
 */
export function exportPeriodFile(
  period: AccountingPeriodInfo,
  invoices: Invoice[],
  expenses: Expense[]
) {
  const periodInvoices = invoices.filter(i => i.date && i.date >= period.startDate && i.date <= period.endDate);
  const periodExpenses = expenses.filter(e => e.date && e.date >= period.startDate && e.date <= period.endDate);

  const sales = periodInvoices.filter(i => {
    const t = (i.type || '').toLowerCase();
    return t === 'tax invoice' || t === 'invoice' || t === 'simple invoice';
  });

  const quotes = periodInvoices.filter(i => {
    const t = (i.type || '').toLowerCase();
    return t === 'quotation' || t === 'estimate';
  });

  const headers = [
    'SECTION',
    'RECORD_TYPE',
    'DOC_NUMBER',
    'DATE',
    'PARTY_NAME',
    'GSTIN',
    'STATE_POS',
    'TAXABLE_VALUE (INR)',
    'GST_RATE (%)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'TOTAL_AMOUNT (INR)',
    'PAYMENT_STATUS',
    'NOTES / CATEGORY'
  ];

  const rows: (string | number)[][] = [];

  // Summary Row
  rows.push([
    'PERIOD_SUMMARY',
    period.type.toUpperCase(),
    period.label,
    `${period.startDate} to ${period.endDate}`,
    'ATOMIC SOLUTIONS',
    '20XXXXX0000X1Z5',
    `${ATOMIC_STATE_NAME} ${ATOMIC_STATE_CODE}`,
    period.taxableTotal.toFixed(2),
    '-',
    (period.gstTotal / 2).toFixed(2),
    (period.gstTotal / 2).toFixed(2),
    '0.00',
    period.salesTotal.toFixed(2),
    `Net Profit: ${period.netProfit.toFixed(2)}`,
    `Status: ${period.status} | ITC: ${period.itcTotal.toFixed(2)} | Net GST Payable: ${period.netGstPayable.toFixed(2)}`
  ]);

  rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);

  // Section 1: Sales Invoices
  sales.forEach(inv => {
    const taxable = inv.subTotal - (inv.discount || 0);
    const isIgst = inv.gstType === 'igst' || (inv.igstAmount && inv.igstAmount > 0);
    const cgst = isIgst ? 0 : (inv.cgstAmount ?? (inv.gstAmount || 0) / 2);
    const sgst = isIgst ? 0 : (inv.sgstAmount ?? (inv.gstAmount || 0) / 2);
    const igst = isIgst ? (inv.igstAmount ?? (inv.gstAmount || 0)) : 0;

    rows.push([
      'SALES_INVOICE',
      inv.type || 'Tax Invoice',
      inv.estimateNumber || '',
      inv.date || '',
      inv.customerName || '',
      inv.customerGSTIN || '',
      inv.customerState || `${ATOMIC_STATE_NAME} ${ATOMIC_STATE_CODE}`,
      taxable.toFixed(2),
      (inv.gstPercentage || 0).toString(),
      cgst.toFixed(2),
      sgst.toFixed(2),
      igst.toFixed(2),
      (inv.totalAmount || 0).toFixed(2),
      inv.paymentStatus || 'Unpaid',
      inv.paymentMode || 'UPI'
    ]);
  });

  rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);

  // Section 2: Quotations & Estimates
  quotes.forEach(q => {
    rows.push([
      'QUOTATION_ESTIMATE',
      q.type || 'Quotation',
      q.estimateNumber || '',
      q.date || '',
      q.customerName || '',
      q.customerGSTIN || '',
      q.customerState || '',
      (q.subTotal || 0).toFixed(2),
      (q.gstPercentage || 0).toString(),
      '0.00',
      '0.00',
      '0.00',
      (q.totalAmount || 0).toFixed(2),
      q.status || 'Active',
      q.subject || 'Commercial Rate Proposal'
    ]);
  });

  rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);

  // Section 3: Expenses
  periodExpenses.forEach(exp => {
    rows.push([
      'BUSINESS_EXPENSE',
      exp.category,
      exp.invoiceNumber || 'EXP-BILL',
      exp.date || '',
      exp.vendorName || 'Supplier',
      exp.vendorGSTIN || '',
      exp.vendorState || `${ATOMIC_STATE_NAME} ${ATOMIC_STATE_CODE}`,
      (exp.taxableAmount || exp.amount).toFixed(2),
      (exp.gstRate || 0).toString(),
      (exp.cgstAmount || 0).toFixed(2),
      (exp.sgstAmount || 0).toFixed(2),
      (exp.igstAmount || 0).toFixed(2),
      (exp.amount || 0).toFixed(2),
      exp.isItcEligible !== false ? 'ITC_Eligible' : 'No_ITC',
      `${exp.title} (${exp.paymentMode})`
    ]);
  });

  const fileName = `Atomic_${period.financialYear}_${period.quarter}_${period.key.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
  exportToCSV(fileName, headers, rows);
}
