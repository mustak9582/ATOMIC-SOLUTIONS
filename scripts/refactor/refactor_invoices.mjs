import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabInvoices.tsx', 'utf-8');

const header = `import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TabsContent } from '../ui/tabs';
import { Plus, Download, Trash2, FileText } from 'lucide-react';
import { maskPhone } from '../../lib/utils';

export interface TabInvoicesProps {
  allInvoices: any[];
  navigate: (path: string) => void;
  downloadInvoicePDF: (invoice: any) => Promise<void>;
  handleDeleteInvoice: (id: string) => void;
}

export function TabInvoices({
  allInvoices,
  navigate,
  downloadInvoicePDF,
  handleDeleteInvoice
}: TabInvoicesProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabInvoices.tsx', header + content + footer);
console.log('Successfully wrapped TabInvoices');
