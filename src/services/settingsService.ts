import { AppSettings } from '../types';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'main',
  // Company & Brand
  companyName: 'ATOMIC SOLUTIONS',
  companyTagline: 'We Bring Comfort Life',
  companyDescription: 'Atomic Solutions is your premium partner for HVAC, construction, interiors, and essential home services in Deoghar and Jharkhand.',
  logoUrl: 'https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png',
  faviconUrl: '',

  // Founder & Leadership
  founderName: 'Mustak Ansari',
  founderTitle: 'Founder & Managing Director',
  founderPhone: '+91 95822 68658',
  founderEmail: 'atomichvacsolution@gmail.com',
  founderBio: 'Committed to delivering world-class HVAC, Civil Engineering, Electrical, Plumbing and Home Renovation services in Deoghar and across Jharkhand.',
  founderAddress: 'Binjha, Sonraithari, Deoghar, Jharkhand 814149',

  // Contact & Communication
  whatsappNumber: '919582268658',
  phone: '+91 95822 68658',
  alternatePhone: '+91 95822 68658',
  email: 'atomichvacsolution@gmail.com',
  address: '96 BINJHA KURUWA, DUMARIA, DEOGHAR, JHARKHAND 814149',
  city: 'Deoghar',
  state: 'Jharkhand',
  stateCode: '20',
  pincode: '814149',

  // Tax & Legal Compliance
  ownerGSTIN: '20CVVPA9010L1Z5',
  panNumber: 'CVVPA9010L',
  msmeNumber: 'UDYAM-JH-04-0012345',

  // Banking & Payment
  bankAccountHolder: 'MUSTAK ANSARI',
  bankName: 'BANK OF BARODA',
  bankAccountNumber: '26450200001659',
  bankIfsc: 'BARB0DEOGHA',
  bankBranch: 'Deoghar Main Branch, Jharkhand',
  bankAccountType: 'Current',
  upiId: 'mustakansari9582-3@okhdfcbank',
  upiIdSecondary: '9582268658@ybl',
  qrCodeUrl: '',

  // Invoice Defaults & Signatures
  authorisedSignatory: 'Mustak Ansari',
  signatureUrl: '',
  defaultTerms: '1. 50% Advance with order.\n2. Balance against delivery.\n3. Goods once sold will not be taken back.',
  defaultDeclaration: '1. Subject to Deoghar (Jharkhand) jurisdiction\n2. Terms & conditions are subject to our trade policy\n3. Our risk & responsibility ceases after the delivery of goods.\nE. & O.E.',
  invoiceThankYouNote: 'Thank You For Business With US!',

  // Social & Online Links
  websiteUrl: 'https://atomicsolutions.in',
  facebookUrl: 'https://www.facebook.com/share/1dSMDs9QUQ/',
  instagramUrl: 'https://www.instagram.com/atomic_solutions_1',
  youtubeUrl: 'https://www.youtube.com/@AtomicSolutions610',
  linkedinUrl: '',
  mapLocationUrl: '',

  // Media
  gallery: [],
  videos: []
};

export function formatBankDetailsString(settings: Partial<AppSettings>): string {
  if (!settings) return '';
  const lines: string[] = [];
  if (settings.bankAccountHolder && settings.bankAccountHolder.trim()) {
    lines.push(`NAME: ${settings.bankAccountHolder.trim()}`);
  }
  if (settings.bankName && settings.bankName.trim()) {
    lines.push(`BANK NAME: ${settings.bankName.trim()}`);
  }
  if (settings.bankIfsc && settings.bankIfsc.trim()) {
    lines.push(`IFSC CODE: ${settings.bankIfsc.trim()}`);
  }
  if (settings.bankAccountNumber && settings.bankAccountNumber.trim()) {
    lines.push(`A/C: ${settings.bankAccountNumber.trim()}`);
  }
  if (settings.bankBranch && settings.bankBranch.trim()) {
    lines.push(`BRANCH: ${settings.bankBranch.trim()}`);
  }
  if (settings.panNumber && settings.panNumber.trim()) {
    lines.push(`PAN: ${settings.panNumber.trim()}`);
  }
  if (settings.upiId && settings.upiId.trim()) {
    lines.push(`UPI ID: ${settings.upiId.trim()}`);
  }
  return lines.join('\n');
}

export function getMergedSettings(custom?: Partial<AppSettings> | null): AppSettings {
  if (!custom) return { ...DEFAULT_APP_SETTINGS };
  return {
    ...DEFAULT_APP_SETTINGS,
    ...custom,
    id: custom.id || DEFAULT_APP_SETTINGS.id
  };
}
