import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import ProgramsSection from '@/components/landing/ProgramsSection';

const defaultPrograms = [
  {
    id: 'hyperkids',
    title: 'HyperKids',
    description: 'Αθλητική ανάπτυξη για παιδιά 6-12 ετών',
    image: '/lovable-uploads/program-kids.jpg',
    color: '#00ffba'
  },
  {
    id: 'hypergym',
    title: 'HyperGym',
    description: 'Προσωπική προπόνηση για ενήλικες',
    image: '/lovable-uploads/program-gym.jpg',
    color: '#cb8954'
  },
  {
    id: 'hyperathletes',
    title: 'HyperAthletes',
    description: 'Εξειδικευμένη προπόνηση για αθλητές',
    image: '/lovable-uploads/program-athletes.jpg',
    color: '#aca097'
  }
];

const defaultTranslations = {
  language: 'el',
  servicesTitle: 'Υπηρεσίες',
  learnMore: 'Μάθετε περισσότερα'
};

export const ProgramsSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <ProgramsSection
        programs={defaultPrograms}
        translations={defaultTranslations}
      />
    </div>
  );
};

ProgramsSectionComponent.craft = {
  displayName: 'Programs Section',
  props: {},
  related: {}
};
