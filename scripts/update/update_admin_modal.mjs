import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Unmask Phone
content = content.replace(
  `{maskPhone(selectedBookingForDetails?.userPhone || users.find(u => u.uid === selectedBookingForDetails?.userId)?.phone || '')}`,
  `{selectedBookingForDetails?.userPhone || users.find(u => u.uid === selectedBookingForDetails?.userId)?.phone || ''}`
);

// Unmask WhatsApp
content = content.replace(
  `{maskPhone(selectedBookingForDetails?.whatsappNumber || users.find(u => u.uid === selectedBookingForDetails?.userId)?.whatsappNumber || selectedBookingForDetails?.userPhone || '') || 'N/A'}`,
  `{selectedBookingForDetails?.whatsappNumber || users.find(u => u.uid === selectedBookingForDetails?.userId)?.whatsappNumber || selectedBookingForDetails?.userPhone || 'N/A'}`
);

// Unmask Email
content = content.replace(
  `{maskEmail(selectedBookingForDetails?.userEmail || users.find(u => u.uid === selectedBookingForDetails?.userId)?.email || '')}`,
  `{selectedBookingForDetails?.userEmail || users.find(u => u.uid === selectedBookingForDetails?.userId)?.email || 'N/A'}`
);

// Add Payment Details Section
const standardServiceDetails = `            {/* Standard Service Details */}
            {selectedBookingForDetails?.type !== 'PLANNING_REQUEST' && (`;

const newPaymentSection = `            {/* Payment Information */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Preference</div>
                  <div className="font-black text-navy">{selectedBookingForDetails?.paymentPreference || 'Not Specified'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Amount Paid</div>
                  <div className="font-black text-teal">₹{selectedBookingForDetails?.advanceAmount || 0}</div>
                </div>
                {selectedBookingForDetails?.paymentProofUrl && (
                  <div className="col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="text-[8px] font-black text-blue-400 uppercase mb-1">Payment Proof</div>
                      <div className="font-bold text-navy text-xs">Screenshot Uploaded</div>
                    </div>
                    <a 
                      href={selectedBookingForDetails.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      View Proof
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Standard Service Details */}
            {selectedBookingForDetails?.type !== 'PLANNING_REQUEST' && (`;

if (content.includes(standardServiceDetails)) {
    content = content.replace(standardServiceDetails, newPaymentSection);
    fs.writeFileSync('src/components/AdminDashboard.tsx', content);
    console.log('Successfully updated AdminDashboard.tsx');
} else {
    console.log('Failed to find anchor in AdminDashboard.tsx');
}
