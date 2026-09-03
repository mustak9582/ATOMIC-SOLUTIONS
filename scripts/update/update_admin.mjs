import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const generateBtn = `
                <Button 
                  onClick={() => {
                    setSelectedBookingForDetails(null);
                    navigate('/admin/invoice-generator', { state: { booking: selectedBookingForDetails } });
                  }}
                  className="w-full bg-navy text-white hover:bg-navy/90 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
                >
                  <FileText size={16} className="text-teal" /> Generate Invoice
                </Button>
`;

// Insert the generate button inside the booking details modal, perhaps near the WhatsApp button
if (content.includes('Contact Customer (WhatsApp)')) {
  content = content.replace(
    /<\/Button>\s*<\/div>\s*<\/div>\s*<\/motion\.div>/,
    `</Button>${generateBtn}</div></div></motion.div>`
  );
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Updated AdminDashboard.tsx');
