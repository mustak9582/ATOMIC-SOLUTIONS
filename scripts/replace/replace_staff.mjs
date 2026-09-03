import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newStaffTab = `          <TabStaff
            staffFilter={staffFilter}
            setStaffFilter={setStaffFilter}
            users={users}
            bookings={bookings}
            approveStaff={approveStaff}
            rejectStaff={rejectStaff}
            viewUserHistory={viewUserHistory}
            toggleBlockUser={toggleBlockUser}
            confirmDelete={confirmDelete}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="staff"')) {
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
  lines.splice(start, end - start + 1, newStaffTab);
  
  if (!content.includes("import { TabStaff } from './admin/TabStaff';")) {
    lines.splice(60, 0, "import { TabStaff } from './admin/TabStaff';");
  }
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced staff tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
