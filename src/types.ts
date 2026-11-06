export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  minPrice?: number;
  maxPrice?: number;
  labourMin?: number;
  labourMax?: number;
  materialMin?: number;
  materialMax?: number;
  unit?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  prices?: {
    min: number;
    max: number;
  };
  images: string[];
  youtubeId?: string;
  detailedDescription?: string;
  featuredImage?: string;
  staffCategory?: string; // Links to STAFF_CATEGORIES in constants.ts
  subCategories?: SubCategory[];
  sequence?: number;
  isActive?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
  isApproved?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  isPhoneVerified?: boolean;
  whatsappNumber?: string;
  address: string;
  email?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  staffStatus?: 'pending' | 'approved' | 'rejected';
  isBlocked?: boolean;
  staffCategory?: string; // e.g., 'Electrician', 'AC Technician', 'Plumber'
  workArea?: string; // e.g., 'Deoghar Central', 'Jasidih'
  staffRating?: number;
  lastLoginAt?: string;
  location?: { 
    lat: number; 
    lng: number; 
    address?: string;
    timestamp?: string;
  };
}

export type BookingStatus = 'Pending' | 'Assigned' | 'Accepted' | 'On the Way' | 'Arrived' | 'In Progress' | 'Rejected' | 'Completed';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_new' | 'booking_update' | 'system' | 'payout';
  read: boolean;
  timestamp: any;
  link?: string;
  relatedId?: string;
}

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'customer' | 'technician' | 'admin';
  senderName: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  whatsappNumber?: string;
  userAddress: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  category: string;
  subCategory?: string;
  tier: 'basic' | 'standard' | 'premium' | 'custom';
  price: number;
  status: BookingStatus;
  timestamp: any;
  appointmentDate?: string;
  appointmentSlot?: string;
  // Staff Assignment & Tracking
  staffId?: string;
  staffName?: string;
  staffPhone?: string;
  staffPhoto?: string;
  staffCategory?: string;
  eta?: string;
  technicianLocation?: {
    lat: number;
    lng: number;
    address?: string;
    updatedAt?: string;
  };
  payoutAmount?: number;
  workDescription?: string;
  completionDate?: string;
  location?: {
    lat: number;
    lng: number;
    detectedAt?: string;
  };
  bookingType?: 'LABOUR' | 'MATERIAL' | 'GENERAL' | 'BOTH';
  paymentPreference?: '50% Advance' | '100% Full Payment';
  advanceAmount?: number;
  totalAmount?: number;
  paymentProofUrl?: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  category: string;
  title?: string;
}

export interface BillingItem {
  id: string;
  name: string;
  description: string;
  hsn?: string;
  rate: number;
  quantity: number;
  unit: string;
  type?: 'Labor' | 'Material' | 'General';
}

export interface Invoice {
  id?: string;
  userId: string | null;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGSTIN?: string;
  customerState?: string;
  customerStateCode?: string;
  estimateNumber: string;
  invoiceNumber?: string;
  type: 'Invoice' | 'Estimate' | 'Tax Invoice' | 'Simple Invoice' | 'Quotation';
  invoiceSubtype?: 'B2B' | 'B2C';
  date: string;
  dueDate?: string;
  validUntil?: string;
  subject?: string;
  workScope?: string;
  kindAttn?: string;
  items: BillingItem[];
  subTotal: number;
  discount: number;
  freightCharges?: number;
  roundOff?: number;
  gstPercentage: number;
  gstAmount: number;
  gstType?: 'cgst_sgst' | 'igst';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentMode?: string;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial';
  paymentDate?: string;
  paymentNotes?: string;
  bankTransactionId?: string;
  reconciledWithBank?: boolean;
  bankDetails: string;
  terms: string;
  declaration?: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Verification Pending' | 'Converted';
  paymentProofUrl?: string;
  timestamp: string;
  convertedFromEstimateId?: string;
  convertedAt?: string;
}

export type ExpenseCategory =
  | 'Material & Parts'
  | 'Fuel & Travel'
  | 'Technician & Labor'
  | 'Rent & Utilities'
  | 'Tools & Equipment'
  | 'Office & Admin'
  | 'Marketing & Ads'
  | 'Taxes & Govt Fees'
  | 'Other';

export type ExpensePaymentMode =
  | 'SBI Current A/c (Online/UPI/NetBanking)'
  | 'Cash-in-Hand (Site Petty Cash)'
  | 'Proprietor Personal Capital'
  | 'Cash'
  | 'UPI'
  | 'Bank Transfer'
  | 'Cheque'
  | string;

export interface Expense {
  id?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMode: ExpensePaymentMode;
  payeeName?: string;
  vendorName?: string;
  vendorPhone?: string;
  vendorGSTIN?: string;
  vendorState?: string;
  vendorStateCode?: string;
  isGstApplicable: boolean;
  isGstRegisteredVendor?: boolean;
  is_gst_registered_vendor?: boolean;
  gstRate?: number; // 0, 5, 12, 18, 28
  taxableAmount?: number;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  isItcEligible?: boolean; // Input Tax Credit eligibility
  invoiceNumber?: string;
  notes?: string;
  bankTransactionId?: string;
  bankAccountName?: string;
  reconciledWithBank?: boolean;
  financialYear?: string; // e.g. "2026-27"
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  createdAt: string;
}

export interface Visit {
  id: string;
  bookingId?: string;
  userId?: string;
  staffId?: string;
  staffName?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  serviceName?: string;
  date: string;
  timeSlot: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  description?: string;
  createdAt: any;
}

export interface AppSettings {
  id?: string;
  // Company & Brand
  companyName?: string;
  companyTagline?: string;
  companyDescription?: string;
  logoUrl: string;
  faviconUrl?: string;

  // Founder & Leadership
  founderName?: string;
  founderTitle?: string;
  founderPhone?: string;
  founderEmail?: string;
  founderBio?: string;
  founderAddress?: string;

  // Contact & Communication
  whatsappNumber: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;

  // Tax & Legal Compliance
  ownerGSTIN?: string;
  panNumber?: string;
  msmeNumber?: string;

  // Banking & Payment
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankAccountType?: 'Current' | 'Savings';
  upiId?: string;
  upiIdSecondary?: string;
  qrCodeUrl?: string;

  // Invoice Defaults & Signatures
  authorisedSignatory?: string;
  signatureUrl?: string;
  defaultTerms?: string;
  defaultDeclaration?: string;
  invoiceThankYouNote?: string;

  // Social & Online Links
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  mapLocationUrl?: string;

  // Media
  gallery?: string[];
  videos?: { id: string; url: string; title?: string }[];
}

// --- STORE TYPES ---

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  inStock: boolean;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StoreOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  subTotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'Cash on Delivery' | 'Pay Online';
  status: OrderStatus;
  courierPartner?: string;
  courierPhone?: string;
  expectedDelivery?: string;
  trackingUpdates?: { status: OrderStatus; timestamp: string; note?: string }[];
  timestamp: string;
}

export interface StoreSettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isActive: boolean;
}
