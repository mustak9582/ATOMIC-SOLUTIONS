import React from 'react';
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
          <TabsContent value="pricing">
            <Card className="rounded-[32px] border-none shadow-xl shadow-gray-100 p-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Manage Services</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <div className={cn(
                         "w-8 h-4 rounded-full transition-colors relative cursor-pointer",
                         isAutoSave ? "bg-teal" : "bg-gray-200"
                       )} onClick={() => setIsAutoSave(!isAutoSave)}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                            isAutoSave ? "left-[18px]" : "left-0.5"
                          )} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-navy">Live Sync Mode</span>
                       {isAutoSave && <Zap size={10} className="text-teal animate-pulse" />}
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-blue-200 text-blue-600 font-bold"
                      onClick={() => setActiveTab('categories')}
                    >
                      <Layers size={16} className="mr-2" /> Manage Categories
                    </Button>
                    <Button 
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={() => {
                        setEditingService({ name: '', category: categories[0]?.name, images: [], subCategories: [] });
                        setIsServiceModalOpen(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" /> Add Service
                    </Button>
                  </div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {services.sort((a,b) => (a.sequence || 0) - (b.sequence || 0)).map((s, index) => (
                    <div key={s.id} className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 hover:border-blue-200 transition-colors relative group">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveService(index, 'up')}><ArrowUp size={14} /></Button>
                           <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveService(index, 'down')}><ArrowDown size={14} /></Button>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center gap-3">
                              <div>
                                 <h4 className="font-black text-navy uppercase tracking-tighter text-lg">{s.name}</h4>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sequence: {s.sequence || 0}</span>
                              </div>
                              <Badge className={s.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {s.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                           </div>
                           <div className="flex items-center gap-2">
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-8 text-[10px] font-black uppercase"
                               onClick={() => updateService(s.id, { isActive: s.isActive === false })}
                             >
                               {s.isActive === false ? 'Enable' : 'Disable'}
                             </Button>
                             <select 
                               className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold"
                               value={s.category}
                               onChange={(e) => updateService(s.id, { category: e.target.value })}
                             >
                               {categories.map(c => (
                                 <option key={c.id} value={c.name}>{c.name}</option>
                               ))}
                             </select>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setServiceToDeleteId(s.id)}>
                               <Trash2 size={16} />
                             </Button>
                           </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                           <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                             <div>
                                <h5 className="font-black text-blue-700 text-[10px] uppercase tracking-widest mb-1">Sub-categories & Pricing</h5>
                             </div>
                             <Button 
                                size="sm" 
                                className="rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase"
                                onClick={() => {
                                  const newSub = { id: `sub-${Date.now()}`, name: 'New Sub-category', minPrice: 0, maxPrice: 0 };
                                  updateService(s.id, { subCategories: [...(s.subCategories || []), newSub] });
                                }}
                              >
                                <Plus size={14} className="mr-1" /> Add
                              </Button>
                           </div>

                           <div className="space-y-3">
                              {(s.subCategories || []).map((sub, idx) => (
                                <div key={sub.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex gap-4 mb-3">
                                    <div className="flex-1 relative group/field">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Sub-category Name</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs focus:bg-white focus:border-blue-100 outline-none transition-all"
                                        defaultValue={sub.name}
                                        onBlur={(e) => {
                                          if (e.target.value === sub.name) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, name: e.target.value };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                      {!isAutoSave && dirtyServices[s.id] && (
                                        <button 
                                          onClick={async () => {
                                            const newSubs = [...(s.subCategories || [])];
                                            await updateService(s.id, { subCategories: newSubs });
                                            setDirtyServices(prev => { const next = {...prev}; delete next[s.id]; return next; });
                                            toast.success("Saved!");
                                          }}
                                          className="absolute right-2 top-7 opacity-0 group-hover/field:opacity-100 transition-opacity text-teal hover:scale-110"
                                          title="Save Item Now"
                                        >
                                          <Save size={14} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="w-24">
                                      <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-1">Unit (e.g. Sq. Ft)</label>
                                      <input 
                                        className="w-full bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 font-bold text-xs"
                                        defaultValue={sub.unit || ''}
                                        onBlur={(e) => {
                                          if (e.target.value === (sub.unit || '')) return;
                                          const newSubs = [...(s.subCategories || [])];
                                          newSubs[idx] = { ...sub, unit: e.target.value };
                                          handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                        }}
                                      />
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 mt-5"
                                      onClick={() => {
                                        const newSubs = (s.subCategories || []).filter(item => item.id !== sub.id);
                                        updateService(s.id, { subCategories: newSubs });
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <label className="text-[8px] font-black text-blue-400 tracking-widest uppercase block mb-1">Labour (₹)</label>
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-blue-50/30 border border-blue-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-blue-200 pr-8"
                                          defaultValue={sub.labourMin || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.labourMin || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            // Also update labourMax to be the same as labourMin to avoid any range logic elsewhere
                                            newSubs[idx] = { ...sub, labourMin: val, labourMax: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black text-green-400 tracking-widest uppercase block mb-1">Material (₹)</label>
                                      <div className="relative group/price">
                                        <input 
                                          type="number"
                                          className="w-full bg-green-50/30 border border-green-50 rounded-lg px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-green-200 pr-8"
                                          defaultValue={sub.materialMin || 0}
                                          onBlur={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (isNaN(val) || val === (sub.materialMin || 0)) return;
                                            const newSubs = [...(s.subCategories || [])];
                                            // Also update materialMax to be the same as materialMin
                                            newSubs[idx] = { ...sub, materialMin: val, materialMax: val };
                                            handleLocalServiceUpdate(s.id, { subCategories: newSubs });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                        {!isAutoSave && dirtyServices[s.id] && (
                                          <button 
                                            onClick={() => updateService(s.id, { subCategories: s.subCategories })}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/price:opacity-100 transition-opacity text-green-400 hover:text-green-600"
                                          >
                                            <Save size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fallback pricing removed as per user request */}
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1 mb-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">YouTube Video ID</label>
                          <input 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm" 
                            defaultValue={s.youtubeId} 
                            placeholder="e.g. dQw4w9WgXcQ"
                            onBlur={(e) => handleLocalServiceUpdate(s.id, { youtubeId: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block text-sm">Images (URLs, one per line)</label>
                          <textarea 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-xs h-24" 
                            defaultValue={(s.images || []).join('\n')} 
                            onBlur={(e) => handleLocalServiceUpdate(s.id, { images: e.target.value.split('\n').filter(l => l.trim()) })}
                          />
                        </div>

                        <div className="space-y-2 mt-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Featured Image</label>
                          <div className="flex items-center gap-4">
                            {s.featuredImage && (
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                <img src={s.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFeaturedImageUpload(s.id, e.target.files?.[0] || null)}
                                className="w-full text-xs text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-[10px] file:font-black file:uppercase file:tracking-widest
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Detailed Description (Rich Text)</label>
                          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 ql-container-hover">
                            <ReactQuill 
                              theme="snow" 
                              value={s.detailedDescription || ''} 
                              onChange={(content) => {
                                handleLocalServiceUpdate(s.id, { detailedDescription: content });
                              }}
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, false] }],
                                  ['bold', 'italic', 'underline'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}],
                                  ['link', 'clean']
                                ],
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                           <Button 
                             disabled={!dirtyServices[s.id]}
                             onClick={async () => {
                               const loadingToast = toast.loading(`Saving ${s.name} prices...`);
                               try {
                                 await updateService(s.id, { 
                                   subCategories: s.subCategories,
                                   youtubeId: s.youtubeId,
                                   images: s.images,
                                   detailedDescription: s.detailedDescription
                                 });
                                 setDirtyServices(prev => {
                                   const next = { ...prev };
                                   delete next[s.id];
                                   return next;
                                 });
                                 toast.success(`${s.name} updated successfully!`, { id: loadingToast });
                               } catch (err) {
                                 toast.error("Failed to save changes", { id: loadingToast });
                               }
                             }}
                             className={cn(
                               "rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all",
                               dirtyServices[s.id] 
                                 ? "bg-teal text-white shadow-xl shadow-teal/20 scale-105" 
                                 : "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
                             )}
                           >
                             <Save size={16} className="mr-2" /> Save & Update Website
                           </Button>
                        </div>
                    </div>
                  ))}
               </div>
            </Card>
          </TabsContent>
  );
}
