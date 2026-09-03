import fs from 'fs';

const tabName = process.argv[2];
if (!tabName) {
  console.error("Please provide a tab name. Example: node extract_tab.mjs pricing");
  process.exit(1);
}

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  // Add a space to prevent matching substring like 'pricing2' if it exists, though value="pricing" is exact enough.
  if (start === -1 && lines[i].includes(`<TabsContent value="${tabName}"`)) {
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
  const extracted = lines.slice(start, end + 1).join('\n');
  const capTab = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  fs.writeFileSync(`src/components/admin/Tab${capTab}.tsx`, extracted);
  console.log(`Extracted ${tabName} lines ${start + 1} to ${end + 1}`);
} else {
  console.log(`Could not find complete TabsContent block for ${tabName}.`);
}
