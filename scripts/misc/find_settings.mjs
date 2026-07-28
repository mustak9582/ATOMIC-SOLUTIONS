import fs from 'fs';
const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, i) => { if (line.includes('value="settings"')) console.log(i + 1 + ':', line); });
