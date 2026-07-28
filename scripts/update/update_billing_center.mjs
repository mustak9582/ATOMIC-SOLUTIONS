import fs from 'fs';

let content = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

// 1. Change "BILL/CASH MEMO"
content = content.replace(
  "doc.text('BILL/CASH MEMO', pageWidth / 2, 12, { align: 'center' });",
  "doc.text(isInvoice ? 'TAX INVOICE' : 'ESTIMATE', pageWidth / 2, 15, { align: 'center' });"
);

// Push slogan down
content = content.replace(
  "doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 12, { align: 'right' });",
  "doc.text('WE BRING COMFORT LIFE', pageWidth - 15, 15, { align: 'right' });"
);

// Push mobile down
content = content.replace(
  "doc.text(`MOB:- ${settings?.phone || '9582268658'}`, pageWidth - 15, 18, { align: 'right' });",
  "doc.text(`MOB:- ${settings?.phone || '9582268658'}`, pageWidth - 15, 21, { align: 'right' });"
);

// Push Company name down
content = content.replace(
  "doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 22, { align: 'center' });",
  "doc.text('ATOMIC SOLUTIONS', pageWidth / 2, 25, { align: 'center' });"
);

// Push Address down
content = content.replace(
  "doc.text(addressLine, pageWidth / 2, 28, { align: 'center' });",
  "doc.text(addressLine, pageWidth / 2, 31, { align: 'center' });"
);

// Fix logo dimensions
content = content.replace(
  "doc.addImage(logoUrl, 'PNG', 15, 13, 20, 20);",
  "doc.addImage(logoUrl, 'PNG', 15, 10, 35, 14);"
);

// Fix black border from 10,10 to 5,5
content = content.replace(
  "doc.rect(10, 10, pageWidth - 20, pageHeight - 20);",
  "doc.rect(5, 5, pageWidth - 10, pageHeight - 10);"
);

// Add useEffect to auto-increment estimateNumber
const useEff = `
  useEffect(() => {
    const fetchMaxInvoice = async () => {
      try {
        const allInvoices = await dataService.getCollection('invoices');
        let maxNum = 100;
        allInvoices.forEach((inv: any) => {
          const numStr = (inv.estimateNumber || inv.invoiceNumber || '').split('-').pop();
          const num = parseInt(numStr);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        });
        setEstimateNumber(\`EST-\${maxNum + 1}\`);
      } catch (e) {
        console.error('Failed to fetch max invoice number', e);
      }
    };
    fetchMaxInvoice();
  }, []);
`;

// Insert the useEffect right before `const handleAddItem`
content = content.replace(
  "const handleAddItem = () => {",
  useEff + "\n  const handleAddItem = () => {"
);

// Remove the default Date.now() if we want to wait for the useEffect, 
// or keep it and let useEffect override it. Keeping it is fine as a fallback.

fs.writeFileSync('src/components/BillingCenter.tsx', content);
console.log('Updated BillingCenter.tsx (Layout & Auto-Increment)');
