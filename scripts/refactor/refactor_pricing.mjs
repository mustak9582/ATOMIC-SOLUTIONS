import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabPricing.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TabsContent } from '../ui/tabs';
import { Zap, Layers, Plus, ArrowUp, ArrowDown, Trash2, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Service, Category } from '../../types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface TabPricingProps {
  isAutoSave: boolean;
  setIsAutoSave: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  categories: Category[];
  setEditingService: (service: Partial<Service> | null) => void;
  setIsServiceModalOpen: (isOpen: boolean) => void;
  services: Service[];
  moveService: (index: number, direction: 'up' | 'down') => void;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  setServiceToDeleteId: (id: string | null) => void;
  dirtyServices: Record<string, boolean>;
  setDirtyServices: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleLocalServiceUpdate: (id: string, updates: Partial<Service>) => void;
  handleFeaturedImageUpload: (serviceId: string, file: File | null) => Promise<void>;
}

export function TabPricing({
  isAutoSave,
  setIsAutoSave,
  setActiveTab,
  categories,
  setEditingService,
  setIsServiceModalOpen,
  services,
  moveService,
  updateService,
  setServiceToDeleteId,
  dirtyServices,
  setDirtyServices,
  handleLocalServiceUpdate,
  handleFeaturedImageUpload
}: TabPricingProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabPricing.tsx', header + content + footer);
console.log('Successfully wrapped TabPricing');
