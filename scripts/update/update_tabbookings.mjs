import fs from 'fs';

let content = fs.readFileSync('src/components/admin/TabBookings.tsx', 'utf-8');

// Need to import useNavigate
content = content.replace(
  "import { Booking, UserProfile, BookingStatus } from '../../types';",
  "import { Booking, UserProfile, BookingStatus } from '../../types';\nimport { useNavigate } from 'react-router-dom';"
);

// We need to use useNavigate inside TabBookings. But TabBookings is a functional component.
// Oh wait, TabBookings doesn't have useNavigate.
content = content.replace(
  "export function TabBookings({",
  "export function TabBookings({\n  handleTabChange,"
);
// Fix the destructuring duplicate if any. Actually it already has handleTabChange. Let's just add the hook inside.
content = content.replace(
  "}: TabBookingsProps) {",
  "}: TabBookingsProps) {\n  const navigate = useNavigate();"
);

// Find the <div className="flex justify-end gap-1"> inside TableCell
const actionButton = `
                           <motion.button 
                             whileTap={{ scale: 0.9 }}
                             className="h-8 w-8 text-navy rounded-lg flex items-center justify-center bg-teal/20"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate('/admin/invoice-generator', { state: { booking: booking } });
                             }}
                             title="Generate Invoice"
                           >
                             <FileText size={14} />
                           </motion.button>
`;

content = content.replace(
  '<div className="flex justify-end gap-1">',
  '<div className="flex justify-end gap-1">' + actionButton
);

fs.writeFileSync('src/components/admin/TabBookings.tsx', content);
console.log('Updated TabBookings.tsx');
