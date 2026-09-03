import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf-8');

// Revert UserProfile change
content = content.replace("email?: string;\n  youtubeLink?: string;\n  isAdmin?: boolean;", "email?: string;\n  isAdmin?: boolean;");

// Add to AppSettings
content = content.replace(
  "export interface AppSettings {\n  whatsapp: string;\n  email?: string;\n}",
  "export interface AppSettings {\n  whatsapp: string;\n  email?: string;\n  youtubeLink?: string;\n}"
);

fs.writeFileSync('src/types.ts', content);
console.log('Fixed types.ts');
