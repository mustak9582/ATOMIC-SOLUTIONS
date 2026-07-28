import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabCategories.tsx', 'utf-8');

const header = `import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TabsContent } from '../ui/tabs';
import { Plus, Grid, Edit, Trash2 } from 'lucide-react';
import { Category } from '../../types';

export interface TabCategoriesProps {
  categories: Category[];
  openCategoryModal: (category?: Category) => void;
  setCategoryToDeleteId: (id: string | null) => void;
}

export function TabCategories({
  categories,
  openCategoryModal,
  setCategoryToDeleteId
}: TabCategoriesProps) {
  return (
`;

const footer = `
  );
}
`;

fs.writeFileSync('src/components/admin/TabCategories.tsx', header + content + footer);
console.log('Successfully wrapped TabCategories');
