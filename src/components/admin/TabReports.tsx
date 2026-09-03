import React from 'react';
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
          <TabsContent value="reports" id="reports" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-red-50/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">Customer Complaints</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solutions Center & Communication</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {reports.filter(r => r.status === 'Pending').length} Pending
                  </Badge>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 gap-6">
                  {reports.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <CheckCircle size={40} />
                      </div>
                      <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No customer complaints reported yet</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 hover:border-red-100 transition-all group">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <Badge className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                                report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {report.status}
                              </Badge>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{report.id.slice(-6)}</span>
                              <span className="text-[10px] font-bold text-gray-400">• {safeDateFormatter(report.createdAt)}</span>
                            </div>

                            <h3 className="text-xl font-black text-navy uppercase tracking-tight mb-3">{report.title}</h3>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 bg-white p-4 rounded-2xl border border-gray-100">{report.description}</p>
                            
                            <div className="flex items-center gap-6 text-[10px] uppercase font-black tracking-widest text-navy mb-6">
                              <div className="flex items-center gap-2">
                                <UserCircle size={16} className="text-gray-300" /> {report.userName}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-300" /> {report.userPhone}
                              </div>
                            </div>

                            {report.attachments && report.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-4 mb-6">
                                {report.attachments.map((file: any, i: number) => (
                                  <div key={i} className="relative group/media cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                                      {file.type === 'image' ? (
                                        <img src={file.url} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover/media:scale-110" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-navy text-teal"><VideoIcon size={32} /></div>
                                      )}
                                    </div>
                                    <div onClick={() => window.open(file.url, '_blank')} className="absolute inset-0 bg-navy/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                      <Search size={20} className="text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="lg:w-80 space-y-4">
                            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Update Status</label>
                              <div className="flex flex-wrap gap-2">
                                {['Pending', 'In Progress', 'Resolved'].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateReport(report.id, { status: s })}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                      report.status === s ? 'bg-navy text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                              
                              <div className="pt-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1 mb-2">Admin Note (Visible to Customer)</label>
                                <textarea 
                                  value={report.adminNote || ''}
                                  onChange={(e) => updateReport(report.id, { adminNote: e.target.value })}
                                  placeholder="Write a response or update here..."
                                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium text-navy outline-none focus:border-navy transition-all resize-none"
                                  rows={3}
                                />
                              </div>
                              <Button 
                                onClick={() => deleteReport(report.id)}
                                variant="ghost"
                                className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest"
                              >
                                <Trash2 size={12} className="mr-2" /> Delete Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
  );
}
