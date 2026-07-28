import fs from 'fs';

let content = fs.readFileSync('src/components/Pricing.tsx', 'utf-8');

const brokenAnchor = `              onBook={(subName, type, labourPrice, materialPrice) => setBookingDetails({ 
                serviceName: service.name, 
                subName, 
                type,
                labourPrice,
        onClose={() => setBookingDetails(null)}`;

const correctContent = `              onBook={(subName, type, labourPrice, materialPrice) => setBookingDetails({ 
                serviceName: service.name, 
                subName, 
                type,
                labourPrice,
                materialPrice,
                staffCategory: service.staffCategory
              })}
              onNavigate={() => navigate(\`/service/\${service.id.toLowerCase().replace(/\\s+/g, '-')}\`)}
            />
          ))}
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden bg-black shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-xl"
            >
              <X size={24} />
            </button>
            <iframe
              className="w-full h-full"
              src={\`https://www.youtube.com/embed/\${activeVideo}?autoplay=1\`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-view"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <CategoriesModal 
        isOpen={selectedServiceForModal !== null} 
        onClose={() => setSelectedServiceForModal(null)}
        service={selectedServiceForModal}
        whatsapp={whatsapp}
        onBook={(subName, type, labourPrice, materialPrice) => {
          setSelectedServiceForModal(null);
          setBookingDetails({ 
            serviceName: selectedServiceForModal?.name || '', 
            subName, 
            type,
            labourPrice,
            materialPrice,
            staffCategory: selectedServiceForModal?.staffCategory
          });
        }}
      />

      <DirectBookingModal 
        isOpen={bookingDetails !== null}
        onClose={() => setBookingDetails(null)}`;

if (content.includes(brokenAnchor)) {
    content = content.replace(brokenAnchor, correctContent);
    fs.writeFileSync('src/components/Pricing.tsx', content);
    console.log('Successfully repaired Pricing.tsx');
} else {
    console.log('Could not find broken anchor in Pricing.tsx');
}
