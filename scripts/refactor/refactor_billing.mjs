import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabBilling.tsx', 'utf-8');

const header = `import React from 'react';
import { TabsContent } from '../ui/tabs';
import BillingCenter from './BillingCenter';
import { Service } from '../../types';

export interface TabBillingProps {
  services: Service[];
  appSettings: any;
}

export function TabBilling({ services, appSettings }: TabBillingProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabBilling.tsx', header + content + footer);
console.log('Successfully wrapped TabBilling');
