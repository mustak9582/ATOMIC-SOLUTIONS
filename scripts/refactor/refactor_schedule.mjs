import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabSchedule.tsx', 'utf-8');

const header = `import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { ArrowLeft, Calendar, Plus, Clock, UserCircle, MapPin, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';

export interface TabScheduleProps {
  handleTabChange: (tab: string) => void;
  setIsManualBookingOpen: (isOpen: boolean) => void;
  bookings: Booking[];
  todayStr: string;
  setSelectedBookingForDetails: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
}

export function TabSchedule({
  handleTabChange,
  setIsManualBookingOpen,
  bookings,
  todayStr,
  setSelectedBookingForDetails,
  updateBooking
}: TabScheduleProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabSchedule.tsx', header + content + footer);
console.log('Successfully wrapped TabSchedule');
