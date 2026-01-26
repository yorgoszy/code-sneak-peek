import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import heroWins from '@/assets/hero-wins.jpg';
import sloganTrust from '@/assets/slogan-trust.png';
import hyperkidsIcon from '@/assets/hyperkids-icon-white.png';

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
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <img 
            src={hyperkidsIcon} 
            alt="HyperKids Icon" 
            className="h-32 md:h-48 w-auto"
          />
        </div>
        
        {/* Slogan bottom-right */}
        <div className="absolute bottom-8 right-8 z-10">
          <img 
            src={sloganTrust} 
            alt="Trust the Process" 
            className="h-36 md:h-48 w-auto"
          />
        </div>
      </section>
    </div>
  );
};

HeroSectionComponent.craft = {
  displayName: 'Hero Section',
  props: {},
  related: {}
};
