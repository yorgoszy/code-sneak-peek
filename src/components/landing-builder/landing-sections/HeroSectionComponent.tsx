import React, { useState, useEffect } from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import heroKids from '@/assets/hero-kids.png';
import heroAthletes from '@/assets/hero-athletes.png';
import heroSync from '@/assets/hero-sync.png';
import sloganTrust from '@/assets/slogan-trust.png';
import sloganLimits from '@/assets/slogan-limits.png';
import sloganExtraMile from '@/assets/slogan-extra-mile.png';

const logos = [heroKids, heroAthletes, heroSync];
const slogans = [sloganTrust, sloganLimits, sloganExtraMile];
const taglines = [
  "Το ταξίδι του πρωταθλητή ξεκινάει εδώ",
  "Χτίζουμε πρωταθλητές με αξίες",
  "Σύνδεσε την ομάδα σου με το sync"
];

export const HeroSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logos.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="relative min-h-[500px] overflow-hidden bg-black pt-[84px] pb-5 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img 
            src={logos[currentIndex]} 
            alt="HyperKids" 
            className="max-w-md w-full px-4"
          />
          <p className="text-white text-xl md:text-2xl font-roobert tracking-wide">
            {taglines[currentIndex]}
          </p>
        </div>
        
        {/* Slogan bottom-right */}
        <div className="absolute bottom-8 right-8">
          <img 
            src={slogans[currentIndex]} 
            alt="Slogan" 
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
