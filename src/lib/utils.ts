import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppLink(phone: string, text: string = '') {
  // Extract only digits and take the last 10
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone) return '#';
  return `https://wa.me/91${cleanPhone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const maskPhone = (phone?: string) => {
  if (!phone) return 'N/A';
  if (phone.length < 5) return phone;
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

export const maskEmail = (email?: string) => {
  if (!email) return 'No email';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  if (name.length < 3) return `***@${domain}`;
  return name.slice(0, 2) + '*'.repeat(name.length - 2) + '@' + domain;
};

export const compressImage = async (file: File, maxSize: number = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const safeDateFormatter = (date: any, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!date) return 'N/A';
  try {
    // Handle Firestore Timestamps
    if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString(undefined, options);
    }
    // Handle strings or numbers
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, options);
  } catch (e) {
    return 'N/A';
  }
};

export const safeTimeFormatter = (date: any) => {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleTimeString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString();
  } catch (e) {
    return 'N/A';
  }
};
