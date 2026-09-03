import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Import TabMessages
if (!content.includes('import { TabMessages } from')) {
    content = content.replace(
        `import { TabUsers } from './admin/TabUsers';`,
        `import { TabUsers } from './admin/TabUsers';\nimport { TabMessages } from './admin/TabMessages';`
    );
}

// Add the 'messages' to activeTab state type if it's there, but here it's likely a string.
// Let's look for the Sidebar items
const sidebarTarget = `{ id: 'pricing', label: 'Services & Pricing', icon: <DollarSign size={20} /> },`;
const sidebarReplacement = `{ id: 'pricing', label: 'Services & Pricing', icon: <DollarSign size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageCircle size={20} /> },`;

if (content.includes(sidebarTarget) && !content.includes(`id: 'messages'`)) {
    content = content.replace(sidebarTarget, sidebarReplacement);
}

// Render TabMessages
const renderTarget = `{activeTab === 'users' && <TabUsers users={users} setUsers={setUsers} updateRole={updateRole} />}`;
const renderReplacement = `{activeTab === 'users' && <TabUsers users={users} setUsers={setUsers} updateRole={updateRole} />}
        {activeTab === 'messages' && <TabMessages />}`;

if (content.includes(renderTarget) && !content.includes(`<TabMessages />`)) {
    content = content.replace(renderTarget, renderReplacement);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Successfully updated AdminDashboard with TabMessages');
