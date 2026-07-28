import fs from 'fs';
import path from 'path';

const dir = 'src/components/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace maskPhone(var) with var
  content = content.replace(/maskPhone\(([^)]+)\)/g, '$1');
  
  // Replace maskEmail(var) with var
  content = content.replace(/maskEmail\(([^)]+)\)/g, '$1');

  fs.writeFileSync(filePath, content);
  console.log('Unmasked ' + file);
}
