import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newPricingTab = `          <TabPricing
            isAutoSave={isAutoSave}
            setIsAutoSave={setIsAutoSave}
            setActiveTab={setActiveTab}
            categories={categories}
            setEditingService={setEditingService}
            setIsServiceModalOpen={setIsServiceModalOpen}
            services={services}
            moveService={moveService}
            updateService={updateService}
            setServiceToDeleteId={setServiceToDeleteId}
            dirtyServices={dirtyServices}
            setDirtyServices={setDirtyServices}
            handleLocalServiceUpdate={handleLocalServiceUpdate}
            handleFeaturedImageUpload={handleFeaturedImageUpload}
          />`;

let start = -1;
let end = -1;
let openTags = 0;

for (let i = 0; i < lines.length; i++) {
  if (start === -1 && lines[i].includes('<TabsContent value="pricing"')) {
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
  lines.splice(start, end - start + 1, newPricingTab);
  
  if (!content.includes("import { TabPricing } from './admin/TabPricing';")) {
    lines.splice(60, 0, "import { TabPricing } from './admin/TabPricing';");
  }
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced pricing tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
