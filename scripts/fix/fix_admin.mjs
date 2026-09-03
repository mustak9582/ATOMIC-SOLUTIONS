import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// 1. Add previewImage state
if (!content.includes('const [previewImage, setPreviewImage]')) {
    content = content.replace(
        `const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);`,
        `const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);\n  const [previewImage, setPreviewImage] = useState<string | null>(null);`
    );
}

// 2. Fix the "View Proof" button
const anchorStr = `<a 
                      href={selectedBookingForDetails.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      View Proof
                    </a>`;
const buttonStr = `<button 
                      onClick={(e) => { e.preventDefault(); setPreviewImage(selectedBookingForDetails.paymentProofUrl); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      View Proof
                    </button>`;
if (content.includes(anchorStr)) {
    content = content.replace(anchorStr, buttonStr);
}

// 3. Add the Dialog for previewImage
const previewDialogStr = `      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl border-none shadow-none bg-transparent flex items-center justify-center">
          <img src={previewImage || ''} alt="Payment Proof" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
        </DialogContent>
      </Dialog>
    </div>
  );
}`;
if (!content.includes('open={!!previewImage}')) {
    content = content.replace(`    </div>\n  );\n}`, previewDialogStr);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Fixed AdminDashboard Payment Proof Preview");
