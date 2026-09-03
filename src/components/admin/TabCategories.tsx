import React from 'react';
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
          <TabsContent value="categories">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Service Categories</h3>
                  <Button 
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    onClick={() => openCategoryModal()}
                  >
                    <Plus size={16} className="mr-2" /> Add Category
                  </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {categories.map(category => (
                   <div key={category.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-center mb-4">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                         <Grid size={24} />
                       </div>
                       <div className="flex gap-2">
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openCategoryModal(category)}>
                           <Edit size={16} />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setCategoryToDeleteId(category.id)}>
                           <Trash2 size={16} />
                         </Button>
                       </div>
                     </div>
                     <h4 className="text-lg font-black text-navy uppercase tracking-tight mb-2">{category.name}</h4>
                     <p className="text-sm text-gray-500 line-clamp-2">{category.description || 'No description provided.'}</p>
                   </div>
                 ))}
               </div>
            </Card>
          </TabsContent>
  );
}
