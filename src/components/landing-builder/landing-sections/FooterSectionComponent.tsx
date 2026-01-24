import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import Footer from '@/components/landing/Footer';

const defaultTranslations = {
  language: 'el',
  contactUs: 'Επικοινωνία',
  address: 'Διεύθυνση',
  phone: 'Τηλέφωνο',
  email: 'Email',
  mondayFriday: 'Δευτέρα - Παρασκευή: 08:00 - 21:00',
  saturday: 'Σάββατο: 09:00 - 15:00',
  sunday: 'Κυριακή: Κλειστά',
  copyright: '© 2024 HyperKids. Όλα τα δικαιώματα κατοχυρωμένα.'
};

export const FooterSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <Footer translations={defaultTranslations} />
    </div>
  );
};

FooterSectionComponent.craft = {
  displayName: 'Footer',
  props: {},
  related: {}
};
