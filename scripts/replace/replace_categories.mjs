import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newCategoriesTab = `          <TabCategories
            categories={categories}
            openCategoryModal={openCategoryModal}
            setCategoryToDeleteId={setCategoryToDeleteId}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="categories"')) {
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
  lines.splice(start, end - start + 1, newCategoriesTab);
  
  if (!content.includes("import { TabCategories } from './admin/TabCategories';")) {
    lines.splice(60, 0, "import { TabCategories } from './admin/TabCategories';");
  }
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced categories tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
