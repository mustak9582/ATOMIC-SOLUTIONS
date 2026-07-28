import fs from 'fs';
const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');
let activeTab = null;
let stack = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<TabsContent')) {
    const match = line.match(/value="([^"]+)"/);
    if (match) {
      console.log(`[TAB START] ${match[1]} at line ${i + 1}`);
    }
  }
}
