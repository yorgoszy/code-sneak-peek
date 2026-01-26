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
      
      {/* Intense bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-[5]" />
      
      {/* Trust the Process text */}
      <div className="absolute bottom-12 left-0 right-0 z-10 text-center">
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl text-white"
          style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
        >
          trust the process
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
