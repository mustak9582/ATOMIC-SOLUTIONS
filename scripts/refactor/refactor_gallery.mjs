import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabGallery.tsx', 'utf-8');

const header = `import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import { motion } from 'motion/react';
import { Trash2, Plus, ImageIcon, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../../lib/utils';
import { AppSettings } from '../../types';

export interface TabGalleryProps {
  appSettings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  uploadProgress: { active: boolean, percent: number, fileName: string };
  setUploadProgress: React.Dispatch<React.SetStateAction<{ active: boolean, percent: number, fileName: string }>>;
  cancelUploadRef: React.MutableRefObject<boolean>;
}

export function TabGallery({
  appSettings,
  updateSettings,
  uploadProgress,
  setUploadProgress,
  cancelUploadRef
}: TabGalleryProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabGallery.tsx', header + content + footer);
console.log('Successfully wrapped TabGallery');
