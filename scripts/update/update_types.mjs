import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf-8');

content = content.replace(
  "status: 'Draft' | 'Sent' | 'Paid';",
  "status: 'Draft' | 'Sent' | 'Paid' | 'Verification Pending';\n  paymentProofUrl?: string;"
);

fs.writeFileSync('src/types.ts', content);
console.log('Updated types.ts');
