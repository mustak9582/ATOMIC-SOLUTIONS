import React, { useState, useMemo } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  FileText, 
  Receipt, 
  CreditCard, 
  Wallet, 
  Building2, 
  User, 
  Users, 
  Phone, 
  MessageCircle, 
  Check, 
  X, 
  ExternalLink, 
  Eye, 
  RefreshCw, 
  FileSpreadsheet, 
  Printer, 
  Percent, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Archive,
  FolderCheck,
  Lock,
  Unlock,
  UserCheck,
  Share2,
  Briefcase,
  FileCheck,
  Globe
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Invoice, Expense, ExpenseCategory, BillingItem, AppSettings } from '../../types';
import { 
  formatINR,
  getExpensePaymentCategory,
  exportQuarterlyGSTR1SalesReport,
  exportQuarterlyExpenseITCSummary, 
  validateGSTIN, 
  getStateFromGSTIN, 
  isInterStateSupply, 
  calculateGSTR1, 
  calculateGSTR3B, 
  exportGSTR1B2BCSV, 
  exportGSTR3BCSV, 
  exportExpensesCSV,
  exportBankReconciliationCSV,
  exportCashBookCSV,
  ATOMIC_STATE_CODE,
  ATOMIC_STATE_NAME
} from '../../utils/gstHelper';
import { 
  buildPeriodHierarchy, 
  exportPeriodFile, 
  AccountingPeriodInfo, 
  getFinancialYear, 
  getQuarter, 
  getQuarterDateRange,
  QUARTER_MONTH_NAMES,
  QUARTER_MONTH_NAMES_EN,
  QUARTER_MONTH_NAMES_HI,
  MONTH_NAMES_ENGLISH,
  MONTH_NAMES_HINDI
} from '../../utils/accountingPeriodHelper';
import { getNextSerialNumberForInvoices } from '../../utils/serialNumberHelper';
import { dataService } from '../../services/firebaseService';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { cn, formatWhatsAppLink } from '../../lib/utils';

export interface TabAccountingProps {
  allInvoices: Invoice[];
  allExpenses: Expense[];
  appSettings?: AppSettings | null;
  navigate: (path: string) => void;
  downloadInvoicePDF: (invoice: any) => Promise<void>;
  handleDeleteInvoice: (id: string) => void;
}



