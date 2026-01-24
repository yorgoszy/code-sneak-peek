import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import HeroSection from '@/components/landing/HeroSection';

const defaultTranslations = {
  language: 'el',
  heroTitle: 'HyperKids',
  heroSubtitle: 'Athletic Performance Center',
  getStarted: 'Ξεκινήστε τώρα'
};

export const HeroSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <HeroSection
        translations={defaultTranslations}
        onGetStarted={() => {}}
      />
    </div>
  );
};

HeroSectionComponent.craft = {
  displayName: 'Hero Section',
  props: {},
  related: {}
};
