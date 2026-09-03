import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newReportsTab = `          <TabReports
            reports={reports}
            updateReport={updateReport}
            deleteReport={deleteReport}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  // Use id="reports" to specifically target the main reports tab and avoid replacing the history modal one if it doesn't match perfectly. Wait, TabReports in the history modal might not be wrapped in `<TabsContent value="reports">`. Let's assume it finds the first one.
  if (start === -1 && lines[i].includes('<TabsContent value="reports"')) {
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
  lines.splice(start, end - start + 1, newReportsTab);
  
  if (!content.includes("import { TabReports } from './admin/TabReports';")) {
    lines.splice(60, 0, "import { TabReports } from './admin/TabReports';");
  }
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced reports tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
