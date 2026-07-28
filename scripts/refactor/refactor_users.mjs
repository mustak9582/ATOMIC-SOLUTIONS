import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabUsers.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { ArrowLeft, Search, MapPin, CheckCircle, XCircle, ShieldCheck, LockIcon, Edit, FileText, Trash2, Users, MessageCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { maskPhone, maskEmail, safeDateFormatter } from '../../lib/utils';
import { dataService } from '../../services/firebaseService';
import { toast } from 'sonner';

export interface TabUsersProps {
  users: UserProfile[];
  userSearchTerm: string;
  setUserSearchTerm: (val: string) => void;
  userRoleFilter: 'All' | 'Admin' | 'Staff' | 'Customer';
  setUserRoleFilter: (val: 'All' | 'Admin' | 'Staff' | 'Customer') => void;
  handleTabChange: (tab: string) => void;
  viewUserHistory: (user: UserProfile) => void;
  approveStaff: (uid: string) => void;
  rejectStaff: (uid: string) => void;
  toggleBlockUser: (uid: string, currentStatus: boolean) => void;
  handleEditUser: (user: UserProfile) => void;
  confirmDelete: (user: UserProfile) => void;
}

export function TabUsers({
  users,
  userSearchTerm,
  setUserSearchTerm,
  userRoleFilter,
  setUserRoleFilter,
  handleTabChange,
  viewUserHistory,
  approveStaff,
  rejectStaff,
  toggleBlockUser,
  handleEditUser,
  confirmDelete
}: TabUsersProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabUsers.tsx', header + content + footer);
console.log('Successfully wrapped TabUsers');
