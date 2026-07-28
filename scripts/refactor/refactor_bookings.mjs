import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabBookings.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { ArrowLeft, Search, Phone, MessageCircle, FileText, Briefcase, CheckCircle, Clock, XCircle, Trash2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Booking, UserProfile, BookingStatus } from '../../types';
import { cn, maskPhone, formatWhatsAppLink, safeDateFormatter } from '../../lib/utils';
import { toast } from 'sonner';

// Helper for status colors
const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export interface TabBookingsProps {
  handleTabChange: (tab: string) => void;
  statusFilter: BookingStatus | 'All';
  setStatusFilter: (status: BookingStatus | 'All') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredBookings: Booking[];
  users: UserProfile[];
  setSelectedBookingForDetails: (booking: Booking | null) => void;
  setBookingToAssign: (booking: Booking | null) => void;
  setPayoutAmount: (amount: number) => void;
  setIsStaffModalOpen: (isOpen: boolean) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  setBookingToDeleteId: (id: string | null) => void;
}

export function TabBookings({
  handleTabChange,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  filteredBookings,
  users,
  setSelectedBookingForDetails,
  setBookingToAssign,
  setPayoutAmount,
  setIsStaffModalOpen,
  updateBooking,
  setBookingToDeleteId
}: TabBookingsProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabBookings.tsx', header + content + footer);
console.log('Successfully wrapped TabBookings');
