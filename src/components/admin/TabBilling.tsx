import React from 'react';
import { TabsContent } from '../ui/tabs';
import BillingCenter from '../BillingCenter';
import { Service } from '../../types';

export interface TabBillingProps {
  services: Service[];
  appSettings: any;
}

export function TabBilling({ services, appSettings }: TabBillingProps) {
  return (
          <TabsContent value="billing">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
               <BillingCenter services={services} whatsapp={appSettings.whatsappNumber} />
            </div>
          </TabsContent>
  );
}