export function TabAccounting({
  allInvoices,
  allExpenses,
  appSettings,
  navigate,
  downloadInvoicePDF,
  handleDeleteInvoice
}: TabAccountingProps) {
  const { language, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sales' | 'estimates' | 'expenses' | 'parties' | 'archive' | 'reports'>('overview');
  
  // Date Filtering
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'last_month' | 'quarter' | 'fy' | 'all'>('month');
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'Paid' | 'Unpaid' | 'Partial'>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expensePaymentModeFilter, setExpensePaymentModeFilter] = useState<'all' | 'Cash' | 'Bank' | 'Proprietor' | 'Reconciled' | 'Pending'>('all');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'unpaid' | 'customers' | 'vendors'>('all');
  const [selectedArchiveFy, setSelectedArchiveFy] = useState<string>(getFinancialYear());
  const [selectedReportFy, setSelectedReportFy] = useState<string>(getFinancialYear());
  const [selectedReportQuarter, setSelectedReportQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(getQuarter());
  
  // Month Lock / Unlock State for retroactive adjustments
  const [unlockedMonths, setUnlockedMonths] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('atomic_unlocked_months');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Dynamic Categories based on language
  const expenseCategories = useMemo(() => [
    { id: 'Material & Parts' as ExpenseCategory, label: language === 'hi' ? 'मटेरियल व पार्ट्स (Spare Parts)' : 'Material & Spare Parts', icon: '🔧' },
    { id: 'Fuel & Travel' as ExpenseCategory, label: language === 'hi' ? 'पेट्रोल व कन्वेंस (Fuel & Travel)' : 'Fuel & Conveyance', icon: '⛽' },
    { id: 'Technician & Labor' as ExpenseCategory, label: language === 'hi' ? 'टेक्नीशियन व लेबर (Labor/Wages)' : 'Technician & Labor Wages', icon: '👷' },
    { id: 'Rent & Utilities' as ExpenseCategory, label: language === 'hi' ? 'दुकान किराया व बिजली (Rent/Bills)' : 'Rent & Utility Bills', icon: '🏢' },
    { id: 'Tools & Equipment' as ExpenseCategory, label: language === 'hi' ? 'औजार व उपकरण (Tools)' : 'Tools & Equipment', icon: '🔨' },
    { id: 'Office & Admin' as ExpenseCategory, label: language === 'hi' ? 'ऑफिस व स्टेशनरी (Office Admin)' : 'Office & Admin Expenses', icon: '📁' },
    { id: 'Marketing & Ads' as ExpenseCategory, label: language === 'hi' ? 'प्रचार व विज्ञापन (Marketing)' : 'Marketing & Advertising', icon: '📢' },
    { id: 'Taxes & Govt Fees' as ExpenseCategory, label: language === 'hi' ? 'टैक्स व सरकारी फीस (Tax/Govt)' : 'Taxes & Government Fees', icon: '🏛️' },
    { id: 'Other' as ExpenseCategory, label: language === 'hi' ? 'अन्य खर्चे (Miscellaneous)' : 'Miscellaneous Expenses', icon: '📦' }
  ], [language]);

  // Period Hierarchy (Indian FY, Quarters, Months with Active tracking)
  const periodData = useMemo(() => {
    return buildPeriodHierarchy(allInvoices, allExpenses, language);
  }, [allInvoices, allExpenses, language]);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    title: string;
    category: ExpenseCategory;
    amount: string;
    date: string;
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
    vendorName: string;
    vendorPhone: string;
    vendorGSTIN: string;
    isGstApplicable: boolean;
    gstRate: number;
    isItcEligible: boolean;
    invoiceNumber: string;
    notes: string;
    bankTransactionId: string;
    reconciledWithBank: boolean;
  }>({
    title: '',
    category: 'Material & Parts',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    vendorName: '',
    vendorPhone: '',
    vendorGSTIN: '',
    isGstApplicable: false,
    gstRate: 18,
    isItcEligible: true,
    invoiceNumber: '',
    notes: '',
    bankTransactionId: '',
    reconciledWithBank: false
  });

  // Record Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentBankTxId, setPaymentBankTxId] = useState<string>('');
  const [paymentReconciled, setPaymentReconciled] = useState<boolean>(false);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Estimate Convert Confirmation State
  const [estimateToConvert, setEstimateToConvert] = useState<Invoice | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Period Date Range Filter (Strictly pure single language based on language setting)
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentFyStart = currentMonth >= 3 ? currentYear : currentYear - 1;

    if (selectedPeriod === 'month') {
      const start = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      const mName = language === 'hi' ? MONTH_NAMES_HINDI[currentMonth] : MONTH_NAMES_ENGLISH[currentMonth];
      return { start, end, label: `${mName} ${currentYear}` };
    }
    if (selectedPeriod === 'last_month') {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();
      const start = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0];
      const end = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];
      const mName = language === 'hi' ? MONTH_NAMES_HINDI[prevMonth] : MONTH_NAMES_ENGLISH[prevMonth];
      return { start, end, label: `${mName} ${prevYear}` };
    }
    if (selectedPeriod === 'quarter') {
      const curQuarter = getQuarter(now);
      const qRange = getQuarterDateRange(currentFyStart, curQuarter);
      const qMonths = language === 'hi'
        ? (curQuarter === 'Q1' ? 'अप्रैल - जून' : curQuarter === 'Q2' ? 'जुलाई - सितंबर' : curQuarter === 'Q3' ? 'अक्टूबर - दिसंबर' : 'जनवरी - मार्च')
        : (curQuarter === 'Q1' ? 'Apr - Jun' : curQuarter === 'Q2' ? 'Jul - Sep' : curQuarter === 'Q3' ? 'Oct - Dec' : 'Jan - Mar');
      return { 
        start: qRange.start, 
        end: qRange.end, 
        label: language === 'hi' ? `तिमाही ${curQuarter} (${qMonths})` : `Quarter ${curQuarter} (${qMonths})` 
      };
    }
    if (selectedPeriod === 'fy') {
      const start = `${currentFyStart}-04-01`;
      const end = `${currentFyStart + 1}-03-31`;
      return { 
        start, 
        end, 
        label: language === 'hi' ? `वित्त वर्ष 20${currentFyStart.toString().slice(-2)}-20${(currentFyStart + 1).toString().slice(-2)}` : `FY 20${currentFyStart.toString().slice(-2)}-20${(currentFyStart + 1).toString().slice(-2)}` 
      };
    }
    return { start: '1970-01-01', end: '2099-12-31', label: t('All Time', 'सभी समय') };
  }, [selectedPeriod, language, t]);

  // Filtered Data based on Period
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const invDate = inv.date || (inv.timestamp ? new Date(inv.timestamp).toISOString().split('T')[0] : '');
      if (!invDate) return true;
      return invDate >= dateRange.start && invDate <= dateRange.end;
    });
  }, [allInvoices, dateRange]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const expDate = exp.date;
      if (!expDate) return true;
      return expDate >= dateRange.start && expDate <= dateRange.end;
    });
  }, [allExpenses, dateRange]);

  // Sales (Tax Invoices) vs Estimates
  const salesInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => {
      const type = (inv.type || '').toLowerCase();
      return type === 'tax invoice' || type === 'invoice' || type === 'simple invoice';
    });
  }, [filteredInvoices]);

  const estimateInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => {
      const type = (inv.type || '').toLowerCase();
      return type === 'estimate' || type === 'quotation';
    });
  }, [filteredInvoices]);

  // Filtered Estimates
  const displayedEstimates = useMemo(() => {
    return estimateInvoices.filter(est => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (est.estimateNumber || '').toLowerCase().includes(q) ||
        (est.customerName || '').toLowerCase().includes(q) ||
        (est.subject || '').toLowerCase().includes(q)
      );
    });
  }, [estimateInvoices, searchQuery]);

  // Financial Summary KPIs (with Cash vs Bank Reconciliation metrics)
  const financialSummary = useMemo(() => {
    // Total Sales
    const totalSales = salesInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const taxableSales = salesInvoices.reduce((sum, inv) => {
      const sub = inv.subTotal || 0;
      const disc = inv.discount || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);

    // GST Breakdown
    const outputGst = salesInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
    const outputCgst = salesInvoices.reduce((sum, inv) => sum + (inv.cgstAmount || (inv.gstAmount ? inv.gstAmount / 2 : 0)), 0);
    const outputSgst = salesInvoices.reduce((sum, inv) => sum + (inv.sgstAmount || (inv.gstAmount ? inv.gstAmount / 2 : 0)), 0);
    const outputIgst = salesInvoices.reduce((sum, inv) => sum + (inv.igstAmount || 0), 0);

    // Total Expenses
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const itcEligibleGst = filteredExpenses
      .filter(exp => exp.isItcEligible !== false && exp.isGstApplicable)
      .reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);

    // Receivables (Unpaid or Partial)
    const totalReceivables = salesInvoices.reduce((sum, inv) => {
      if (inv.paymentStatus === 'Paid') return sum;
      if (inv.balanceDue !== undefined) return sum + inv.balanceDue;
      if (inv.paymentStatus === 'Partial' && inv.paidAmount) {
        return sum + Math.max(0, (inv.totalAmount || 0) - inv.paidAmount);
      }
      return sum + (inv.totalAmount || 0);
    }, 0);

    // Total Received
    const totalCollected = salesInvoices.reduce((sum, inv) => {
      if (inv.paymentStatus === 'Paid') return sum + (inv.totalAmount || 0);
      if (inv.paidAmount) return sum + inv.paidAmount;
      return sum;
    }, 0);

    // Cash vs Bank Separation (Critical for CA Reconciliation)
    const cashSales = salesInvoices.reduce((sum, inv) => {
      const mode = (inv.paymentMode || '').toLowerCase();
      const isCash = mode === 'cash' || mode.includes('नकद');
      const amt = inv.paymentStatus === 'Paid' ? (inv.totalAmount || 0) : (inv.paidAmount || 0);
      return isCash ? sum + amt : sum;
    }, 0);

    const bankSales = salesInvoices.reduce((sum, inv) => {
      const mode = (inv.paymentMode || '').toLowerCase();
      const isBank = mode.includes('upi') || mode.includes('bank') || mode.includes('transfer') || mode.includes('cheque') || mode === 'online' || (!mode && inv.paymentStatus === 'Paid');
      const isCash = mode === 'cash' || mode.includes('नकद');
      const amt = inv.paymentStatus === 'Paid' ? (inv.totalAmount || 0) : (inv.paidAmount || 0);
      return (!isCash && isBank) ? sum + amt : sum;
    }, 0);

    const cashExpenses = filteredExpenses.reduce((sum, exp) => {
      return getExpensePaymentCategory(exp.paymentMode) === 'cash' ? sum + (exp.amount || 0) : sum;
    }, 0);

    const bankExpenses = filteredExpenses.reduce((sum, exp) => {
      return getExpensePaymentCategory(exp.paymentMode) === 'bank' ? sum + (exp.amount || 0) : sum;
    }, 0);

    const proprietorCapitalExpenses = filteredExpenses.reduce((sum, exp) => {
      return getExpensePaymentCategory(exp.paymentMode) === 'proprietor_capital' ? sum + (exp.amount || 0) : sum;
    }, 0);

    const cashInHand = cashSales - cashExpenses;
    const netBankFlow = bankSales - bankExpenses;

    const totalBankRecords = filteredExpenses.filter(e => {
      const m = (e.paymentMode || '').toLowerCase();
      return m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque');
    }).length + salesInvoices.filter(i => {
      const isPaid = i.paymentStatus === 'Paid' || (i.paidAmount && i.paidAmount > 0);
      const m = (i.paymentMode || '').toLowerCase();
      return isPaid && (m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque'));
    }).length;

    const matchedBankRecords = filteredExpenses.filter(e => {
      const m = (e.paymentMode || '').toLowerCase();
      return (m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque')) && e.reconciledWithBank;
    }).length + salesInvoices.filter(i => {
      const isPaid = i.paymentStatus === 'Paid' || (i.paidAmount && i.paidAmount > 0);
      const m = (i.paymentMode || '').toLowerCase();
      return isPaid && (m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque')) && i.reconciledWithBank;
    }).length;

    // Net Profit = (Taxable Sales - Expenses Excluding Recoverable GST)
    const netProfit = (taxableSales - (totalExpenses - itcEligibleGst));
    const isNetGstPayable = outputGst >= itcEligibleGst;
    const netGstPayable = Math.max(0, outputGst - itcEligibleGst);
    const itcBalance = Math.max(0, itcEligibleGst - outputGst);

    // Estimates summary
    const totalEstimatesValue = estimateInvoices.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
    const convertedEstimatesCount = estimateInvoices.filter(est => est.status === 'Converted').length;

    return {
      totalSales,
      taxableSales,
      outputGst,
      outputCgst,
      outputSgst,
      outputIgst,
      totalExpenses,
      itcEligibleGst,
      totalReceivables,
      totalCollected,
      cashSales,
      bankSales,
      cashExpenses,
      bankExpenses,
      cashInHand,
      netBankFlow,
      proprietorCapitalExpenses,
      totalBankRecords,
      matchedBankRecords,
      netProfit,
      isNetGstPayable,
      netGstPayable,
      itcBalance,
      totalEstimatesValue,
      estimatesCount: estimateInvoices.length,
      convertedEstimatesCount,
      invoicesCount: salesInvoices.length,
      expensesCount: filteredExpenses.length
    };
  }, [salesInvoices, filteredExpenses, estimateInvoices]);

  // Expenses Categorization Breakdown
  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    expenseCategories.forEach(c => map.set(c.id, 0));

    filteredExpenses.forEach(exp => {
      const current = map.get(exp.category) || 0;
      map.set(exp.category, current + (exp.amount || 0));
    });

    return Array.from(map.entries()).map(([cat, total]) => ({
      category: cat,
      total,
      percentage: financialSummary.totalExpenses > 0 ? (total / financialSummary.totalExpenses) * 100 : 0
    }));
  }, [filteredExpenses, financialSummary.totalExpenses, expenseCategories]);

  // Parties Ledger (Customers & Vendors combined)
  const partiesList = useMemo(() => {
    const customerMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      gstin: string;
      type: 'Customer';
      totalBilled: number;
      totalPaid: number;
      balanceDue: number;
      invoicesCount: number;
      lastDate: string;
    }>();

    allInvoices.forEach(inv => {
      const name = (inv.customerName || 'Cash Customer').trim();
      if (!name) return;
      const key = `${name}_${inv.customerPhone || ''}`;
      const existing = customerMap.get(key) || {
        id: key,
        name,
        phone: inv.customerPhone || '',
        gstin: inv.customerGSTIN || '',
        type: 'Customer',
        totalBilled: 0,
        totalPaid: 0,
        balanceDue: 0,
        invoicesCount: 0,
        lastDate: inv.date || ''
      };

      const billAmt = inv.totalAmount || 0;
      const paid = inv.paymentStatus === 'Paid' ? billAmt : (inv.paidAmount || 0);
      const balance = inv.balanceDue !== undefined ? inv.balanceDue : (billAmt - paid);

      existing.totalBilled += billAmt;
      existing.totalPaid += paid;
      existing.balanceDue += Math.max(0, balance);
      existing.invoicesCount += 1;
      if (inv.date && inv.date > existing.lastDate) existing.lastDate = inv.date;

      customerMap.set(key, existing);
    });

    const vendorMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      gstin: string;
      type: 'Vendor';
      totalBilled: number;
      totalPaid: number;
      balanceDue: number;
      invoicesCount: number;
      lastDate: string;
    }>();

    allExpenses.forEach(exp => {
      const name = (exp.vendorName || 'General Supplier').trim();
      if (!name) return;
      const key = `vnd_${name}_${exp.vendorPhone || ''}`;
      const existing = vendorMap.get(key) || {
        id: key,
        name,
        phone: exp.vendorPhone || '',
        gstin: exp.vendorGSTIN || '',
        type: 'Vendor',
        totalBilled: 0,
        totalPaid: 0,
        balanceDue: 0,
        invoicesCount: 0,
        lastDate: exp.date || ''
      };

      existing.totalBilled += exp.amount || 0;
      existing.totalPaid += exp.amount || 0;
      existing.invoicesCount += 1;
      if (exp.date && exp.date > existing.lastDate) existing.lastDate = exp.date;

      vendorMap.set(key, existing);
    });

    return [...Array.from(customerMap.values()), ...Array.from(vendorMap.values())];
  }, [allInvoices, allExpenses]);

  // GSTR Returns Calculations
  const gstr1Data = useMemo(() => calculateGSTR1(salesInvoices), [salesInvoices]);
  const gstr3bData = useMemo(() => calculateGSTR3B(salesInvoices, filteredExpenses), [salesInvoices, filteredExpenses]);

  // Toggle Reconciled with Bank Statement for Expenses
  const handleToggleReconcileExpense = async (expense: Expense) => {
    if (!expense.id) return;
    const nextStatus = !expense.reconciledWithBank;
    try {
      await dataService.updateDoc('expenses', expense.id, {
        reconciledWithBank: nextStatus
      });
      toast.success(nextStatus ? t('Matched with bank statement', 'बैंक खाते से मैच हो गया') : t('Marked as pending match', 'बैंक मिलान पेंडिंग किया गया'));
    } catch {
      toast.error(t('Failed to update', 'अपडेट करने में त्रुटि'));
    }
  };

  // Toggle Reconciled with Bank Statement for Invoices
  const handleToggleReconcileInvoice = async (invoice: Invoice) => {
    if (!invoice.id) return;
    const nextStatus = !invoice.reconciledWithBank;
    try {
      await dataService.updateDoc('invoices', invoice.id, {
        reconciledWithBank: nextStatus
      });
      toast.success(nextStatus ? t('Bank credit matched', 'बैंक क्रेडिट मैच हो गया') : t('Marked as pending match', 'बैंक मिलान पेंडिंग किया गया'));
    } catch {
      toast.error(t('Failed to update', 'अपडेट करने में त्रुटि'));
    }
  };

  // Expense Modal Handlers
  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpenseId(expense.id || null);
      const isGst = expense.isGstApplicable || Boolean(expense.vendorGSTIN);
      setExpenseForm({
        title: expense.title,
        category: expense.category,
        amount: expense.amount.toString(),
        date: expense.date,
        paymentMode: expense.paymentMode,
        payeeName: expense.payeeName || expense.vendorName || '',
        vendorName: expense.vendorName || '',
        vendorPhone: expense.vendorPhone || '',
        vendorGSTIN: expense.vendorGSTIN || '',
        is_gst_registered_vendor: isGst,
        isGstApplicable: isGst,
        taxableAmount: expense.taxableAmount ? expense.taxableAmount.toString() : '',
        gstRate: expense.gstRate || 18,
        isItcEligible: expense.isItcEligible !== false,
        invoiceNumber: expense.invoiceNumber || '',
        notes: expense.notes || '',
        bankTransactionId: expense.bankTransactionId || '',
        reconciledWithBank: expense.reconciledWithBank || false
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({
        title: '',
        category: 'Material & Parts',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'SBI Current A/c (Online/UPI/NetBanking)',
        payeeName: '',
        vendorName: '',
        vendorPhone: '',
        vendorGSTIN: '',
        is_gst_registered_vendor: false,
        isGstApplicable: false,
        taxableAmount: '',
        gstRate: 18,
        isItcEligible: true,
        invoiceNumber: '',
        notes: '',
        bankTransactionId: '',
        reconciledWithBank: false
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async () => {
    const isGstBill = expenseForm.is_gst_registered_vendor;
    let finalAmount = parseFloat(expenseForm.amount) || 0;
    let taxableAmount = finalAmount;
    let gstAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isGstBill) {
      const enteredTaxable = parseFloat(expenseForm.taxableAmount);
      const rate = expenseForm.gstRate || 18;
      
      if (!isNaN(enteredTaxable) && enteredTaxable > 0) {
        taxableAmount = enteredTaxable;
        gstAmount = (taxableAmount * rate) / 100;
        finalAmount = taxableAmount + gstAmount;
      } else if (finalAmount > 0) {
        taxableAmount = finalAmount / (1 + rate / 100);
        gstAmount = finalAmount - taxableAmount;
      }

      if (!expenseForm.vendorName.trim()) {
        toast.error(t('Please enter Vendor / Supplier Name for GST Purchase Bill', 'कृपया जीएसटी बिल हेतु सप्लायर का नाम भरें'));
        return;
      }

      const isIgst = Boolean(
        expenseForm.vendorGSTIN && 
        expenseForm.vendorGSTIN.trim().substring(0, 2) !== ATOMIC_STATE_CODE
      );

      if (isIgst) {
        igstAmount = gstAmount;
      } else {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      }
    }

    if (finalAmount <= 0) {
      toast.error(t('Please enter a valid amount', 'कृपया सही राशि भरें'));
      return;
    }

    const expDate = expenseForm.date || new Date().toISOString().split('T')[0];
    const expFy = getFinancialYear(expDate);
    const expQuarter = getQuarter(expDate);
    const payCategory = getExpensePaymentCategory(expenseForm.paymentMode);

    const payload: Omit<Expense, 'id'> = {
      title: expenseForm.title.trim() || (isGstBill ? `${expenseForm.vendorName.trim()} Purchase Bill` : `${expenseForm.category} Expense`),
      category: expenseForm.category,
      amount: finalAmount,
      date: expDate,
      financialYear: expFy,
      quarter: expQuarter,
      paymentMode: expenseForm.paymentMode,
      payeeName: expenseForm.payeeName.trim(),
      vendorName: isGstBill ? expenseForm.vendorName.trim() : (expenseForm.payeeName.trim() || 'Site Payee'),
      vendorPhone: expenseForm.vendorPhone.trim(),
      vendorGSTIN: isGstBill ? expenseForm.vendorGSTIN.trim().toUpperCase() : '',
      isGstApplicable: isGstBill,
      isGstRegisteredVendor: isGstBill,
      gstRate: isGstBill ? expenseForm.gstRate : 0,
      taxableAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      isItcEligible: isGstBill ? expenseForm.isItcEligible : false,
      invoiceNumber: expenseForm.invoiceNumber.trim(),
      notes: expenseForm.notes.trim(),
      bankTransactionId: expenseForm.bankTransactionId.trim(),
      bankAccountName: payCategory === 'proprietor_capital' 
        ? 'Proprietor Personal Capital' 
        : payCategory === 'cash' 
          ? 'Cash Counter' 
          : 'SBI Current Account',
      reconciledWithBank: payCategory === 'bank' ? expenseForm.reconciledWithBank : false,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingExpenseId) {
        await dataService.updateDoc('expenses', editingExpenseId, payload);
        toast.success(t('Expense updated successfully', 'खर्चा सफलतापूर्वक अपडेट हो गया'));
      } else {
        await dataService.addDoc('expenses', payload);
        const qMonths = language === 'hi'
          ? (expQuarter === 'Q1' ? 'अप्रैल-जून' : expQuarter === 'Q2' ? 'जुलाई-सितंबर' : expQuarter === 'Q3' ? 'अक्टूबर-दिसंबर' : 'जनवरी-मार्च')
          : (expQuarter === 'Q1' ? 'Apr-Jun' : expQuarter === 'Q2' ? 'Jul-Sep' : expQuarter === 'Q3' ? 'Oct-Dec' : 'Jan-Mar');
        toast.success(t(
          `Expense recorded in ${expQuarter} (${qMonths}) • FY ${expFy}`,
          `खर्चा तिमाही ${expQuarter} (${qMonths}) • वित्त वर्ष ${expFy} में दर्ज हुआ`
        ));
      }
      setIsExpenseModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t('Failed to save expense', 'खर्चा सहेजने में त्रुटि'));
    }
  };

  // Month Lock / Unlock Toggle for retroactive adjustments
  const handleToggleMonthLock = (mPeriod: AccountingPeriodInfo) => {
    const mKey = mPeriod.key;
    const isCurrentlyUnlocked = Boolean(unlockedMonths[mKey]);
    const nextStatus = !isCurrentlyUnlocked;

    const nextUnlocked = { ...unlockedMonths, [mKey]: nextStatus };
    setUnlockedMonths(nextUnlocked);
    localStorage.setItem('atomic_unlocked_months', JSON.stringify(nextUnlocked));

    if (nextStatus) {
      toast.success(
        t(
          `Month ${mPeriod.label} Unlocked! You can now record retroactive site expenses, petty cash, or bills.`,
          `माह ${mPeriod.label} अनलॉक हो गया! अब आप पिछले छूटे हुए खर्चे या बिल दर्ज कर सकते हैं।`
        )
      );
    } else {
      exportPeriodFile(mPeriod, allInvoices, allExpenses);
      toast.success(
        t(
          `Month ${mPeriod.label} Re-locked! Net margin recalculated and updated CSV snapshot downloaded.`,
          `माह ${mPeriod.label} पुनः लॉक हो गया! शुद्ध लाभ पुनर्गणित हुआ और अद्यतन CSV स्नैपशॉट डाउनलोड हो गया।`
        )
      );
    }
  };

  const handleAddRetroactiveExpense = (mPeriod: AccountingPeriodInfo) => {
    handleOpenExpenseModal();
    setExpenseForm(prev => ({
      ...prev,
      date: mPeriod.startDate
    }));
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm(t('Are you sure you want to delete this expense?', 'क्या आप सचमुच यह खर्चा हटाना चाहते हैं?'))) return;
    try {
      await dataService.deleteDoc('expenses', id);
      toast.success(t('Expense deleted', 'खर्चा हटा दिया गया'));
    } catch (e) {
      toast.error(t('Failed to delete expense', 'खर्चा हटाने में विफल'));
    }
  };

  // Convert Estimate to Official Tax Invoice
  const handleConfirmConvertEstimate = async () => {
    if (!estimateToConvert) return;
    setIsConverting(true);
    try {
      const nextSerial = getNextSerialNumberForInvoices('Tax Invoice', allInvoices);

      const newTaxInvoice: Omit<Invoice, 'id'> = {
        ...estimateToConvert,
        type: 'Tax Invoice',
        estimateNumber: nextSerial,
        status: 'Sent',
        paymentStatus: 'Unpaid',
        paidAmount: 0,
        balanceDue: estimateToConvert.totalAmount,
        date: new Date().toISOString().split('T')[0],
        convertedFromEstimateNumber: estimateToConvert.estimateNumber,
        createdAt: new Date().toISOString()
      };

      const newInv = await dataService.addDoc('invoices', newTaxInvoice);

      if (estimateToConvert.id) {
        await dataService.updateDoc('invoices', estimateToConvert.id, {
          status: 'Converted',
          convertedToInvoiceNumber: nextSerial
        });
      }

      toast.success(
        t(`${estimateToConvert.type || 'Estimate'} ${estimateToConvert.estimateNumber} converted to Tax Invoice ${nextSerial}!`, `${estimateToConvert.type || 'कोटेशन'} ${estimateToConvert.estimateNumber} टैक्स इनवॉइस ${nextSerial} में बदल गया!`),
        {
          action: {
            label: t('View Bill', 'बिल देखें'),
            onClick: () => navigate(`/invoice/${newInv?.id || ''}`)
          }
        }
      );

      setEstimateToConvert(null);
    } catch (e) {
      console.error(e);
      toast.error(t('Failed to convert estimate', 'कन्वर्ट करने में त्रुटि आई'));
    } finally {
      setIsConverting(false);
    }
  };

  // Payment Recording Handler
  const handleOpenPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    const remaining = invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount || 0);
    setPaymentAmount(remaining.toString());
    setPaymentMode(invoice.paymentMode || 'UPI');
    setPaymentBankTxId(invoice.bankTransactionId || '');
    setPaymentReconciled(invoice.reconciledWithBank || false);
    setPaymentNotes(invoice.paymentNotes || '');
  };

  const handleSavePayment = async () => {
    if (!paymentModalInvoice || !paymentModalInvoice.id) return;
    const payAmt = parseFloat(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error(t('Please enter a valid payment amount', 'कृपया सही भुगतान राशि भरें'));
      return;
    }

    const currentTotal = paymentModalInvoice.totalAmount || 0;
    const currentPaid = paymentModalInvoice.paidAmount || 0;
    const newPaidTotal = Math.min(currentTotal, currentPaid + payAmt);
    const newBalanceDue = Math.max(0, currentTotal - newPaidTotal);
    const newPaymentStatus = newBalanceDue === 0 ? 'Paid' : 'Partial';

    try {
      await dataService.updateDoc('invoices', paymentModalInvoice.id, {
        paidAmount: newPaidTotal,
        balanceDue: newBalanceDue,
        paymentStatus: newPaymentStatus,
        status: newBalanceDue === 0 ? 'Paid' : 'Sent',
        paymentMode,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentNotes: paymentNotes.trim(),
        bankTransactionId: paymentBankTxId.trim(),
        reconciledWithBank: paymentReconciled
      });

      toast.success(t(`Payment of ₹${payAmt.toLocaleString('en-IN')} recorded successfully! (${paymentMode === 'Cash' ? 'Cash Book' : 'Bank Ledger'})`, `भुगतान ₹${payAmt.toLocaleString('en-IN')} दर्ज हुआ!`));
      setPaymentModalInvoice(null);
    } catch (e) {
      console.error(e);
      toast.error(t('Failed to record payment', 'भुगतान दर्ज करने में त्रुटि'));
    }
  };

  const sendWhatsAppReminder = (partyName: string, phone: string, balanceDue: number) => {
    if (!phone) {
      toast.error(t('Phone number not available', 'मोबाइल नंबर उपलब्ध नहीं है'));
      return;
    }
    const upi = appSettings?.upiId || '9582268658@ybl';
    const compName = appSettings?.companyName || 'ATOMIC SOLUTIONS';
    const message = `*Dear ${partyName},*\n\nThis is a gentle payment reminder from *${compName}*. Outstanding balance on your account is *₹${balanceDue.toLocaleString('en-IN')}*.\n\nYou may transfer the payment to:\n*UPI ID:* ${upi}\n\nPlease share screenshot once done. Thank you!\n*${compName}*`;
    window.open(formatWhatsAppLink(phone, message), '_blank');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* TOP HEADER: BRANDING & SUITE TITLE */}
      <div className="bg-gradient-to-r from-[#001f3f] via-[#002b54] to-[#001f3f] rounded-[32px] p-6 lg:p-8 text-white shadow-xl border border-teal/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-teal/20 border border-teal/40 flex items-center justify-center text-teal shadow-inner">
                <Receipt size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                    {t('Business & GST Accounting', 'व्यापार व जीएसटी अकाउंटिंग')}
                  </h1>
                  <Badge className="bg-teal text-navy font-black text-[10px] tracking-widest uppercase">
                    Vyapar MSME Suite
                  </Badge>
                </div>
                <p className="text-xs text-teal/80 font-semibold tracking-wide mt-1">
                  Atomic Solutions • {t('GST Compliance, Invoicing, Cash vs Bank Reconciliation & CA Audit Reports', 'जीएसटी कम्प्लायंस, बिलिंग, कैश vs बैंक समाधान व CA रिपोर्ट्स')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full font-bold">
                <ShieldCheck size={14} className="text-teal" /> GSTIN: {appSettings?.ownerGSTIN || '20XXXXX0000X1Z5'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full font-bold">
                <Building2 size={14} className="text-teal" /> {t('State', 'राज्य')}: {ATOMIC_STATE_NAME} ({ATOMIC_STATE_CODE})
              </span>
              <span className="flex items-center gap-1.5 bg-teal/20 text-teal px-3 py-1 rounded-full font-black">
                <Sparkles size={14} /> {t('Active File', 'चालू फाइल')}: {periodData.activePeriod.label} ({periodData.activeQuarter.quarter})
              </span>
            </div>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              onClick={() => navigate('/admin/invoice-generator')}
              className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-2xl h-11 px-5 shadow-lg shadow-teal/20 flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} /> {t('New Tax Invoice', 'नया टैक्स इनवॉइस')}
            </Button>

            <Button
              onClick={() => handleOpenExpenseModal()}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs uppercase tracking-wider rounded-2xl h-11 px-4 shadow-sm flex items-center gap-2"
            >
              <Wallet size={16} /> {t('+ Add Expense', '+ खर्चा जोड़ें')}
            </Button>

            <Button
              onClick={() => setActiveSubTab('archive')}
              variant="outline"
              className="bg-navy/60 hover:bg-navy text-teal border border-teal/40 font-bold text-xs rounded-2xl h-11 px-4 shadow-sm flex items-center gap-1.5"
              title="Period Files Archive"
            >
              <Archive size={16} /> {t('Period Files', 'फाइल पुरालेख')}
            </Button>
          </div>
        </div>

        {/* TIME PERIOD SELECTOR STRIP */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-teal" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal/90">
              {t('Select Reporting Period:', 'समय अवधि चुनें:')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-navy/80 p-1.5 rounded-2xl border border-white/10">
            {[
              { id: 'month', label: t('This Month', 'इस महीने') },
              { id: 'last_month', label: t('Last Month', 'पिछला महीना') },
              { id: 'quarter', label: t('This Quarter', 'इस तिमाही') },
              { id: 'fy', label: t('Financial Year 26-27', 'चालू वित्त वर्ष') },
              { id: 'all', label: t('All Time', 'सभी समय') }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                  selectedPeriod === p.id 
                    ? "bg-teal text-navy shadow-md" 
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 TOP KPI CARDS (FINANCIAL HEALTH & GST SNAPSHOT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. TOTAL SALES */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('Total Sales', 'कुल बिक्री')}</span>
            <div className="w-8 h-8 rounded-xl bg-teal/15 text-navy flex items-center justify-center font-bold">
              <TrendingUp size={16} className="text-teal" />
            </div>
          </div>
          <div className="text-2xl font-black text-navy tracking-tight">
            {formatINR(financialSummary.totalSales)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-bold">
            <span>{financialSummary.invoicesCount} {t('invoices', 'बिल')}</span>
            <span className="text-teal font-extrabold">{t('Taxable', 'कर योग्य')}: {formatINR(financialSummary.taxableSales)}</span>
          </div>
        </div>

        {/* 2. TOTAL EXPENSES */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('Total Expenses', 'कुल खर्चे')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-navy tracking-tight">
            {formatINR(financialSummary.totalExpenses)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-bold">
            <span>{financialSummary.expensesCount} {t('records', 'खर्चे')}</span>
            <span className="text-rose-600 font-extrabold">ITC: {formatINR(financialSummary.itcEligibleGst)}</span>
          </div>
        </div>

        {/* 3. NET PROFIT */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('Net Profit', 'शुद्ध मुनाफा')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className={cn(
            "text-2xl font-black tracking-tight",
            financialSummary.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
          )}>
            {formatINR(financialSummary.netProfit)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-bold">
            <span>{t('Margin', 'मार्जिन')}:</span>
            <span className="font-extrabold text-navy">
              {financialSummary.taxableSales > 0 
                ? `${((financialSummary.netProfit / financialSummary.taxableSales) * 100).toFixed(1)}%` 
                : '0%'}
            </span>
          </div>
        </div>

        {/* 4. GST STATUS: PAYABLE OR ITC RECEIVABLE */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              {financialSummary.isNetGstPayable 
                ? t('Net GST Payable', 'देय जीएसटी (Payable)') 
                : t('GST ITC Balance', 'इनपुट टैक्स क्रेडिट (ITC)')}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold",
              financialSummary.isNetGstPayable ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
            )}>
              <Building2 size={16} />
            </div>
          </div>
          <div className={cn(
            "text-2xl font-black tracking-tight",
            financialSummary.isNetGstPayable ? "text-indigo-600" : "text-emerald-600"
          )}>
            {formatINR(financialSummary.isNetGstPayable ? financialSummary.netGstPayable : financialSummary.itcBalance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 font-bold">
            <span>{t('Output', 'आउटपुट')}: {formatINR(financialSummary.outputGst)}</span>
            <span className="text-emerald-600 font-extrabold">{t('ITC', 'इनपुट')}: {formatINR(financialSummary.itcEligibleGst)}</span>
          </div>
        </div>

        {/* 5. RECEIVABLES (उधारी) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('Receivables', 'बाकी उधारी')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {formatINR(financialSummary.totalReceivables)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-bold">
            <span>{t('Collected', 'वसूल हुआ')}:</span>
            <span className="text-teal font-extrabold">{formatINR(financialSummary.totalCollected)}</span>
          </div>
        </div>

        {/* 6. CASH IN HAND (रोकड़ गल्ला) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('Cash in Hand', 'हाथ में नकद')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Wallet size={16} />
            </div>
          </div>
          <div className={cn(
            "text-2xl font-black tracking-tight",
            financialSummary.cashInHand >= 0 ? "text-amber-700" : "text-rose-600"
          )}>
            {formatINR(financialSummary.cashInHand)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-bold">
            <span>{t('Cash Sales', 'नकद बिक्री')}: {formatINR(financialSummary.cashSales)}</span>
            <span className="text-rose-600">{t('Out', 'खर्च')}: {formatINR(financialSummary.cashExpenses)}</span>
          </div>
        </div>
      </div>

      {/* DEDICATED CASH BOOK, BANK RECONCILIATION & PROPRIETOR CAPITAL HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. BANK & UPI LEDGER (FOR BANK STATEMENT MATCHING) */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 rounded-3xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                    {t('Bank & Online Ledger', 'बैंक व ऑनलाइन खाता')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    SBI Current A/c (Online/UPI/NetBanking)
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => exportBankReconciliationCSV(salesInvoices, filteredExpenses)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-xl h-8 px-3 shadow-sm flex items-center gap-1 shrink-0"
                title="Download Bank Statement Reconciliation CSV for CA"
              >
                <Download size={13} /> {t('Bank CSV', 'बैंक CSV')}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-white/80 rounded-2xl border border-indigo-100/80 text-center text-xs my-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Bank Inflow', 'बैंक जमा')}</span>
                <span className="font-black text-emerald-700 text-sm">{formatINR(financialSummary.bankSales)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Bank Outflow', 'बैंक खर्चे')}</span>
                <span className="font-black text-rose-600 text-sm">{formatINR(financialSummary.bankExpenses)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Net Bank Flow', 'शुद्ध बैंक')}</span>
                <span className={cn("font-black text-sm", financialSummary.netBankFlow >= 0 ? "text-indigo-700" : "text-rose-600")}>
                  {formatINR(financialSummary.netBankFlow)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-indigo-50">
            <span className="text-gray-500 font-semibold flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {t('Bank Match Status:', 'पासबुक मिलान:')}
            </span>
            <Badge className="bg-indigo-100 text-indigo-900 font-black text-[10px]">
              {financialSummary.matchedBankRecords} / {financialSummary.totalBankRecords} {t('Matched', 'मिलान')}
            </Badge>
          </div>
        </div>

        {/* 2. CASH LEDGER / PETTY CASH (CASH IN HAND) */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-3xl p-6 border border-amber-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                    {t('Cash Book (Petty Cash)', 'रोकड़ बही / कैश लेजर')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Cash-in-Hand (Site Petty Cash)
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => exportCashBookCSV(salesInvoices, filteredExpenses)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase rounded-xl h-8 px-3 shadow-sm flex items-center gap-1 shrink-0"
                title="Download Official Cash Book CSV for CA"
              >
                <Download size={13} /> {t('Cash CSV', 'कैश CSV')}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-white/80 rounded-2xl border border-amber-100/80 text-center text-xs my-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Cash In', 'नकद बिक्री')}</span>
                <span className="font-black text-emerald-700 text-sm">{formatINR(financialSummary.cashSales)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Cash Out', 'नकद खर्चे')}</span>
                <span className="font-black text-rose-600 text-sm">{formatINR(financialSummary.cashExpenses)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Cash Balance', 'गल्ला शेष')}</span>
                <span className={cn("font-black text-sm", financialSummary.cashInHand >= 0 ? "text-amber-800" : "text-rose-600")}>
                  {formatINR(financialSummary.cashInHand)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-50">
            <span className="text-gray-500 font-semibold flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={13} className="text-amber-600" />
              {t('Petty Cash Status:', 'नकद स्थिति:')}
            </span>
            <Badge className="bg-amber-100 text-amber-900 font-black text-[10px]">
              {financialSummary.cashExpenses > 0 ? `${formatINR(financialSummary.cashExpenses)} Paid` : 'Zero Cash Spend'}
            </Badge>
          </div>
        </div>

        {/* 3. PROPRIETOR CAPITAL LEDGER (OWNER PERSONAL INVESTMENT) */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-violet-50/50 rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-bold shadow-md">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                    {t('Proprietor Capital', 'मालिक की पूंजी लेजर')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Owner Personal Funds / Capital Investment
                  </p>
                </div>
              </div>

              <Badge className="bg-purple-100 text-purple-900 font-black text-[10px] uppercase">
                P&L Valid
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-white/80 rounded-2xl border border-purple-100/80 text-center text-xs my-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Personal Capital In', 'मालिक का निवेश')}</span>
                <span className="font-black text-purple-800 text-base">{formatINR(financialSummary.proprietorCapitalExpenses)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('Bank/Cash Impact', 'बैंक/कैश पर असर')}</span>
                <span className="font-black text-emerald-600 text-sm">₹0.00 (Protected)</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-purple-800/90 pt-2 border-t border-purple-50 leading-tight">
            💡 {t('Valid business deduction for ITR/P&L without making current a/c or petty cash negative.', 'व्यक्तिगत खाते/UPI से हुए साइट खर्चे वैध माने जाते हैं और चालू खाता नेगेटिव नहीं होता।')}
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION SUB-TABS */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'overview', label: t('Overview', 'डैशबोर्ड'), icon: Layers },
              { id: 'sales', label: `${t('Sales & Invoices', 'बिक्री व इनवॉइस')} (${salesInvoices.length})`, icon: Receipt },
              { id: 'estimates', label: `${t('Estimates & Proforma', 'कच्चा बिल / एस्टीमेट')} (${estimateInvoices.length})`, icon: FileText },
              { id: 'expenses', label: `${t('Expenses Hub', 'खर्चे / Expenses')} (${filteredExpenses.length})`, icon: Wallet },
              { id: 'archive', label: `📁 ${t('Monthly & Quarterly Files', 'मंथली व क्वार्टरली फाइलें')}`, icon: Archive },
              { id: 'parties', label: `${t('Party Ledger', 'पार्टी लेजर')} (${partiesList.length})`, icon: Users },
              { id: 'reports', label: t('GST & CA Reports', 'जीएसटी व CA रिटर्न'), icon: Building2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                    isActive 
                      ? "bg-[#001f3f] text-teal shadow-md shadow-navy/20" 
                      : "text-gray-500 hover:text-navy hover:bg-gray-50"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-teal" : "text-gray-400"} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('Search invoices, parties, UTR...', 'सर्च इनवॉइस, ग्राहक, UTR...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy placeholder:text-gray-400 outline-none focus:border-teal transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6 pt-6">
            {/* LIVE ACTIVE PERIOD BANNER */}
            <div className="bg-gradient-to-r from-teal/15 via-emerald-50 to-teal/10 rounded-3xl p-5 border border-teal/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal text-navy flex items-center justify-center font-bold shadow-md shrink-0">
                  <FolderCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-navy text-sm uppercase">
                      {t('Current Live File:', 'वर्तमान चालू फाइल:')} {periodData.activePeriod.label}
                    </span>
                    <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase px-2 py-0.5">
                      🟢 {t('Live Recording', 'चालू फाइल')}
                    </Badge>
                    <Badge variant="outline" className="border-navy/20 text-navy font-bold text-[9px]">
                      {t('Quarter', 'तिमाही')}: {periodData.activeQuarter.quarter} (FY {periodData.activePeriod.financialYear})
                    </Badge>
                  </div>
                  <p className="text-xs text-navy/80 font-medium mt-1">
                    {t('All newly generated invoices, cash and bank expenses are automatically recorded into this live file.', 'सभी नए टैक्स इनवॉइस और खर्चे (नकद व बैंक दोनों) इसी फाइल में स्वतः जुड़ रहे हैं।')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <Button
                  size="sm"
                  onClick={() => exportPeriodFile(periodData.activePeriod, allInvoices, allExpenses)}
                  className="bg-navy hover:bg-navy/90 text-teal font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4 flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> {t('Download Current CSV', 'चालू फाइल CSV डाउनलोड')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSubTab('archive')}
                  className="border-navy/20 hover:bg-navy/5 text-navy font-bold text-xs rounded-xl h-9 px-3 flex items-center gap-1"
                >
                  <Archive size={14} /> {t('View All Period Files', 'सभी फाइलें देखें')}
                </Button>
              </div>
            </div>

            {/* EASY ACCOUNTING & GST WORKFLOW GUIDE (NO CONFUSION) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">1</span>
                  <h4 className="font-black text-xs text-navy uppercase tracking-tight">
                    {t('How to Create Bill / Sales', '1. नया बिल कैसे बनाएं')}
                  </h4>
                </div>
                <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                  {t('Issue a verified Tax Invoice for customer. Output GST & Sales auto-sync to current month & quarter.', 'ग्राहक को पक्का टैक्स इनवॉइस दें। बिक्री व आउटपुट GST आपके खाते में तुरंत जुड़ जाएगी।')}
                </p>
                <button 
                  onClick={() => navigate('/admin/invoice-generator')} 
                  className="text-xs font-black text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
                >
                  <span>{t('Create Invoice', 'बिल बनाएं')}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-rose-50/80 to-white p-4 rounded-2xl border border-rose-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs">2</span>
                  <h4 className="font-black text-xs text-navy uppercase tracking-tight">
                    {t('How to Add Expenses', '2. खर्चे कैसे दर्ज करें')}
                  </h4>
                </div>
                <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                  {t('Pick expense date (even past dates). It automatically categorizes into that exact quarter with ITC tax credit.', 'खर्चे की तारीख चुनें (पुरानी तारीख डालने पर भी उसी क्वार्टर में स्वतः दर्ज होगा) और ITC टैक्स छूट पाएं।')}
                </p>
                <button 
                  onClick={() => handleOpenExpenseModal()} 
                  className="text-xs font-black text-rose-700 hover:text-rose-900 flex items-center gap-1 group"
                >
                  <span>{t('+ Add Expense', '+ खर्चा जोड़ें')}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/80 to-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">3</span>
                  <h4 className="font-black text-xs text-navy uppercase tracking-tight">
                    {t('Monthly Records & CA Reports', '3. मंथली रिकॉर्ड व CA रिपोर्ट')}
                  </h4>
                </div>
                <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                  {t('Download 1-click GSTR-1, GSTR-3B & Monthly P&L Excel sheet for your accountant/CA with zero errors.', 'हर महीने और तिमाही का पूरा हिसाब, GSTR-1, GSTR-3B एक्सेल फाइल CA को भेजने हेतु 1-क्लिक में निकालें।')}
                </p>
                <button 
                  onClick={() => setActiveSubTab('archive')} 
                  className="text-xs font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 group"
                >
                  <span>{t('View All Period Files', 'मासिक फाइलें देखें')}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales vs Expenses Visual Bar */}
              <div className="lg:col-span-2 bg-slate-50/70 rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-navy flex items-center gap-2">
                    <TrendingUp size={18} className="text-teal" /> {t('Sales vs Expenses Analysis', 'बिक्री बनाम खर्चे')}
                  </h3>
                  <span className="text-xs font-bold text-gray-500">{dateRange.label}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-600">{t('Taxable Sales Value', 'कुल कर योग्य बिक्री')}</span>
                      <span className="text-teal font-black">{formatINR(financialSummary.taxableSales)}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-teal h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-600">{t('Total Recorded Expenses', 'कुल दर्ज खर्चे')}</span>
                      <span className="text-rose-600 font-black">{formatINR(financialSummary.totalExpenses)}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${financialSummary.taxableSales > 0 ? Math.min(100, (financialSummary.totalExpenses / financialSummary.taxableSales) * 100) : 0}%` 
                        }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-600">{t('Net Profit Margin', 'शुद्ध मुनाफा')}</span>
                      <span className={cn("font-black", financialSummary.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {formatINR(financialSummary.netProfit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", financialSummary.netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ 
                          width: `${financialSummary.taxableSales > 0 ? Math.max(0, Math.min(100, (financialSummary.netProfit / financialSummary.taxableSales) * 100)) : 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Info Points */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-200 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">{t('Average Ticket Size', 'औसत बिल राशि')}</span>
                    <span className="font-black text-navy text-sm mt-0.5 block">
                      {financialSummary.invoicesCount > 0 
                        ? formatINR(financialSummary.totalSales / financialSummary.invoicesCount) 
                        : '₹0'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">{t('Total GST Collected', 'कुल जीएसटी')}</span>
                    <span className="font-black text-navy text-sm mt-0.5 block">
                      {formatINR(financialSummary.outputGst)}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">{t('Input Tax Credit (ITC)', 'इनपुट टैक्स क्रेडिट')}</span>
                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">
                      {formatINR(financialSummary.itcEligibleGst)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Category Breakdown Chart / List */}
              <div className="bg-slate-50/70 rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-navy flex items-center gap-2">
                    <Wallet size={18} className="text-teal" /> {t('Expenses by Category', 'खर्चों का वर्गीकरण')}
                  </h3>
                  <button 
                    onClick={() => setActiveSubTab('expenses')}
                    className="text-xs font-black text-teal hover:underline"
                  >
                    {t('View All', 'सभी देखें')} &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {expensesByCategory
                    .filter(c => c.total > 0)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map(c => {
                      const catInfo = expenseCategories.find(x => x.id === c.category);
                      return (
                        <div key={c.category} className="bg-white p-3 rounded-2xl border border-gray-100">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="flex items-center gap-1.5 text-navy">
                              <span>{catInfo?.icon}</span>
                              <span>{catInfo?.label || c.category}</span>
                            </span>
                            <span className="font-black text-navy">{formatINR(c.total)}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-navy h-full rounded-full" 
                              style={{ width: `${Math.min(100, c.percentage)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}

                  {expensesByCategory.every(c => c.total === 0) && (
                    <div className="text-center py-8 text-gray-400 text-xs font-bold">
                      {t('No expenses recorded for this period', 'इस अवधि में कोई खर्चे दर्ज नहीं हैं')}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleOpenExpenseModal()}
                  className="w-full mt-4 bg-teal/20 hover:bg-teal/30 text-navy font-black text-xs uppercase tracking-wider rounded-2xl h-10 border border-teal/40"
                >
                  <Plus size={14} className="mr-1" /> {t('+ Add Expense', '+ नया खर्चा जोड़ें')}
                </Button>
              </div>
            </div>

            {/* Quick Actions & Recent Transactions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sales Invoices */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-2">
                    <Receipt size={18} className="text-teal" /> {t('Recent Tax Invoices', 'हालिया टैक्स इनवॉइस')}
                  </h3>
                  <button onClick={() => setActiveSubTab('sales')} className="text-xs font-black text-teal hover:underline">
                    {t('View All', 'सभी देखें')} &rarr;
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {salesInvoices.slice(0, 5).map(inv => (
                    <div key={inv.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-navy">#{inv.estimateNumber || inv.invoiceNumber}</span>
                          <Badge className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5",
                            inv.paymentStatus === 'Paid' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {inv.paymentStatus || 'Unpaid'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-bold border-gray-200">
                            {inv.paymentMode === 'Cash' ? t('Cash', 'नकद') : 'Bank/UPI'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-600 font-bold block mt-0.5">{inv.customerName || 'Valued Customer'}</span>
                        <span className="text-[10px] text-gray-400">{inv.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-navy block">{formatINR(inv.totalAmount)}</span>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <button
                            onClick={() => downloadInvoicePDF(inv)}
                            className="p-1 text-gray-500 hover:text-teal rounded"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/invoice/${inv.id}`)}
                            className="p-1 text-gray-500 hover:text-navy rounded"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {salesInvoices.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-bold">
                      {t('No tax invoices found', 'कोई टैक्स इनवॉइस नहीं मिला')}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Business Expenses */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-2">
                    <Wallet size={18} className="text-rose-500" /> {t('Recent Business Expenses', 'हालिया व्यापार खर्चे')}
                  </h3>
                  <button onClick={() => setActiveSubTab('expenses')} className="text-xs font-black text-teal hover:underline">
                    {t('View All', 'सभी देखें')} &rarr;
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredExpenses.slice(0, 5).map(exp => (
                    <div key={exp.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-navy">{exp.title}</span>
                          <Badge className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5",
                            exp.paymentMode === 'Cash' ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-blue-100 text-blue-900 border-blue-200"
                          )}>
                            {exp.paymentMode === 'Cash' ? t('Cash', 'नकद') : 'Bank/UPI'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 font-bold block mt-0.5">{exp.category} • {exp.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-rose-600 block">{formatINR(exp.amount)}</span>
                        {exp.vendorGSTIN && (
                          <span className="text-[10px] text-teal font-bold block">GST: {exp.vendorGSTIN}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-bold">
                      {t('No expenses recorded', 'कोई खर्चा दर्ज नहीं है')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES & TAX INVOICES */}
        {activeSubTab === 'sales' && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                  {t('Tax Invoices & Billing Records', 'बिक्री व टैक्स इनवॉइस')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('Official GST Invoices, Payment Status & GSTR-1 Records', 'सभी जारी जीएसटी टैक्स बिल व भुगतान स्थिति')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => exportGSTR1B2BCSV(salesInvoices)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-teal text-teal hover:bg-teal/10"
                >
                  <FileSpreadsheet size={14} className="mr-1" /> GSTR-1 B2B CSV
                </Button>
                <Button
                  onClick={() => navigate('/admin/invoice-generator')}
                  className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                >
                  <Plus size={14} className="mr-1" /> {t('+ New Tax Invoice', '+ नया बिल')}
                </Button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2">{t('Status:', 'स्थिति:')}</span>
              {[
                { id: 'all', label: `${t('All', 'सभी')} (${salesInvoices.length})` },
                { id: 'Paid', label: t('Paid', 'भुगतान प्राप्त') },
                { id: 'Unpaid', label: t('Unpaid', 'बकाया') },
                { id: 'Partial', label: t('Partial', 'आंशिक') }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSalesStatusFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                    salesStatusFilter === f.id ? "bg-navy text-teal shadow-sm" : "text-gray-500 hover:text-navy"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">{t('Invoice # & Date', 'इनवॉइस # & तारीख')}</th>
                    <th className="p-3.5">{t('Customer & GSTIN', 'ग्राहक व GSTIN')}</th>
                    <th className="p-3.5">{t('Channel / UTR', 'माध्यम / UTR')}</th>
                    <th className="p-3.5">{t('Taxable Value (₹)', 'कर योग्य मूल्य')}</th>
                    <th className="p-3.5">{t('GST Rate', 'जीएसटी दर')}</th>
                    <th className="p-3.5">{t('Total Amount (₹)', 'कुल बिल')}</th>
                    <th className="p-3.5">{t('Payment Status', 'भुगतान स्थिति')}</th>
                    <th className="p-3.5 text-right">{t('Actions', 'कार्य')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy">
                  {salesInvoices
                    .filter(inv => salesStatusFilter === 'all' || inv.paymentStatus === salesStatusFilter)
                    .filter(inv => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        (inv.estimateNumber || inv.invoiceNumber || '').toLowerCase().includes(q) ||
                        (inv.customerName || '').toLowerCase().includes(q) ||
                        (inv.customerGSTIN || '').toLowerCase().includes(q) ||
                        (inv.bankTransactionId || '').toLowerCase().includes(q)
                      );
                    })
                    .map(inv => {
                      const taxable = (inv.subTotal || inv.totalAmount) - (inv.discount || 0);
                      const isPaid = inv.paymentStatus === 'Paid';
                      const balance = inv.balanceDue !== undefined ? inv.balanceDue : (isPaid ? 0 : inv.totalAmount);
                      const isCash = (inv.paymentMode || '').toLowerCase() === 'cash' || (inv.paymentMode || '').includes('नकद');

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-black text-navy block">#{inv.estimateNumber || inv.invoiceNumber}</span>
                            <span className="text-[10px] text-gray-400">{inv.date}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-navy block">{inv.customerName || 'Valued Customer'}</span>
                            {inv.customerGSTIN ? (
                              <span className="text-[10px] text-teal font-extrabold block">GSTIN: {inv.customerGSTIN}</span>
                            ) : (
                              <span className="text-[10px] text-gray-400 block">B2C (Consumer)</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={cn(
                              "font-black text-[11px] block",
                              isCash ? "text-amber-700" : "text-indigo-700"
                            )}>
                              {isCash ? t('💵 Cash', '💵 नकद') : `📱 ${inv.paymentMode || 'UPI / Bank'}`}
                            </span>
                            {inv.bankTransactionId ? (
                              <span className="text-[9px] text-gray-500 font-mono block">UTR: {inv.bankTransactionId}</span>
                            ) : null}
                            {!isCash && (
                              <button
                                onClick={() => handleToggleReconcileInvoice(inv)}
                                className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-0.5 transition-all",
                                  inv.reconciledWithBank 
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                                    : "bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-800"
                                )}
                                title="Click to toggle Bank Match"
                              >
                                {inv.reconciledWithBank ? `✅ ${t('Bank Matched', 'बैंक मैच')}` : `⏳ ${t('Pending Match', 'पेंडिंग मिलान')}`}
                              </button>
                            )}
                          </td>
                          <td className="p-3.5 font-bold">
                            {formatINR(taxable)}
                          </td>
                          <td className="p-3.5">
                            <Badge variant="outline" className="text-[10px] font-black border-teal/40 text-navy">
                              {inv.gstPercentage || 18}% GST
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            <span className="font-black text-sm text-navy block">{formatINR(inv.totalAmount)}</span>
                            {balance > 0 && (
                              <span className="text-[10px] text-amber-600 font-bold block">{t('Balance:', 'बाकी:')} {formatINR(balance)}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5",
                              isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            )}>
                              {inv.paymentStatus || 'Unpaid'}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {balance > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenPaymentModal(inv)}
                                  className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm"
                                  title={t('Record Payment', 'भुगतान दर्ज करें')}
                                >
                                  + {t('Payment', 'भुगतान')}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadInvoicePDF(inv)}
                                className="h-8 w-8 p-0 text-navy hover:bg-slate-100 rounded-lg"
                                title="Download PDF"
                              >
                                <Download size={15} />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/invoice/${inv.id}`)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Online"
                              >
                                <Eye size={15} />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => inv.id && handleDeleteInvoice(inv.id)}
                                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ESTIMATES & PROFORMA */}
        {activeSubTab === 'estimates' && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-2">
                  <FileText size={18} className="text-teal" />
                  {t('Estimates & Proforma Invoices', 'कच्चा बिल व एस्टीमेट प्रबंधन')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('Create preliminary estimates and convert them into official Tax Invoices in 1-click.', 'कच्चा बिल / एस्टीमेट बनाएं और 1-क्लिक में आधिकारिक टैक्स बिल में बदलें।')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => navigate('/billing?type=Quotation')}
                  className="bg-navy hover:bg-navy/90 text-teal font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4 shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> {t('+ New Quotation', '+ नया कोटेशन')}
                </Button>
                <Button
                  onClick={() => navigate('/billing?type=Estimate')}
                  className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4 shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> {t('+ New Estimate', '+ नया एस्टीमेट')}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">{t('Estimate # & Date', 'एस्टीमेट # & तारीख')}</th>
                    <th className="p-3.5">{t('Customer / Client', 'कंपनी / ग्राहक')}</th>
                    <th className="p-3.5">{t('Items', 'आइटम्स')}</th>
                    <th className="p-3.5">{t('Estimated Amount (₹)', 'अनुमानित राशि')}</th>
                    <th className="p-3.5">{t('Status', 'स्थिति')}</th>
                    <th className="p-3.5 text-right">{t('Actions', 'कार्य')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy">
                  {displayedEstimates.map((est) => {
                    const isConverted = est.status === 'Converted';

                    return (
                      <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-navy block">#{est.estimateNumber || 'EST-01'}</span>
                            {est.type === 'Quotation' && (
                              <span className="text-[8px] bg-navy text-teal px-1.5 py-0.5 rounded font-black tracking-wider">QT</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">{est.date}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-navy block">{est.customerName || 'Valued Customer'}</span>
                          {est.customerGSTIN ? (
                            <span className="text-[10px] text-teal font-extrabold block">GSTIN: {est.customerGSTIN}</span>
                          ) : (
                            <span className="text-[10px] text-gray-400">{est.customerPhone || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-3.5 max-w-[200px]">
                          <span className="font-semibold text-navy block truncate" title={est.subject || ''}>
                            {(est.items || []).length} {t('Work Items', 'आइटम्स')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-sm text-navy block">{formatINR(est.totalAmount)}</span>
                          <span className="text-[10px] text-gray-400 block">+ GST {est.gstPercentage || 18}%</span>
                        </td>
                        <td className="p-3.5">
                          <Badge className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5",
                            isConverted ? "bg-teal/20 text-navy" : "bg-amber-100 text-amber-900"
                          )}>
                            {isConverted ? `${t('Converted', 'कन्वर्टेड')} (${est.convertedToInvoiceNumber || 'Tax Invoice'})` : t('Estimate Active', 'सक्रिय')}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {!isConverted ? (
                              <Button
                                size="sm"
                                onClick={() => setEstimateToConvert(est)}
                                className="h-8 px-2.5 bg-teal hover:bg-teal/90 text-navy font-black text-[10px] uppercase rounded-lg shadow-sm"
                                title="Convert to Official Tax Invoice"
                              >
                                ⚡ {t('Convert to Tax Bill', 'टैक्स बिल बनाएं')}
                              </Button>
                            ) : (
                              <span className="text-[10px] font-bold text-teal flex items-center gap-1">
                                <CheckCircle2 size={13} /> {t('Converted', 'बिल बन चुका')}
                              </span>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadInvoicePDF(est)}
                              className="h-8 w-8 p-0 text-teal hover:bg-teal/10 rounded-lg"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/invoice/${est.id}`)}
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Online"
                            >
                              <Eye size={14} />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => est.id && handleDeleteInvoice(est.id)}
                              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {displayedEstimates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 font-bold text-xs uppercase">
                        {t('No estimates found', 'कोई एस्टीमेट नहीं मिला')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EXPENSES HUB (WITH CASH VS BANK RECONCILIATION) */}
        {activeSubTab === 'expenses' && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                  {t('Business Expenses & Bank Reconciliation Ledger', 'व्यापार खर्चे, कैश बुक व बैंक समाधान')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('Track Cash in Hand vs Bank/UPI expenses so CA can match against bank passbook.', 'नकद व बैंक/UPI खर्चों का अलग हिसाब ताकि CA बैंक स्टेटमेंट से मिलान कर सके।')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => exportCashBookCSV(salesInvoices, filteredExpenses)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                  title="Download Petty Cash Book CSV for CA"
                >
                  <Download size={13} className="mr-1" /> 💵 {t('Cash Book CSV', 'कैश बुक CSV')}
                </Button>
                <Button
                  onClick={() => exportBankReconciliationCSV(salesInvoices, filteredExpenses)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                  title="Download Bank Statement Matching Sheet for CA"
                >
                  <Download size={13} className="mr-1" /> 🏦 {t('Bank Recon CSV', 'बैंक मिलान CSV')}
                </Button>
                <Button
                  onClick={() => handleOpenExpenseModal()}
                  className="bg-navy hover:bg-navy/90 text-teal font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                >
                  <Plus size={14} className="mr-1" /> {t('+ Add Expense', '+ नया खर्चा दर्ज करें')}
                </Button>
              </div>
            </div>

            {/* Payment Channel Filter Strip (Cash vs Bank vs Reconciled) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-black text-navy uppercase tracking-wider mr-2">{t('Channel Filter:', 'माध्यम फ़िल्टर:')}</span>
              {[
                { id: 'all', label: `${t('All Expenses', 'सभी खर्चे')} (${filteredExpenses.length})` },
                { id: 'Cash', label: `💵 ${t('Cash Expenses', 'नकद खर्चे')} (${filteredExpenses.filter(e => (e.paymentMode || '').toLowerCase() === 'cash' || (e.paymentMode || '').includes('नकद')).length})` },
                { id: 'Bank', label: `🏦 ${t('Bank & UPI', 'बैंक व UPI')} (${filteredExpenses.filter(e => {
                  const m = (e.paymentMode || '').toLowerCase();
                  return m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque');
                }).length})` },
                { id: 'Reconciled', label: `🟢 ${t('Bank Matched', 'बैंक मैच पूर्ण')} (${filteredExpenses.filter(e => e.reconciledWithBank).length})` },
                { id: 'Pending', label: `🟡 ${t('Pending Match', 'मिलान बाकी')} (${filteredExpenses.filter(e => {
                  const m = (e.paymentMode || '').toLowerCase();
                  const isBank = m.includes('upi') || m.includes('bank') || m.includes('transfer') || m.includes('cheque');
                  return isBank && !e.reconciledWithBank;
                }).length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setExpensePaymentModeFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                    expensePaymentModeFilter === f.id ? "bg-navy text-teal shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:text-navy"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">{t('Date & Title', 'तारीख & शीर्षक')}</th>
                    <th className="p-3.5">{t('Category', 'श्रेणी')}</th>
                    <th className="p-3.5">{t('Quarter', 'तिमाही')}</th>
                    <th className="p-3.5">{t('Channel / Bank UTR', 'माध्यम / UTR')}</th>
                    <th className="p-3.5">{t('Bank Match (CA Status)', 'बैंक मिलान स्थिति')}</th>
                    <th className="p-3.5">{t('Vendor / Supplier', 'विक्रेता / वेंडर')}</th>
                    <th className="p-3.5">{t('GST & ITC', 'जीएसटी व ITC')}</th>
                    <th className="p-3.5">{t('Amount (₹)', 'राशि')}</th>
                    <th className="p-3.5 text-right">{t('Actions', 'कार्य')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy">
                  {filteredExpenses
                    .filter(e => {
                      if (expensePaymentModeFilter === 'all') return true;
                      const mode = (e.paymentMode || '').toLowerCase();
                      const cat = getExpensePaymentCategory(e.paymentMode);
                      if (expensePaymentModeFilter === 'Cash') return cat === 'cash';
                      if (expensePaymentModeFilter === 'Bank') return cat === 'bank';
                      if (expensePaymentModeFilter === 'Proprietor') return cat === 'proprietor_capital';
                      if (expensePaymentModeFilter === 'Reconciled') return e.reconciledWithBank;
                      if (expensePaymentModeFilter === 'Pending') return cat === 'bank' && !e.reconciledWithBank;
                      return true;
                    })
                    .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                    .filter(e => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        e.title.toLowerCase().includes(q) ||
                        (e.vendorName || '').toLowerCase().includes(q) ||
                        (e.invoiceNumber || '').toLowerCase().includes(q) ||
                        (e.bankTransactionId || '').toLowerCase().includes(q)
                      );
                    })
                    .map(exp => {
                      const payCat = getExpensePaymentCategory(exp.paymentMode);
                      const isCash = payCat === 'cash';
                      const isProprietor = payCat === 'proprietor_capital';

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-black text-navy block">{exp.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {exp.date} {exp.invoiceNumber ? `• Bill #${exp.invoiceNumber}` : ''} 
                              {exp.payeeName ? ` • Payee: ${exp.payeeName}` : ''}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge variant="outline" className="text-[10px] font-bold border-gray-200">
                              {expenseCategories.find(c => c.id === exp.category)?.label || exp.category}
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            <span className="font-extrabold text-[10px] bg-teal/10 text-navy border border-teal/20 px-2 py-0.5 rounded-md">
                              {exp.quarter || getQuarter(exp.date)}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={cn(
                              "font-black text-[11px] block",
                              isProprietor ? "text-purple-800" : isCash ? "text-amber-800" : "text-indigo-800"
                            )}>
                              {isProprietor ? '👤 Proprietor Capital' : isCash ? t('💵 Cash-in-Hand', '💵 कैश') : '🏦 SBI Bank A/c'}
                            </span>
                            {exp.bankTransactionId ? (
                              <span className="text-[9px] text-gray-500 font-mono block">UTR: {exp.bankTransactionId}</span>
                            ) : null}
                          </td>
                          <td className="p-3.5">
                            {isProprietor ? (
                              <Badge className="bg-purple-100 text-purple-900 font-black text-[9px] uppercase px-2 py-0.5 border border-purple-200">
                                👤 {t('Owner Investment', 'मालिक की पूंजी')}
                              </Badge>
                            ) : isCash ? (
                              <Badge className="bg-amber-100 text-amber-900 font-bold text-[9px] uppercase px-2 py-0.5">
                                💵 {t('Cash Book', 'कैश बुक')}
                              </Badge>
                            ) : (
                              <button
                                onClick={() => handleToggleReconcileExpense(exp)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all shadow-xs",
                                  exp.reconciledWithBank 
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300" 
                                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
                                )}
                                title={t('Click to toggle bank reconciliation', 'क्लिक करके बैंक पासबुक से मैच या अनमैच करें')}
                              >
                                {exp.reconciledWithBank ? (
                                  <>
                                    <CheckCircle2 size={12} className="text-emerald-700" />
                                    <span>{t('Bank Matched', 'बैंक मैच')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} className="text-amber-700" />
                                    <span>{t('Click to Match', 'मिलान बाकी')}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-navy block">{exp.vendorName || 'Supplier'}</span>
                            {exp.vendorGSTIN && (
                              <span className="text-[10px] text-teal font-extrabold block">GST: {exp.vendorGSTIN}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {exp.isGstApplicable ? (
                              <div>
                                <Badge className={cn(
                                  "text-[9px] font-black uppercase px-1.5 py-0.5",
                                  exp.isItcEligible !== false ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                                )}>
                                  {exp.isItcEligible !== false ? `ITC ₹${(exp.gstAmount || 0).toFixed(0)}` : 'No ITC'}
                                </Badge>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{exp.gstRate}% GST</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400">{t('Non-GST', 'गैर-जीएसटी')}</span>
                            )}
                          </td>
                          <td className="p-3.5 font-black text-sm text-navy">
                            {formatINR(exp.amount)}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenExpenseModal(exp)}
                                className="h-8 w-8 p-0 text-navy hover:bg-slate-100 rounded-lg"
                                title="Edit Expense"
                              >
                                <Edit3 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => exp.id && handleDeleteExpense(exp.id)}
                                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="Delete Expense"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400 font-bold text-xs uppercase">
                        {t('No expenses recorded for this period', 'इस अवधि में कोई खर्चे दर्ज नहीं हैं')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MONTHLY & QUARTERLY PERIOD FILES ARCHIVE */}
        {activeSubTab === 'archive' && (
          <div className="space-y-6 pt-4">
            {/* Guarantee Callout Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal/10 to-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-black text-navy text-sm uppercase">
                    {t('100% Data Preservation & Automatic Period Rollover', '100% स्थायी डेटा सुरक्षा व स्वतः फाइल रोलओवर गारंटी')}
                  </h4>
                  <p className="text-xs text-navy/80 font-medium mt-1 leading-relaxed">
                    {t(
                      'Per Vyapar accounting standards, an independent ledger file is maintained for each month containing all sales, cash and bank expenses. When the month ends, the file is safely archived and locked, automatically initiating the next month. At quarter completion, consolidated quarterly reports are generated. Historical records are permanent and never deleted.',
                      'हर माह की एक अलग फाइल बनती है जिसमें उस माह के सारे बिल, नकद व बैंक खर्चे दर्ज होते हैं। जैसे ही माह पूरा होता है, वह फाइल सुरक्षित रूप से लॉक हो जाती है और अगले माह की नई फाइल शुरू हो जाती है। आपका कोई भी पिछला डेटा कभी डिलीट या नष्ट नहीं होगा।'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Year Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-teal" />
                <span className="text-xs font-black uppercase text-navy">{t('Financial Year:', 'वित्तीय वर्ष चुनें:')}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {periodData.allYears.map(fy => (
                  <button
                    key={fy}
                    onClick={() => setSelectedArchiveFy(fy)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all",
                      selectedArchiveFy === fy 
                        ? "bg-navy text-teal shadow-md" 
                        : "bg-white text-gray-600 border border-gray-200 hover:text-navy"
                    )}
                  >
                    FY 20{fy} {fy === getFinancialYear() ? `(${t('Current FY', 'चालू वित्त वर्ष')})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Quarters (Q1, Q2, Q3, Q4) Breakdown with Child Months */}
            <div className="space-y-6">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(qKey => {
                const qPeriod = periodData.periodsList.find(p => p.type === 'quarter' && p.financialYear === selectedArchiveFy && p.quarter === qKey);
                const mPeriods = periodData.periodsList.filter(p => p.type === 'month' && p.financialYear === selectedArchiveFy && p.quarter === qKey);

                const isQuarterActive = qPeriod?.status === 'Active';
                const isQuarterCompleted = qPeriod?.status === 'Completed';

                const monthNames = language === 'hi' ? QUARTER_MONTH_NAMES_HI[qKey] : QUARTER_MONTH_NAMES_EN[qKey];

                return (
                  <div key={qKey} className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
                    {/* Quarter Header */}
                    <div className="p-5 bg-slate-50 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm",
                          isQuarterActive ? "bg-teal text-navy shadow-md" : "bg-navy text-white"
                        )}>
                          {qKey}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-navy uppercase">
                              {t('Quarter', 'तिमाही')} {qKey}: {monthNames.join(' • ')}
                            </h4>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5",
                              isQuarterActive ? "bg-emerald-500 text-white" : isQuarterCompleted ? "bg-navy text-teal" : "bg-gray-100 text-gray-500"
                            )}>
                              {isQuarterActive ? `🟢 ${t('Active Quarter', 'चालू तिमाही')}` : isQuarterCompleted ? `🔒 ${t('Archived & Locked', 'सुरक्षित पुरालेख')}` : `⏳ ${t('Upcoming', 'आगामी')}`}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            {t('Period', 'अवधि')}: {qPeriod?.startDate} to {qPeriod?.endDate} (FY 20{selectedArchiveFy})
                          </p>
                        </div>
                      </div>

                      {/* Quarter Aggregate Download */}
                      <div className="flex items-center gap-2">
                        {qPeriod && (
                          <Button
                            onClick={() => exportPeriodFile(qPeriod, allInvoices, allExpenses)}
                            className="bg-navy hover:bg-navy/90 text-teal font-black text-xs uppercase tracking-wider rounded-xl h-10 px-4 shadow-sm flex items-center gap-1.5"
                          >
                            <Download size={14} /> {t('Download Quarterly CSV', 'डाउनलोड त्रैमासिक फाइल')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quarter Metrics Strip */}
                    {qPeriod && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-teal/5 border-b border-gray-100 text-center">
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Total Sales', 'कुल बिक्री')}</span>
                          <span className="font-black text-navy text-sm">{formatINR(qPeriod.salesTotal)}</span>
                          <span className="text-[10px] text-gray-500 block">({qPeriod.invoicesCount} {t('bills', 'बिल')})</span>
                        </div>
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Total Expenses', 'कुल खर्चे')}</span>
                          <span className="font-black text-rose-600 text-sm">{formatINR(qPeriod.expensesTotal)}</span>
                          <span className="text-[10px] text-gray-500 block">({qPeriod.expensesCount} {t('exp', 'खर्चे')})</span>
                        </div>
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Net Profit', 'शुद्ध लाभ')}</span>
                          <span className={cn("font-black text-sm", qPeriod.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatINR(qPeriod.netProfit)}
                          </span>
                        </div>
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Output GST', 'आउटपुट GST')}</span>
                          <span className="font-black text-navy text-sm">{formatINR(qPeriod.gstTotal)}</span>
                        </div>
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Input ITC', 'इनपुट ITC')}</span>
                          <span className="font-black text-emerald-600 text-sm">{formatINR(qPeriod.itcTotal)}</span>
                        </div>
                        <div className="p-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Net GST Payable', 'शुद्ध देय GST')}</span>
                          <span className="font-black text-navy text-sm">{formatINR(qPeriod.netGstPayable)}</span>
                        </div>
                      </div>
                    )}

                    {/* Monthly Files Table */}
                    <div className="p-4">
                      <h5 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-3">
                        {t('Quarter Monthly Files:', 'इस तिमाही की 3 मासिक फाइलें:')}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {mPeriods.map(mPeriod => {
                          const isMonthActive = mPeriod.status === 'Active';
                          const isMonthCompleted = mPeriod.status === 'Completed';
                          const isMonthUnlocked = Boolean(unlockedMonths[mPeriod.key]);

                          return (
                            <div 
                              key={mPeriod.key} 
                              className={cn(
                                "p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between",
                                isMonthActive 
                                  ? "bg-teal/10 border-teal/40 shadow-md ring-2 ring-teal/30" 
                                  : isMonthUnlocked
                                    ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-200 shadow-sm"
                                    : "bg-white border-gray-100 hover:border-gray-200"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-black text-navy text-sm">{mPeriod.label}</span>
                                  <Badge className={cn(
                                    "text-[9px] font-black uppercase px-2 py-0.5",
                                    isMonthActive 
                                      ? "bg-emerald-500 text-white" 
                                      : isMonthUnlocked 
                                        ? "bg-amber-100 text-amber-900 border border-amber-300" 
                                        : isMonthCompleted 
                                          ? "bg-slate-100 text-slate-700" 
                                          : "bg-gray-50 text-gray-400"
                                  )}>
                                    {isMonthActive 
                                      ? `🟢 ${t('Active', 'चालू')}` 
                                      : isMonthUnlocked 
                                        ? `🔓 ${t('Unlocked / Open', 'अनलॉक / संपादन चालू')}` 
                                        : isMonthCompleted 
                                          ? `🔒 ${t('Archived & Locked', 'सुरक्षित व लॉक')}` 
                                          : t('Upcoming', 'आगामी')}
                                  </Badge>
                                </div>

                                <div className="space-y-1.5 text-xs my-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 font-semibold">{t('Sales', 'बिक्री')} ({mPeriod.invoicesCount}):</span>
                                    <span className="font-black text-navy">{formatINR(mPeriod.salesTotal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 font-semibold">{t('Expenses', 'खर्चे')} ({mPeriod.expensesCount}):</span>
                                    <span className="font-black text-rose-600">{formatINR(mPeriod.expensesTotal)}</span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-gray-200">
                                    <span className="text-gray-700 font-bold">{t('Net Margin:', 'शुद्ध लाभ:')}</span>
                                    <span className={cn("font-black", mPeriod.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                      {formatINR(mPeriod.netProfit)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100">
                                {isMonthCompleted && (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleToggleMonthLock(mPeriod)}
                                      className={cn(
                                        "flex-1 text-[10px] font-black uppercase rounded-xl h-8",
                                        isMonthUnlocked
                                          ? "border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                          : "border-gray-200 text-gray-700 hover:bg-slate-100"
                                      )}
                                    >
                                      {isMonthUnlocked ? (
                                        <>
                                          <Lock size={12} className="mr-1 text-amber-700" />
                                          {t('Lock Month', 'पुनः लॉक करें')}
                                        </>
                                      ) : (
                                        <>
                                          <Unlock size={12} className="mr-1 text-teal" />
                                          {t('Unlock Month', 'अनलॉक करें')}
                                        </>
                                      )}
                                    </Button>

                                    {isMonthUnlocked && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddRetroactiveExpense(mPeriod)}
                                        className="bg-teal hover:bg-teal/90 text-navy font-black text-[10px] uppercase rounded-xl h-8 px-2.5 shadow-xs"
                                        title={t('Record missed site expense for this month', 'इस माह का छूटा हुआ खर्चा दर्ज करें')}
                                      >
                                        <Plus size={12} className="mr-0.5" />
                                        {t('Add Exp', '+ खर्चा')}
                                      </Button>
                                    )}
                                  </div>
                                )}

                                <Button
                                  size="sm"
                                  onClick={() => exportPeriodFile(mPeriod, allInvoices, allExpenses)}
                                  className={cn(
                                    "w-full text-[10px] font-black uppercase tracking-wider rounded-xl h-8 flex items-center justify-center gap-1 shadow-sm",
                                    isMonthActive 
                                      ? "bg-teal hover:bg-teal/90 text-navy" 
                                      : "bg-slate-100 hover:bg-slate-200 text-navy"
                                  )}
                                >
                                  <Download size={12} /> {t('Download Month CSV', 'डाउनलोड मासिक फाइल')}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: PARTIES LEDGER (CUSTOMERS & VENDORS) */}
        {activeSubTab === 'parties' && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                  {t('Customer & Vendor Accounts Ledger', 'पार्टी व खाता बही')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('Track receivables, payable balance and send 1-click WhatsApp payment reminders.', 'ग्राहकों का कुल बिल, बकाया राशि और WhatsApp भुगतान स्मरण संदेश')}
                </p>
              </div>

              {/* Party Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-gray-100">
                {[
                  { id: 'all', label: `${t('All Parties', 'सभी')} (${partiesList.length})` },
                  { id: 'unpaid', label: t('With Balance Due', 'केवल बकायादार') },
                  { id: 'customers', label: t('Customers Only', 'केवल ग्राहक') },
                  { id: 'vendors', label: t('Vendors Only', 'केवल वेंडर्स') }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPartyTypeFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                      partyTypeFilter === f.id ? "bg-navy text-teal shadow-sm" : "text-gray-500 hover:text-navy"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parties Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">{t('Party Name & GSTIN', 'पार्टी का नाम व GSTIN')}</th>
                    <th className="p-3.5">{t('Type', 'प्रकार')}</th>
                    <th className="p-3.5">{t('Phone Number', 'मोबाइल नंबर')}</th>
                    <th className="p-3.5">{t('Transactions', 'लेनदेन संख्या')}</th>
                    <th className="p-3.5">{t('Total Billed (₹)', 'कुल बिल राशि')}</th>
                    <th className="p-3.5">{t('Balance Due (₹)', 'बकाया राशि')}</th>
                    <th className="p-3.5 text-right">{t('Action', 'कार्य')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy">
                  {partiesList
                    .filter(p => {
                      if (partyTypeFilter === 'unpaid') return p.balanceDue > 0;
                      if (partyTypeFilter === 'customers') return p.type === 'Customer';
                      if (partyTypeFilter === 'vendors') return p.type === 'Vendor';
                      return true;
                    })
                    .filter(p => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.gstin.toLowerCase().includes(q);
                    })
                    .map(party => (
                      <tr key={party.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <span className="font-black text-navy block">{party.name}</span>
                          {party.gstin && (
                            <span className="text-[10px] text-teal font-extrabold block">GSTIN: {party.gstin}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5",
                            party.type === 'Customer' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          )}>
                            {party.type === 'Customer' ? t('Customer', 'ग्राहक') : t('Vendor', 'सप्लायर')}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span className="text-gray-700 font-bold">{party.phone || 'N/A'}</span>
                        </td>
                        <td className="p-3.5 font-bold">
                          {party.invoicesCount} {t('bills', 'बिल')}
                        </td>
                        <td className="p-3.5 font-black text-sm text-navy">
                          {formatINR(party.totalBilled)}
                        </td>
                        <td className="p-3.5">
                          {party.balanceDue > 0 ? (
                            <span className="font-black text-sm text-amber-600 block">
                              {formatINR(party.balanceDue)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-black flex items-center gap-1">
                              <CheckCircle2 size={13} /> {t('Settled', 'चुकता')}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {party.balanceDue > 0 && party.phone && (
                            <Button
                              size="sm"
                              onClick={() => sendWhatsAppReminder(party.name, party.phone, party.balanceDue)}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm flex items-center gap-1 ml-auto"
                            >
                              <MessageCircle size={13} /> WhatsApp {t('Reminder', 'तकादा')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}

                  {partiesList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 font-bold text-xs uppercase">
                        {t('No party records found', 'कोई पार्टी रिकॉर्ड नहीं मिला')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: GST RETURNS, BANK RECONCILIATION & P&L REPORTS */}
        {activeSubTab === 'reports' && (
          <div className="space-y-6 pt-4">
            {/* 1-CLICK QUARTERLY CA & TAX EXPORT HUB */}
            <div className="bg-gradient-to-r from-navy via-[#002b54] to-navy rounded-3xl p-6 text-white shadow-lg border border-teal/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal text-navy flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black uppercase text-teal tracking-wide flex items-center gap-2">
                      {t('1-Click Quarterly CA & Tax Export', 'त्रैमासिक सीए (CA) टैक्स एक्सपोर्ट')}
                      <span className="text-[10px] bg-white/10 text-white px-2.5 py-0.5 rounded-full font-bold">
                        QRMP Scheme Compliant
                      </span>
                    </h4>
                    <p className="text-xs text-gray-300">
                      {t('Generate legal GSTR-1 Sales & Expense ITC Summary CSVs for your CA in 1 click.', 'सीए हेतु तिमाही बिक्री व इनपुट टैक्स क्रेडिट (ITC) की अलग-अलग रिपोर्ट तुरंत डाउनलोड करें।')}
                    </p>
                  </div>
                </div>

                {/* Quarter & FY Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                    {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setSelectedReportQuarter(q)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-black transition-all",
                          selectedReportQuarter === q
                            ? "bg-teal text-navy shadow-md"
                            : "text-gray-300 hover:text-white"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <select
                    value={selectedReportFy}
                    onChange={(e) => setSelectedReportFy(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-black outline-none"
                  >
                    {periodData.allYears.map(fy => (
                      <option key={fy} value={fy} className="bg-navy text-white">
                        FY 20{fy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2 Primary 1-Click Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                <Button
                  onClick={() => exportQuarterlyGSTR1SalesReport(selectedReportQuarter, selectedReportFy, allInvoices)}
                  className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-2xl h-12 px-4 shadow-md flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>{t('1. GSTR-1 Sales Report (CSV)', '1. GSTR-1 बिक्री रिपोर्ट (CSV)')}</span>
                </Button>

                <Button
                  onClick={() => exportQuarterlyExpenseITCSummary(selectedReportQuarter, selectedReportFy, allExpenses)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl h-12 px-4 shadow-md flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>{t('2. Expense & ITC Summary (CSV)', '2. खर्चे व ITC सारांश (CSV)')}</span>
                </Button>

                <Button
                  onClick={() => {
                    exportQuarterlyGSTR1SalesReport(selectedReportQuarter, selectedReportFy, allInvoices);
                    setTimeout(() => exportQuarterlyExpenseITCSummary(selectedReportQuarter, selectedReportFy, allExpenses), 250);
                    setTimeout(() => exportBankReconciliationCSV(salesInvoices, filteredExpenses), 500);
                    setTimeout(() => exportCashBookCSV(salesInvoices, filteredExpenses), 750);
                    toast.success(t('Exported all 4 CA compliance files!', 'सभी 4 सीए रिपोर्ट फाइलें डाउनलोड हो गईं!'));
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-black text-xs uppercase tracking-wider rounded-2xl h-12 px-4 flex items-center justify-center gap-2 sm:col-span-2 lg:col-span-1"
                >
                  <Download size={16} />
                  <span>{t('Complete CA Package (All 4)', 'सीए पैकेज (सभी 4 फाइलें)')}</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                  {t('GST Returns & CA Audit Reports', 'जीएसटी रिटर्न, बैंक समाधान व CA रिपोर्ट्स')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('Complete GSTR-1, GSTR-3B, Bank Reconciliation & Cash Book statements ready for your CA.', 'सीए (Chartered Accountant) व जीएसटी पोर्टल फाइलिंग के लिए पूर्ण रिपोर्ट')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => exportBankReconciliationCSV(salesInvoices, filteredExpenses)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                  title="Download Bank Statement Matching Sheet for CA"
                >
                  <Download size={14} className="mr-1" /> {t('CA Bank Recon CSV', 'CA बैंक समाधान CSV')}
                </Button>
                <Button
                  onClick={() => exportCashBookCSV(salesInvoices, filteredExpenses)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                  title="Download Cash Book for CA"
                >
                  <Download size={14} className="mr-1" /> {t('CA Cash Book CSV', 'CA कैश बुक CSV')}
                </Button>
                <Button
                  onClick={() => exportGSTR1B2BCSV(salesInvoices)}
                  className="bg-navy hover:bg-navy/90 text-teal font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                >
                  <Download size={14} className="mr-1" /> GSTR-1 CSV
                </Button>
                <Button
                  onClick={() => exportGSTR3BCSV(salesInvoices, filteredExpenses)}
                  className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-9 px-4"
                >
                  <Download size={14} className="mr-1" /> GSTR-3B CSV
                </Button>
              </div>
            </div>

            {/* GSTR-1 Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table 4 B2B Invoices */}
              <div className="bg-slate-50/70 rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-navy">GSTR-1 Table 4: B2B Invoices ({t('Registered Buyers', 'पंजीकृत खरीदार')})</h4>
                  <Badge className="bg-teal text-navy font-black text-[9px]">
                    {gstr1Data.b2bInvoices.length} {t('Invoices', 'इनवॉइस')}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">{t('Total Taxable Value:', 'कुल कर योग्य मूल्य:')}</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2bTaxable)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">IGST:</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2bIgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">CGST:</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2bCgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">SGST:</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2bSgst)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-black text-navy">
                    <span>{t('Total B2B GST Due:', 'कुल जीएसटी देय:')}</span>
                    <span className="text-teal">{formatINR(gstr1Data.summary.b2bTotalTax)}</span>
                  </div>
                </div>
              </div>

              {/* Table 7 B2C Small Supplies */}
              <div className="bg-slate-50/70 rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-navy">GSTR-1 Table 7: B2C Small ({t('Retail / Unregistered', 'सामान्य ग्राहक')})</h4>
                  <Badge variant="outline" className="text-[9px] font-black border-gray-300">
                    {gstr1Data.b2cInvoices.length} {t('Bills', 'बिल')}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">{t('Taxable Value:', 'कुल कर योग्य बिक्री:')}</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2cTaxable)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">CGST:</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2cCgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600 font-bold">SGST:</span>
                    <span className="font-black text-navy">{formatINR(gstr1Data.summary.b2cSgst)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-black text-navy">
                    <span>{t('Total B2C GST:', 'कुल B2C टैक्स:')}</span>
                    <span className="text-teal">{formatINR(gstr1Data.summary.b2cTotalTax)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GSTR-3B Tax Computation Sheet */}
            <div className="bg-white rounded-3xl p-6 border border-teal/30 shadow-md">
              <h4 className="text-sm font-black uppercase text-navy mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-teal" />
                {t('GSTR-3B Monthly Return Summary (Net Tax Liability)', 'GSTR-3B मासिक रिटर्न सारांश')}
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-teal/10 text-navy font-black uppercase tracking-wider text-[10px]">
                      <th className="p-3 rounded-l-xl">{t('Description', 'विवरण')}</th>
                      <th className="p-3">{t('Taxable Value (₹)', 'कर योग्य राशि')}</th>
                      <th className="p-3">IGST (₹)</th>
                      <th className="p-3">CGST (₹)</th>
                      <th className="p-3">SGST (₹)</th>
                      <th className="p-3 rounded-r-xl">{t('Total Tax (₹)', 'कुल टैक्स')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-navy">
                    <tr>
                      <td className="p-3 font-bold">3.1 (a) {t('Outward Taxable Supplies', 'आउटवर्ड कर योग्य बिक्री')}</td>
                      <td className="p-3 font-bold">{formatINR(gstr3bData.table3_1.taxableValue)}</td>
                      <td className="p-3">{formatINR(gstr3bData.table3_1.igst)}</td>
                      <td className="p-3">{formatINR(gstr3bData.table3_1.cgst)}</td>
                      <td className="p-3">{formatINR(gstr3bData.table3_1.sgst)}</td>
                      <td className="p-3 font-black text-navy">{formatINR(gstr3bData.table3_1.totalGst)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-700">4 (A) {t('Eligible Input Tax Credit (ITC from Expenses)', 'मान्य इनपुट टैक्स क्रेडिट')}</td>
                      <td className="p-3 font-bold">-</td>
                      <td className="p-3 text-emerald-700">{formatINR(gstr3bData.table4_itc.igst)}</td>
                      <td className="p-3 text-emerald-700">{formatINR(gstr3bData.table4_itc.cgst)}</td>
                      <td className="p-3 text-emerald-700">{formatINR(gstr3bData.table4_itc.sgst)}</td>
                      <td className="p-3 font-black text-emerald-700">(-) {formatINR(gstr3bData.table4_itc.totalItc)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-black text-sm">
                      <td className="p-3 text-navy">6.1 {t('Net Cash Tax Payable', 'शुद्ध नकद कर देनदारी')}</td>
                      <td className="p-3">-</td>
                      <td className="p-3">{formatINR(gstr3bData.netTaxPayable.igst)}</td>
                      <td className="p-3">{formatINR(gstr3bData.netTaxPayable.cgst)}</td>
                      <td className="p-3">{formatINR(gstr3bData.netTaxPayable.sgst)}</td>
                      <td className="p-3 text-teal font-black text-base">{formatINR(gstr3bData.netTaxPayable.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT EXPENSE MODAL (WITH 3 PAYMENT SOURCES & GST VS DIRECT SITE EXPENSES) */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-3xl p-6 text-navy max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <Wallet className="text-teal" size={22} />
              {editingExpenseId ? t('Edit Expense', 'खर्चा संपादित करें') : t('Record Business Expense', 'नया व्यावसायिक खर्चा दर्ज करें')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t('Classify as GST Purchase (with ITC) or Direct Unbilled Site Expense with proper fund routing.', 'जीएसटी बिल (ITC दावा) या डायरेक्ट साइट खर्चा चुनें एवं सही खाता स्त्रोत निर्दिष्ट करें।')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* 1. EXPENSE CLASSIFICATION TOGGLE: GST PURCHASE BILL VS DIRECT UNBILLED SITE EXPENSE */}
            <div>
              <label className="text-[11px] font-black uppercase text-gray-500 block mb-2">
                {t('Expense Classification *', 'खर्चे का प्रकार चुनें *')}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpenseForm(prev => ({ 
                    ...prev, 
                    is_gst_registered_vendor: false, 
                    isGstApplicable: false,
                    taxableAmount: '',
                    gstRate: 0,
                    isItcEligible: false
                  }))}
                  className={cn(
                    "py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                    !expenseForm.is_gst_registered_vendor
                      ? "bg-navy text-teal shadow-md"
                      : "text-gray-600 hover:text-navy"
                  )}
                >
                  <span>👷 {t('Direct Site Expense (Unregistered)', 'डायरेक्ट साइट खर्चा (Unbilled)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpenseForm(prev => ({ 
                    ...prev, 
                    is_gst_registered_vendor: true, 
                    isGstApplicable: true,
                    gstRate: 18,
                    isItcEligible: true
                  }))}
                  className={cn(
                    "py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                    expenseForm.is_gst_registered_vendor
                      ? "bg-teal text-navy shadow-md font-black"
                      : "text-gray-600 hover:text-navy"
                  )}
                >
                  <span>📄 {t('GST Purchase Bill (Claim ITC)', 'जीएसटी खरीद बिल (ITC दावा)')}</span>
                </button>
              </div>
            </div>

            {/* 2. PAYMENT SOURCE / MODE (3 EXPLICIT OPTIONS) */}
            <div>
              <label className="text-[11px] font-black uppercase text-gray-500 block mb-2">
                {t('Payment Source (Fund Account) *', 'भुगतान किस खाते / स्त्रोत से हुआ? *')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'SBI Current A/c (Online/UPI/NetBanking)',
                    label: t('🏦 SBI Current A/c', '🏦 SBI चालू खाता'),
                    sub: t('Bank Ledger Outflow', 'बैंक खाते से कटेगा'),
                    color: 'indigo'
                  },
                  {
                    id: 'Cash-in-Hand (Site Petty Cash)',
                    label: t('💵 Cash-in-Hand', '💵 कैश-इन-हैंड'),
                    sub: t('Cash Book Outflow', 'कैश गल्ले से कटेगा'),
                    color: 'amber'
                  },
                  {
                    id: 'Proprietor Personal Capital',
                    label: t('👤 Proprietor Capital', '👤 मालिक की पूंजी'),
                    sub: t('Owner Personal Funds', 'व्यक्तिगत बचत / UPI'),
                    color: 'purple'
                  }
                ].map(m => {
                  const isSelected = expenseForm.paymentMode === m.id || 
                    (m.id.includes('Cash') && (expenseForm.paymentMode === 'Cash' || (expenseForm.paymentMode || '').toLowerCase().includes('cash'))) ||
                    (m.id.includes('SBI') && (expenseForm.paymentMode === 'UPI' || expenseForm.paymentMode === 'Bank Transfer' || expenseForm.paymentMode === 'Cheque'));

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setExpenseForm(prev => ({ ...prev, paymentMode: m.id as any }))}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center",
                        isSelected
                          ? "bg-navy text-teal border-navy shadow-md ring-2 ring-teal/30"
                          : "bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100"
                      )}
                    >
                      <span className="font-black text-xs block">{m.label}</span>
                      <span className="text-[9px] opacity-75 block mt-0.5">{m.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* CONTEXTUAL EXPLANATION OF FUND ROUTING */}
              <div className="mt-2 p-3 rounded-xl border text-[11px] font-semibold leading-relaxed">
                {getExpensePaymentCategory(expenseForm.paymentMode) === 'proprietor_capital' ? (
                  <div className="text-purple-900 bg-purple-50 border border-purple-200 -m-3 p-3 rounded-xl flex items-start gap-2">
                    <span className="text-base">👤</span>
                    <div>
                      <strong>{t('Proprietor Capital / Owner Investment:', 'मालिक की व्यक्तिगत पूंजी / निवेश:')}</strong>{' '}
                      {t('Funded from personal savings/UPI. Will NOT deduct from business bank or counter cash. Counts as 100% valid business expense in P&L / ITR while keeping business balance positive.',
                         'यह खर्चा मालिक के व्यक्तिगत खाते/UPI से किया गया है। यह बिज़नेस बैंक या कैश गल्ले को नेगेटिव नहीं करेगा, बल्कि मालिक के निवेश खाते में जुड़ेगा और P&L में टैक्स छूट मिलेगी।')}
                    </div>
                  </div>
                ) : getExpensePaymentCategory(expenseForm.paymentMode) === 'cash' ? (
                  <div className="text-amber-900 bg-amber-50 border border-amber-200 -m-3 p-3 rounded-xl flex items-start gap-2">
                    <span className="text-base">💵</span>
                    <div>
                      <strong>{t('Cash Book (Petty Cash Ledger):', 'रोकड़ बही (Petty Cash Book):')}</strong>{' '}
                      {t('Deducts directly from Site Cash-in-Hand. Documented in the CA Cash Book report.',
                         'यह खर्चा साइट कैश / काउंटर गल्ले से कटेगा और CA की रोकड़ बही में दर्ज होगा।')}
                    </div>
                  </div>
                ) : (
                  <div className="text-indigo-900 bg-indigo-50 border border-indigo-200 -m-3 p-3 rounded-xl flex items-start gap-2">
                    <span className="text-base">🏦</span>
                    <div>
                      <strong>{t('SBI Current A/c (Online/UPI/NetBanking):', 'SBI चालू बैंक खाता:')}</strong>{' '}
                      {t('Debits from the business bank account. Enter UTR/Reference number for passbook audit matching.',
                         'यह बिज़नेस बैंक खाते से कटेगा। CA पासबुक ऑडिट मिलान हेतु नीचे UTR दर्ज करें।')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* IF UNREGISTERED DIRECT SITE EXPENSE */}
            {!expenseForm.is_gst_registered_vendor && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-navy tracking-wider flex items-center gap-1.5">
                    <span>👷</span> {t('Site Operational Expense Details (Zero Tax)', 'साइट परिचालन खर्च विवरण (गैर-जीएसटी)')}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-black border-gray-300">
                    Non-GST / P&L Expense
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Operational Category *', 'खर्च श्रेणी *')}
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    >
                      <option value="Technician & Labor">👷 Labor Wages / Mistri</option>
                      <option value="Fuel & Travel">🚚 Tempo / Cartage / Freight / Fuel</option>
                      <option value="Material & Parts">🔩 Minor Hardware / Consumables</option>
                      <option value="Office & Admin">☕ Refreshments / Site Tea / Food</option>
                      <option value="Tools & Equipment">🔧 Tools & Site Equipment</option>
                      <option value="Rent & Utilities">🏢 Rent / Site Utilities</option>
                      <option value="Other">📦 Miscellaneous Site Ops</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Payee / Worker / Shop Name', 'भुगतान पाने वाले का नाम (मिस्त्री / ड्राइवर / दुकान)')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('e.g. Raju Mistri, Auto tempo driver, Tea stall', 'उदा. राजू मिस्त्री, ऑटो टेम्पो, चाय दुकान')}
                      value={expenseForm.payeeName}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, payeeName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Amount Paid (₹) *', 'कुल चुकाई गई राशि (₹) *')}
                    </label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Date *', 'तारीख *')}
                    </label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                    {t('Description / Purpose of Work', 'कार्य विवरण / उद्देश्य')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('e.g. 2nd floor copper piping labor, daily site refreshments...', 'उदा. दूसरी मंजिल कॉपर पाइपिंग मजदूरी...')}
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                  />
                </div>
              </div>
            )}

            {/* IF GST REGISTERED VENDOR (GST PURCHASE BILL WITH ITC) */}
            {expenseForm.is_gst_registered_vendor && (
              <div className="p-4 bg-teal/10 rounded-2xl border border-teal/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-navy tracking-wider flex items-center gap-1.5">
                    <span>📄</span> {t('GST Tax Invoice Details (ITC Claim)', 'जीएसटी टैक्स इनवॉइस (ITC इनपुट टैक्स क्रेडिट)')}
                  </span>
                  <Badge className="bg-teal text-navy font-black text-[9px] uppercase">
                    Eligible for ITC
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Vendor / Supplier Name *', 'सप्लायर / फर्म का नाम *')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('e.g. Blue Star Parts Dealer, Aircon Spares', 'उदा. ब्लू स्टार पार्ट्स डीलर')}
                      value={expenseForm.vendorName}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, vendorName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        {t('Vendor GSTIN *', 'विक्रेता GSTIN *')}
                      </label>
                      {expenseForm.vendorGSTIN && (
                        <span className="text-[9px] font-bold text-teal">
                          {expenseForm.vendorGSTIN.trim().substring(0, 2) === ATOMIC_STATE_CODE 
                            ? 'Intra-State (CGST + SGST)' 
                            : 'Inter-State (IGST)'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 20XXXXX0000X1Z5"
                      value={expenseForm.vendorGSTIN}
                      maxLength={15}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, vendorGSTIN: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase text-navy outline-none bg-white focus:border-teal font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Taxable Amount (₹) *', 'कर योग्य राशि (Taxable ₹) *')}
                    </label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={expenseForm.taxableAmount}
                      onChange={(e) => {
                        const taxVal = e.target.value;
                        const taxNum = parseFloat(taxVal) || 0;
                        const slab = expenseForm.gstRate || 18;
                        const gstVal = (taxNum * slab) / 100;
                        const totVal = taxNum + gstVal;
                        setExpenseForm(prev => ({
                          ...prev,
                          taxableAmount: taxVal,
                          amount: totVal > 0 ? totVal.toFixed(2) : ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('GST Slab *', 'जीएसटी दर *')}
                    </label>
                    <select
                      value={expenseForm.gstRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        const taxNum = parseFloat(expenseForm.taxableAmount) || 0;
                        const gstVal = (taxNum * newRate) / 100;
                        const totVal = taxNum + gstVal;
                        setExpenseForm(prev => ({
                          ...prev,
                          gstRate: newRate,
                          amount: totVal > 0 ? totVal.toFixed(2) : prev.amount
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    >
                      <option value="5">5% (Transport / Basic Spares)</option>
                      <option value="12">12% (Hardware / Valves)</option>
                      <option value="18">18% (Standard HVAC Parts & Services)</option>
                      <option value="28">28% (Air Conditioners / Compressors)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Total Bill Amount (₹)', 'कुल बिल राशि (₹)')}
                    </label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={expenseForm.amount}
                      onChange={(e) => {
                        const totVal = e.target.value;
                        const totNum = parseFloat(totVal) || 0;
                        const slab = expenseForm.gstRate || 18;
                        const taxVal = totNum / (1 + slab / 100);
                        setExpenseForm(prev => ({
                          ...prev,
                          amount: totVal,
                          taxableAmount: taxVal > 0 ? taxVal.toFixed(2) : ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black text-teal outline-none bg-white focus:border-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Vendor Bill / Invoice No', 'सप्लायर का बिल नंबर')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GST-INV-2026-987"
                      value={expenseForm.invoiceNumber}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Date *', 'बिल तारीख *')}
                    </label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none bg-white focus:border-teal"
                    />
                  </div>
                </div>

                {/* LIVE TAX COMPUTATION SUMMARY BADGE */}
                {parseFloat(expenseForm.amount) > 0 && (
                  <div className="p-3 bg-white/90 rounded-xl border border-teal/20 text-xs space-y-1">
                    <div className="flex justify-between text-gray-600 font-semibold">
                      <span>{t('Taxable Value:', 'कर योग्य मूल्य:')}</span>
                      <span className="font-bold text-navy">
                        ₹{parseFloat(expenseForm.taxableAmount || (parseFloat(expenseForm.amount) / (1 + (expenseForm.gstRate || 18) / 100)).toString()).toFixed(2)}
                      </span>
                    </div>

                    {expenseForm.vendorGSTIN && expenseForm.vendorGSTIN.trim().substring(0, 2) !== ATOMIC_STATE_CODE ? (
                      <div className="flex justify-between text-gray-600 font-semibold">
                        <span>IGST ({(expenseForm.gstRate || 18)}%):</span>
                        <span className="font-black text-teal">
                          +₹{(parseFloat(expenseForm.amount) - (parseFloat(expenseForm.taxableAmount) || (parseFloat(expenseForm.amount) / (1 + (expenseForm.gstRate || 18) / 100)))).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-600 font-semibold">
                        <span>CGST ({((expenseForm.gstRate || 18) / 2)}%) + SGST ({((expenseForm.gstRate || 18) / 2)}%):</span>
                        <span className="font-black text-teal">
                          +₹{(parseFloat(expenseForm.amount) - (parseFloat(expenseForm.taxableAmount) || (parseFloat(expenseForm.amount) / (1 + (expenseForm.gstRate || 18) / 100)))).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1 border-t border-gray-200 font-black text-navy">
                      <span>{t('Eligible ITC Addition to Dashboard:', 'डैशबोर्ड ITC में जुड़ने वाली राशि:')}</span>
                      <span className="text-emerald-700">
                        ₹{(parseFloat(expenseForm.amount) - (parseFloat(expenseForm.taxableAmount) || (parseFloat(expenseForm.amount) / (1 + (expenseForm.gstRate || 18) / 100)))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DATE AUTO-ASSIGNED QUARTER BADGE */}
            {expenseForm.date && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal bg-teal/10 border border-teal/20 px-3 py-1.5 rounded-xl">
                <span>📅</span>
                <span>
                  {t(
                    `Financial Period: Quarter ${getQuarter(expenseForm.date)} • FY ${getFinancialYear(expenseForm.date)} (Auto-synced from Date)`,
                    `लेखा अवधि: तिमाही ${getQuarter(expenseForm.date)} • वित्त वर्ष ${getFinancialYear(expenseForm.date)} (तारीख से स्वतः निर्धारित)`
                  )}
                </span>
              </div>
            )}

            {/* BANK UTR / CHEQUE REF (IF BANK PAYMENT) */}
            {getExpensePaymentCategory(expenseForm.paymentMode) === 'bank' && (
              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-900 block tracking-wider">
                  {t('Bank Passbook Reconciliation Details', 'बैंक समाधान विवरण (CA Audit)')}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      {t('Bank UTR / Transaction ID', 'बैंक UTR / ट्रांजैक्शन आईडी')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR: 123456789012"
                      value={expenseForm.bankTransactionId}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, bankTransactionId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-medium text-navy outline-none bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                      <input
                        type="checkbox"
                        checked={expenseForm.reconciledWithBank}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, reconciledWithBank: e.target.checked }))}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      {t('Entry matched in bank statement', 'बैंक पासबुक में एंट्री मैच हो गई')}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsExpenseModalOpen(false)}
              className="rounded-xl text-xs font-bold text-gray-500"
            >
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={handleSaveExpense}
              className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-11 px-6 shadow-md"
            >
              {editingExpenseId ? t('Update Expense', 'अपडेट करें') : t('Confirm & Save Expense', 'खर्चा सहेजें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: RECORD PAYMENT MODAL (WITH CASH VS BANK SEPARATION & UTR) */}
      <Dialog open={!!paymentModalInvoice} onOpenChange={(open) => !open && setPaymentModalInvoice(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 text-navy">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="text-teal" size={22} />
              {t('Record Payment Receipt', 'भुगतान दर्ज करें')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t(`Record payment for invoice #${paymentModalInvoice?.estimateNumber || paymentModalInvoice?.invoiceNumber}`, `इनवॉइस #${paymentModalInvoice?.estimateNumber || paymentModalInvoice?.invoiceNumber} के लिए प्राप्त भुगतान दर्ज करें।`)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Customer', 'ग्राहक')}</span>
                <span className="font-black text-navy text-sm">{paymentModalInvoice?.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">{t('Total Bill', 'कुल बिल')}</span>
                <span className="font-black text-navy text-sm">{formatINR(paymentModalInvoice?.totalAmount)}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                {t('Received Amount in ₹ *', 'प्राप्त राशि (₹) *')}
              </label>
              <input
                type="number"
                placeholder="₹ 0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-navy outline-none focus:border-teal transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                {t('Payment Channel *', 'भुगतान माध्यम *')}
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all font-bold text-xs",
                    paymentMode === 'Cash' 
                      ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400" 
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  )}
                >
                  💵 {t('Cash Receipt', 'नकद प्राप्त')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all font-bold text-xs",
                    paymentMode !== 'Cash' 
                      ? "bg-indigo-100 text-indigo-900 border-indigo-300 ring-2 ring-indigo-400" 
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  )}
                >
                  🏦 {t('Bank / UPI Deposit', 'बैंक / UPI जमा')}
                </button>
              </div>

              {paymentMode !== 'Cash' && (
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-navy outline-none focus:border-indigo-500 transition-all bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              )}
            </div>

            {paymentMode !== 'Cash' && (
              <div className="space-y-3 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200">
                <div>
                  <label className="text-[11px] font-black uppercase text-indigo-900 block mb-1">
                    {t('Bank UTR / Transaction ID (for CA reconciliation)', 'बैंक UTR / ट्रांजैक्शन आईडी')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR: 123456789012"
                    value={paymentBankTxId}
                    onChange={(e) => setPaymentBankTxId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-navy outline-none focus:border-indigo-500 transition-all bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-900">
                  <input
                    type="checkbox"
                    checked={paymentReconciled}
                    onChange={(e) => setPaymentReconciled(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  {t('Deposit credit verified on bank passbook (Reconciled)', 'बैंक पासबुक में क्रेडिट जमा दिख गया है')}
                </label>
              </div>
            )}

            <div>
              <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                {t('Transaction Notes (Optional)', 'नोट्स / विवरण')}
              </label>
              <input
                type="text"
                placeholder={t('Remarks...', 'उदा. शेष राशि, वाउचर विवरण...')}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-navy outline-none focus:border-teal transition-all"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setPaymentModalInvoice(null)}
              className="rounded-xl text-xs font-bold text-gray-500"
            >
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={handleSavePayment}
              className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-11 px-6 shadow-md"
            >
              {t('Confirm Payment', 'भुगतान दर्ज करें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONVERT ESTIMATE TO TAX INVOICE CONFIRMATION */}
      <Dialog open={!!estimateToConvert} onOpenChange={(open) => !open && setEstimateToConvert(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 text-navy">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="text-teal" size={22} />
              {t('Convert to Official Tax Invoice', 'टैक्स इनवॉइस में बदलें')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t(`Are you sure you want to convert ${estimateToConvert?.type || 'quote'} #${estimateToConvert?.estimateNumber} to an official Tax Invoice?`, `क्या आप सचमुच #${estimateToConvert?.estimateNumber} को आधिकारिक जीएसटी टैक्स इनवॉइस में बदलना चाहते हैं?`)}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-teal/10 rounded-2xl border border-teal/20 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">{t('Client / Organization:', 'ग्राहक / कंपनी:')}</span>
              <span className="font-black text-navy">{estimateToConvert?.customerName}</span>
            </div>
            {estimateToConvert?.subject && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">{t('Subject:', 'विषय:')}</span>
                <span className="font-bold text-navy truncate max-w-[200px]">{estimateToConvert.subject}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">{t('Total Amount:', 'कुल बिल राशि:')}</span>
              <span className="font-black text-navy">{formatINR(estimateToConvert?.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">{t('GST Rate:', 'जीएसटी दर:')}</span>
              <span className="font-black text-navy">{estimateToConvert?.gstPercentage}%</span>
            </div>
            <p className="text-[11px] text-navy/70 pt-2 border-t border-teal/20">
              ⚡ {t('A new serial number (AS-26-27-XX) will be assigned and previous record marked as Converted.', 'नया क्रम संख्या (AS-26-27-XX) स्वतः असाइन होगा और पुराना रिकॉर्ड Converted मार्क हो जाएगा।')}
            </p>
          </div>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setEstimateToConvert(null)}
              className="rounded-xl text-xs font-bold text-gray-500"
            >
              {t('Cancel', 'रद्द करें')}
            </Button>
            <Button
              onClick={handleConfirmConvertEstimate}
              disabled={isConverting}
              className="bg-teal hover:bg-teal/90 text-navy font-black text-xs uppercase tracking-wider rounded-xl h-11 px-6 shadow-md"
            >
              {isConverting ? t('Converting...', 'बदल रहे हैं...') : t('Yes, Generate Tax Invoice', 'हाँ, टैक्स बिल बनाएं')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TabAccounting;
