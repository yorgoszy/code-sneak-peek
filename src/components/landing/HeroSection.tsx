import React from 'react';
import heroRing from '@/assets/hero-ring.png';
import heroIcon from '@/assets/hero-icon.png';

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
        className="w-full h-full object-cover absolute inset-0 opacity-[0.07]"
      />
      
      {/* Intense bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-[5]" />
      
      {/* Center icon */}
      <div className="relative z-10 flex items-center justify-center">
        <img 
          src={heroIcon} 
          alt="HyperKids Icon" 
          className="w-32 md:w-44 lg:w-56 h-auto"
        />
      </div>
      
      {/* Trust the Process text */}
      <div className="absolute bottom-8 right-8 z-10">
        <h1 
          className="text-white"
          style={{ fontFamily: "'UnifrakturMaguntia', cursive", fontSize: '34px' }}
        >
          trust the process
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
