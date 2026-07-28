import fs from 'fs';

let content = fs.readFileSync('src/components/BillingCenter.tsx', 'utf-8');

// 1. Import useLocation
content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate, useLocation } from 'react-router-dom';"
);
content = content.replace(
  "import { Service, SubCategory, UserProfile, BillingItem, Invoice, AppSettings } from '../types';",
  "import { Service, SubCategory, UserProfile, BillingItem, Invoice, AppSettings, Booking } from '../types';"
);

// 2. Add useLocation to the component
content = content.replace(
  "const navigate = useNavigate();",
  `const navigate = useNavigate();
  const location = useLocation();
  const prefillBooking = location.state?.booking as Booking | undefined;`
);

// 3. Add useEffect to prefill data
const prefillEffect = `
  useEffect(() => {
    if (prefillBooking) {
      setCustomerName(prefillBooking.userName || '');
      setCustomerPhone(prefillBooking.whatsappNumber || prefillBooking.userPhone || '');
      setCustomerAddress(prefillBooking.userAddress || '');
      if (prefillBooking.userId) setSelectedUserId(prefillBooking.userId);
      
      setItems([
        {
          id: Date.now().toString() + '-labor',
          name: prefillBooking.serviceName + ' (Labor)',
          description: \`Tier: \${prefillBooking.tier}\\nSub-category: \${prefillBooking.subCategory || 'N/A'}\`,
          rate: prefillBooking.price || 0,
          quantity: 1,
          unit: 'Job',
          type: 'Labor'
        },
        {
          id: Date.now().toString() + '-material',
          name: prefillBooking.serviceName + ' (Material)',
          description: \`Materials required for the job\`,
          rate: 0,
          quantity: 1,
          unit: 'Job',
          type: 'Material'
        }
      ]);
      
      setIsInvoice(true);
      setShowEditor(true);
      
      // Clear router state to prevent infinite loop on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [prefillBooking]);
`;

content = content.replace(
  "useEffect(() => {",
  prefillEffect + "\n  useEffect(() => {"
);

fs.writeFileSync('src/components/BillingCenter.tsx', content);
console.log('Updated BillingCenter.tsx');
