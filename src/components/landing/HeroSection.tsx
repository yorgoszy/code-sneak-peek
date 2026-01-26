import React from 'react';
import heroWins from '@/assets/hero-wins.jpg';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black pt-[84px] flex items-center justify-center">
      <img 
        src={heroWins} 
        alt="HyperKids" 
        className="w-full h-full object-cover absolute inset-0"
      />
    </section>
  );
};

export default HeroSection;
