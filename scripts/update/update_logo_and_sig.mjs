import fs from 'fs';

// 1. Update BillingCenter.tsx
let bc = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

// Replace the logo
bc = bc.replace(
  `const logoUrl = settings?.logoUrl || "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";`,
  `const logoUrl = settings?.logoUrl || window.location.origin + '/logo.png';`
);

// Replace Customer Signature with just Name
bc = bc.replace(
  `doc.text('CUSTOMER SIGNATURE............................................................', pageWidth - 15, footerY + 32, { align: 'right' });`,
  `doc.text(\`CUSTOMER: \${customerName?.toUpperCase() || ''}\`, 15, footerY + 32);`
);

fs.writeFileSync('src/components/BillingCenter.tsx', bc);

// 2. Update UserDashboard.tsx
let ud = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// Replace the logo
ud = ud.replace(
  `const logoUrl = "https://i.postimg.cc/c1kyVJkv/ATOMIC-LOGO.png";`,
  `const logoUrl = window.location.origin + '/logo.png';`
);

// In UserDashboard, sometimes the logoUrl wasn't hardcoded but it might be there. Let's do a fallback:
if (!ud.includes('window.location.origin + \'/logo.png\'')) {
  ud = ud.replace(
    /doc\.addImage\(logoUrl, 'PNG'/g,
    `doc.addImage(window.location.origin + '/logo.png', 'PNG'`
  );
}

// Replace Customer Signature with just Name
ud = ud.replace(
  `doc.text('CUSTOMER SIGNATURE...........................................................', pageWidth - 20, footerY + 35, { align: 'right' });`,
  `doc.text(\`CUSTOMER: \${invoice?.customerName?.toUpperCase() || ''}\`, 15, footerY + 35);`
);

fs.writeFileSync('src/components/UserDashboard.tsx', ud);

console.log('Updated components');
