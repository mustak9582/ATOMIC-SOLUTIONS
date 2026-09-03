import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabStaff.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TabsContent } from '../ui/tabs';
import { MapPin, CheckCircle, XCircle, Unlock, LockIcon } from 'lucide-react';
import { UserProfile, Booking } from '../../types';
import { formatWhatsAppLink, maskPhone, maskEmail } from '../../lib/utils';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';

export interface TabStaffProps {
  staffFilter: 'All' | 'Pending' | 'Approved';
  setStaffFilter: (filter: 'All' | 'Pending' | 'Approved') => void;
  users: UserProfile[];
  bookings: Booking[];
  approveStaff: (uid: string) => void;
  rejectStaff: (uid: string) => void;
  viewUserHistory: (user: UserProfile) => void;
  toggleBlockUser: (uid: string, currentStatus: boolean) => void;
  confirmDelete: (user: UserProfile) => void;
}

export function TabStaff({
  staffFilter,
  setStaffFilter,
  users,
  bookings,
  approveStaff,
  rejectStaff,
  viewUserHistory,
  toggleBlockUser,
  confirmDelete
}: TabStaffProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabStaff.tsx', header + content + footer);
console.log('Successfully wrapped TabStaff');
