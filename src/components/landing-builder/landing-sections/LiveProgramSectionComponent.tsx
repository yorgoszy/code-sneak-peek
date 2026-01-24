import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import LiveProgramSection from '@/components/landing/LiveProgramSection';

const defaultTranslations = {
  language: 'el',
  liveProgram: 'Live Πρόγραμμα',
  availableSessions: 'Διαθέσιμες Θέσεις',
  closed: 'Κλειστό'
};

export const LiveProgramSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <LiveProgramSection translations={defaultTranslations} />
    </div>
  );
};

LiveProgramSectionComponent.craft = {
  displayName: 'Live Program Section',
  props: {},
  related: {}
};
