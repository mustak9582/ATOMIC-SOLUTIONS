import fs from 'fs';

const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const lines = content.split('\n');

const newUsersTab = `          <TabUsers
            users={users}
            userSearchTerm={userSearchTerm}
            setUserSearchTerm={setUserSearchTerm}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            handleTabChange={setActiveTab}
            viewUserHistory={viewUserHistory}
            approveStaff={approveStaff}
            rejectStaff={rejectStaff}
            toggleBlockUser={toggleBlockUser}
            handleEditUser={handleEditUser}
            confirmDelete={confirmDelete}
          />`;

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
  lines.splice(start, end - start + 1, newUsersTab);
  lines.splice(60, 0, "import { TabUsers } from './admin/TabUsers';");
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
  console.log('Successfully replaced users tab.');
} else {
  console.log('Could not find complete TabsContent block.');
}
