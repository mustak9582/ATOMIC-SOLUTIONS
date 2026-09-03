import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import { motion } from 'motion/react';
import { Trash2, Plus, ImageIcon, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
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
          <TabsContent value="gallery">
            <Card className="rounded-[40px] border-none shadow-xl shadow-navy/5 p-8 bg-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Media Showcase Manager</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Categorized Portfolio Management</p>
                </div>
                
                {/* Global Upload Status */}
                {uploadProgress.active && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 max-w-xs bg-blue-50 border border-blue-100 rounded-3xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] font-black text-blue-600 uppercase mb-1">
                        <span className="truncate max-w-[100px]">{uploadProgress.percent < 100 ? `Posting: ${uploadProgress.fileName}` : 'Processing...'}</span>
                        <span>{Math.round(uploadProgress.percent)}%</span>
                      </div>
                      <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        cancelUploadRef.current = true;
                        setUploadProgress({ active: false, percent: 0, fileName: '' });
                        toast.error("Upload Cancelled");
                      }}
                      className="p-2 hover:bg-blue-100 rounded-full text-blue-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-3">
                   <Button 
                    variant="outline" 
                    className="rounded-2xl border-gray-200 text-navy font-black text-[10px] uppercase tracking-widest h-14 px-8 hover:bg-gray-50"
                    onClick={() => {
                      const url = prompt('Enter Video ID (YouTube):');
                      const title = prompt('Video Title:', 'Work Showcase');
                      if (url) {
                         const videos = appSettings.videos || [];
                         toast.promise(
                           updateSettings({ videos: [...videos, { id: Date.now().toString(), url, title }] }),
                           {
                             loading: 'Adding video...',
                             success: 'Video Posted Successfully!',
                             error: 'Failed to add video'
                           }
                         );
                      }
                    }}
                  >
                    <Plus size={16} className="mr-2 text-rose-500" /> Add YouTube
                  </Button>
                  <Button 
                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest h-14 px-8 shadow-xl shadow-blue-200"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          cancelUploadRef.current = false;
                          const gallery = appSettings.gallery || [];
                          const totalFiles = files.length;
                          
                          setUploadProgress({ active: true, percent: 0, fileName: files[0].name });
                          
                          try {
                            const newImages: string[] = [];
                            for (let i = 0; i < totalFiles; i++) {
                              if (cancelUploadRef.current) break;
                              
                              const file = files[i];
                              setUploadProgress({ active: true, percent: (i / totalFiles) * 100, fileName: file.name });
                              
                              // Compress before adding
                              const compressed = await compressImage(file);
                              newImages.push(compressed);
                              
                              // Update individual progress within the file loop if needed, but per-file is better
                              setUploadProgress(prev => ({ ...prev, percent: ((i + 1) / totalFiles) * 100 }));
                            }

                            if (!cancelUploadRef.current) {
                               await updateSettings({ gallery: [...gallery, ...newImages] });
                               toast.success(`${totalFiles} Photos posted successfully!`);
                            }
                          } catch (err) {
                            toast.error('Failed to post photos');
                          } finally {
                            setUploadProgress({ active: false, percent: 0, fileName: '' });
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <ImageIcon size={16} className="mr-2" /> Upload Photos
                  </Button>
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <h4 className="text-sm font-black text-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ImageIcon size={16} className="text-blue-600" /> Photo Library
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(appSettings.gallery || []).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100">
                        <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                               const newGallery = (appSettings.gallery || []).filter((_, i) => i !== idx);
                               updateSettings({ gallery: newGallery });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!appSettings.gallery || appSettings.gallery.length === 0) && (
                      <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Photos Uploaded Yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                   <h4 className="text-sm font-black text-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageCircle size={16} className="text-red-600" /> Video Showcase
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(appSettings.videos || []).map((video, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-3xl p-4 border border-gray-100 relative group">
                        <div className="aspect-video bg-navy rounded-2xl overflow-hidden mb-3">
                           <iframe 
                            src={`https://www.youtube.com/embed/${video.url}`} 
                            className="w-full h-full" 
                            allowFullScreen 
                           />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-navy uppercase tracking-tight">{video.title}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => {
                               const newVideos = (appSettings.videos || []).filter((_, i) => i !== idx);
                               updateSettings({ videos: newVideos });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
  );
}
