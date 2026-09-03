import fs from 'fs';
const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 1843; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="users"')) {
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
  fs.writeFileSync('src/components/admin/TabUsers.tsx', extracted);
  console.log(`Extracted lines ${start + 1} to ${end + 1}`);
} else {
  console.log('Could not find complete TabsContent block.');
}
