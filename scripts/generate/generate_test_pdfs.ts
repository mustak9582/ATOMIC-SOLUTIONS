import fs from 'fs';
import path from 'path';
import { generateInvoicePDF, PDFInvoiceData } from '../../src/utils/pdfGenerator';

const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(path.join('.', 'public', 'logo.png')).toString('base64');
const qrBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join('.', 'public', 'qr-code.jpeg')).toString('base64');
const sigBase64 = 'data:image/png;base64,' + fs.readFileSync(path.join('.', 'public', 'signature.png')).toString('base64');

const createMockData = (type: 'Estimate' | 'Invoice'): PDFInvoiceData => ({
  type,
  number: type === 'Invoice' ? 'INV-940829' : 'EST-891205',
  date: new Date().toISOString(),
  customerName: 'Sanjay Kumar',
  customerPhone: '+91-9876543210',
  customerAddress: '123 Main Street, Bokaro Steel City',
  customerState: 'Jharkhand - 20',
  customerGSTIN: '20ABCDE1234F1Z5',
  items: Array.from({ length: 25 }).map((_, i) => ({
    name: `Test Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    hsn: '8415',
    uom: 'Nos',
    quantity: 2,
    rate: 1500,
    taxable: 3000,
    gstPercent: 18,
    gstAmount: 540,
    amount: 3540
  })),
  summary: {
    taxableAmount: 25 * 3000,
    cgstAmount: 25 * 270,
    sgstAmount: 25 * 270,
    igstAmount: 0,
    freightCharges: 0,
    discountAmount: 0,
    roundOff: 0
  },
  totalAmount: 25 * 3540,
  bankDetails: 'NAME: MUSTAK ANSARI\nBANK NAME: BANK OF BARODA\nIFSC CODE: BARB0DEOGHA\nA/C: 26450200001659\nPAN: CVVPA9010L',
  companyPhone: '9582268658',
  companyAddress: '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
  companyEmail: 'atomichvacsolutions@gmail.com',
  logoUrl: logoBase64,
  qrCodeUrl: qrBase64,
  signatureUrl: sigBase64
});

const estDoc = generateInvoicePDF(createMockData('Estimate'));
fs.writeFileSync('C:\\Users\\Ahad\\Desktop\\Test_Estimate.pdf', Buffer.from(estDoc.output('arraybuffer')));
console.log('Generated C:\\Users\\Ahad\\Desktop\\Test_Estimate.pdf');

const invDoc = generateInvoicePDF(createMockData('Invoice'));
fs.writeFileSync('C:\\Users\\Ahad\\Desktop\\Test_Invoice.pdf', Buffer.from(invDoc.output('arraybuffer')));
console.log('Generated C:\\Users\\Ahad\\Desktop\\Test_Invoice.pdf');
