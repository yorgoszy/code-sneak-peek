import React from 'react';
import heroLogo from '@/assets/hyperkids-hero-logo.svg';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black pt-[84px] pb-5 flex items-center justify-center">
      <img 
        src={heroLogo} 
        alt="HyperKids" 
        className="max-w-md w-full px-4"
      />
    </section>
  );
};

export default HeroSection;
