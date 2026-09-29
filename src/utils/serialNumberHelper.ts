export function getFinancialYearString(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0=Jan, 3=Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

export function getDefaultSerialNumber(
  docType: 'Estimate' | 'Tax Invoice' | 'Simple Invoice' | 'Invoice', 
  count = 1
): string {
  const fy = getFinancialYearString();
  const num = count.toString().padStart(2, '0');
  if (docType === 'Estimate') {
    return `PI-${fy}-${num}`;
  } else {
    return `AS-${fy}-${num}`;
  }
}

export function getNextSerialNumberForInvoices(
  docType: 'Estimate' | 'Tax Invoice' | 'Simple Invoice' | 'Invoice',
  allInvoices: any[] = []
): string {
  const fy = getFinancialYearString();
  const isEstimate = docType === 'Estimate';
  const prefix = isEstimate ? 'PI' : 'AS';
  
  let maxNum = 0;
  if (Array.isArray(allInvoices)) {
    allInvoices.forEach(inv => {
      const invType = inv.type || '';
      const matchesType = isEstimate ? invType === 'Estimate' : invType !== 'Estimate';
      if (matchesType) {
        const numStr = (inv.estimateNumber || inv.invoiceNumber || inv.number || '').toString();
        // Check for current FY and match number at the end
        if (numStr.includes(fy) || numStr.startsWith(prefix)) {
          const m = numStr.match(/(\d+)$/);
          if (m) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxNum) {
              maxNum = val;
            }
          }
        }
      }
    });
  }

  const nextCount = maxNum > 0 ? maxNum + 1 : 1;
  return `${prefix}-${fy}-${nextCount.toString().padStart(2, '0')}`;
}
