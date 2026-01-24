import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import EliteTrainingSection from '@/components/landing/EliteTrainingSection';

const defaultTranslations = {
  language: 'el',
  eliteTrainingMethodology: 'Elite Training Methodology',
  eliteTrainingDesc: 'Χρησιμοποιούμε τις πιο σύγχρονες μεθόδους προπόνησης.',
  accentuatedEccentric: 'Accentuated Eccentric Training',
  accommodatingResistance: 'Accommodating Resistance',
  velocityBasedTraining: 'Velocity Based Training',
  specificEnergySystem: 'Specific Energy System Development',
  cuttingEdgeTech: 'Τεχνολογία αιχμής για μέγιστα αποτελέσματα.',
  advancedTechnology: 'Προηγμένη Τεχνολογία',
  realTimeTracking: 'Real-time tracking & analytics'
};

export const EliteTrainingSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <EliteTrainingSection translations={defaultTranslations} />
    </div>
  );
};

EliteTrainingSectionComponent.craft = {
  displayName: 'Elite Training Section',
  props: {},
  related: {}
};
