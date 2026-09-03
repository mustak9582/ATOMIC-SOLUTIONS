import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newStatsTab = `          <TabStats
            users={users}
            bookings={bookings}
            allInvoices={allInvoices}
            setUserRoleFilter={setUserRoleFilter}
            setStatusFilter={setStatusFilter}
            handleTabChange={setActiveTab}
            setSelectedUserForHistory={setSelectedUserForHistory}
            setIsHistoryModalOpen={setIsHistoryModalOpen}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="stats"')) {
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
  lines.splice(start, end - start + 1, newStatsTab);
  
  if (!content.includes("import { TabStats } from './admin/TabStats';")) {
    lines.splice(60, 0, "import { TabStats } from './admin/TabStats';");
  }

  // Remove AdminTile and StatCard from AdminDashboard.tsx to avoid duplication, they are at the end of the file.
  const joined = lines.join('\n');
  const cleaned = joined.replace(/function AdminTile[\s\S]*?\}\n\nfunction StatCard[\s\S]*?\}\n/, '');
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', cleaned);
  console.log('Successfully replaced stats tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
