const fs = require('fs');
const file = 'src/components/ServiceDetailPage.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Keep up to line 292 (index 291)
lines = lines.slice(0, 292);

const addedLines = `                      )}
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-extrabold text-navy">Rate list and tiers</h3>
                            <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-3">Live Pricing</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {service.subCategories?.map((sub, idx) => (
                                <div 
                                    id={\`sub-\${sub.id}\`}
                                    key={idx} 
                                    className="group bg-slate-50/80 hover:bg-white p-6 rounded-lg border border-slate-100 hover:border-teal/20 transition-all hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.35)]"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-lg font-extrabold text-navy truncate">{sub.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Professional service</p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                    <IndianRupee size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-0.5 whitespace-nowrap">Labour Only</div>
                                                    <div className="text-lg font-extrabold text-navy numeric whitespace-nowrap">Rs. {sub.labourMin || sub.minPrice}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[9px] font-black uppercase text-orange-500 tracking-widest mb-0.5 whitespace-nowrap">With Material</div>
                                                    <div className="text-lg font-extrabold text-navy numeric whitespace-nowrap">Rs. {sub.materialMin || sub.minPrice}</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleBook(sub.name, 'LABOUR', sub.labourMin || sub.minPrice)}
                                                    className="flex-1 sm:flex-none h-11 px-4 rounded-lg bg-white border border-slate-100 text-navy hover:bg-slate-50 transition-all font-bold text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-[0.98]"
                                                >
                                                    Labour
                                                </button>
                                                <button 
                                                    onClick={() => handleBook(sub.name, 'MATERIAL', sub.materialMin || sub.minPrice)}
                                                    className="flex-1 sm:flex-none h-11 px-6 rounded-lg bg-teal hover:bg-[#0d9488] text-white flex items-center justify-center transition-all font-bold text-[9px] uppercase tracking-widest whitespace-nowrap shadow-[0_16px_30px_-18px_rgba(15,118,110,0.8)] active:scale-[0.98]"
                                                >
                                                    Material
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* YouTube Video Section */}
              {service.youtubeId && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-extrabold text-navy flex items-center gap-3">
                      <PlayCircle className="text-rose-500" /> Watch and learn
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-[0_26px_55px_-24px_rgba(15,23,42,0.24)] border border-white">
                    <iframe 
                      className="w-full h-full"
                      src={\`https://www.youtube.com/embed/\${service.youtubeId}\`}
                      title={\`\${service.name} Service Video\`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Booking Sidebar */}
            <div className="lg:col-span-12 xl:col-span-4">
              <div className="sticky top-28 space-y-8">
                <Card className="rounded-lg border-none shadow-[0_26px_55px_-24px_rgba(15,23,42,0.42)] p-8 md:p-10 bg-navy text-white overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <div className="inline-flex px-3 py-1 bg-teal/20 rounded-full text-teal-100 text-[10px] font-bold uppercase tracking-widest border border-teal/30">
                        Top Rated Service
                      </div>
                      <h3 className="text-3xl font-extrabold leading-tight">
                        Instant booking available
                      </h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Book a professional technician now and get service within 2 hours.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Verified Experts</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">7 Days Warranty</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 size={18} className="text-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Digital Invoice</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setIsCategoriesOpen(true);
                      }}
                      className="w-full h-16 rounded-lg bg-teal hover:bg-[#0d9488] text-white font-bold text-sm shadow-[0_18px_34px_-20px_rgba(15,118,110,0.9)] transition-all font-sans"
                    >
                      Book Service Now
                    </Button>

                    <div className="pt-4 text-center">
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Atomic Solutions licensed operator</p>
                    </div>
                  </div>
                </Card>

                <div className="premium-card p-8 flex flex-col items-center text-center gap-4">
                    <div className="icon-tile w-12 h-12">
                        <Phone size={20} />
                    </div>
                    <div>
                        <h4 className="text-navy font-extrabold">Need consultation?</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Talk to our service expert</p>
                    </div>
                    <button 
                        onClick={handleConsultation}
                        className="text-navy font-extrabold text-xl hover:text-teal transition-colors numeric"
                    >
                        +91 95822 68658
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modals */}
      <CategoriesModal 
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        service={service}
        whatsapp="+919582268658"
        onBook={handleBook}
      />

      {bookingData && (
        <DirectBookingModal 
          isOpen={isDirectBookingOpen}
          onClose={() => {
            setIsDirectBookingOpen(false);
            setBookingData(null);
          }}
          serviceName={service.name}
          subCategoryName={bookingData.subName}
          bookingType={bookingData.type}
          price={bookingData.price}
          whatsapp="+919582268658"
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync(file, lines.join('\\n') + '\\n' + addedLines);
console.log('Done!');
