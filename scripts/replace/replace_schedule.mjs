import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newScheduleTab = `          <TabSchedule
            handleTabChange={setActiveTab}
            setIsManualBookingOpen={setIsManualBookingOpen}
            bookings={bookings}
            todayStr={todayStr}
            setSelectedBookingForDetails={setSelectedBookingForDetails}
            updateBooking={updateBooking}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="schedule"')) {
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
  lines.splice(start, end - start + 1, newScheduleTab);
  
  if (!content.includes("import { TabSchedule } from './admin/TabSchedule';")) {
    lines.splice(60, 0, "import { TabSchedule } from './admin/TabSchedule';");
  }
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced schedule tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
