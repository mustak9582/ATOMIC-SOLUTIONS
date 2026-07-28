import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newSettingsTab = `          <TabsContent value="settings">
            <TabSettings
              user={user}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
              clearAllNotifs={clearAllNotifs}
              updateSettings={updateSettings}
            />
          </TabsContent>`;

// We know from previous run it's from 3109 to 3320 in zero-indexed array
lines.splice(3109, 3321 - 3110 + 1, newSettingsTab);

// Add import at the top
lines.splice(60, 0, "import { TabSettings } from './admin/TabSettings';");

fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
console.log('Successfully replaced settings tab.');
