import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabReports.tsx', 'utf-8');

const header = `import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TabsContent } from '../ui/tabs';
import { CheckCircle, UserCircle, Phone, VideoIcon, Search, Trash2 } from 'lucide-react';
import { safeDateFormatter, maskPhone } from '../../lib/utils';

export interface TabReportsProps {
  reports: any[];
  updateReport: (id: string, updates: any) => void;
  deleteReport: (id: string) => void;
}

export function TabReports({
  reports,
  updateReport,
  deleteReport
}: TabReportsProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabReports.tsx', header + content + footer);
console.log('Successfully wrapped TabReports');
