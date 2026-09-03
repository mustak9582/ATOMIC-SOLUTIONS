import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newBookingsTab = `          <TabBookings
            handleTabChange={setActiveTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredBookings={filteredBookings}
            users={users}
            setSelectedBookingForDetails={setSelectedBookingForDetails}
            setBookingToAssign={setBookingToAssign}
            setPayoutAmount={setPayoutAmount}
            setIsStaffModalOpen={setIsStaffModalOpen}
            updateBooking={updateBooking}
            setBookingToDeleteId={setBookingToDeleteId}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 1315; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="bookings"')) {
    start = i;
  }
  if (start !== -1) {
    if (lines[i].includes('<TabsContent')) openTags++;
    if (lines[i].includes('</TabsContent>')) openTags--;
    
    if (openTags === 0) {
      end = i;
      break;
    }
  }
}

if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1, newBookingsTab);
  
  // get imports at line 60 and see if TabBookings is already there
  if (!content.includes("import { TabBookings } from './admin/TabBookings';")) {
    lines.splice(60, 0, "import { TabBookings } from './admin/TabBookings';");
  }

  // AdminDashboard might have had `getStatusColor` which is now moved. Wait, AdminDashboard still uses `getStatusColor` for staff assignments and history tab!
  // I shouldn't have moved it, I just copied it. It's fine since I didn't delete it from AdminDashboard.tsx.
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced bookings tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
