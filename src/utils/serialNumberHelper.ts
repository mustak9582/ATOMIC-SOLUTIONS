export function getFinancialYearString(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

export function getDefaultSerialNumber(docType: 'Estimate' | 'Tax Invoice', count = 1): string {
  const fy = getFinancialYearString();
  const num = count.toString().padStart(2, '0');
  if (docType === 'Estimate') {
    return `PI/${fy}/${num}`;
  } else {
    return `AS/${fy}/${num}`;
  }
}
