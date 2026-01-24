import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import ResultsSection from '@/components/landing/ResultsSection';

const defaultTranslations = {
  language: 'el',
  resultsTitle: 'Αποτελέσματα',
  ourResults: 'Τα αποτελέσματά μας'
};

export const ResultsSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <ResultsSection translations={defaultTranslations} />
    </div>
  );
};

ResultsSectionComponent.craft = {
  displayName: 'Results Section',
  props: {},
  related: {}
};
