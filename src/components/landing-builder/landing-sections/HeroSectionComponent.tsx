import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import heroWins from '@/assets/hero-wins.jpg';

export const HeroSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="relative min-h-[500px] overflow-hidden bg-black flex items-center justify-center">
        <img 
          src={heroWins} 
          alt="HyperKids" 
          className="w-full h-full object-cover absolute inset-0"
        />
      </section>
    </div>
  );
};

HeroSectionComponent.craft = {
  displayName: 'Hero Section',
  props: {},
  related: {}
};
