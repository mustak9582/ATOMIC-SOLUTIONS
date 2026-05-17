export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
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

export type BookingStatus = 'Pending' | 'Assigned' | 'Accepted' | 'In Progress' | 'Rejected' | 'Completed';

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
  // Staff Assignment
  staffId?: string;
  staffName?: string;
  payoutAmount?: number;
  workDescription?: string;
  completionDate?: string;
  location?: {
    lat: number;
    lng: number;
    detectedAt?: string;
  };
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
  estimateNumber: string;
  type: 'Invoice' | 'Estimate';
  date: string;
  items: BillingItem[];
  subTotal: number;
  discount: number;
  roundOff?: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  bankDetails: string;
  terms: string;
  status: 'Draft' | 'Sent' | 'Paid';
  timestamp: string;
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
  logoUrl: string;
  ownerGSTIN?: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  gallery?: string[];
  videos?: { id: string; url: string; title?: string }[];
}
