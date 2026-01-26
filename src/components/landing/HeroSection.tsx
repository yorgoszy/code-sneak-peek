import React from 'react';
import heroRing from '@/assets/hero-ring.png';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black pt-[84px] flex items-center justify-center">
      {/* Background image with 15% opacity */}
      <img 
        src={heroRing} 
        alt="Boxing Ring" 
        className="w-full h-full object-cover absolute inset-0 opacity-[0.15]"
      />
      
      {/* Content will be added here */}
    </section>
  );
};

export default HeroSection;
