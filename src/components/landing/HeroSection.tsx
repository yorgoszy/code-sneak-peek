import React from 'react';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Top logo - IIIIIII */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-1 h-4 bg-gray-600" />
          ))}
        </div>
      </div>
      
      {/* Center content - HYPER vertical text */}
      <div className="relative z-10 flex items-center justify-center">
        <h1 
          className="text-white font-bold tracking-tighter"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: 'clamp(5rem, 15vw, 12rem)',
            letterSpacing: '-0.02em',
            fontFamily: 'Robert Pro, sans-serif',
            transform: 'rotate(180deg)',
          }}
        >
          HYPER
        </h1>
      </div>

      {/* Bottom logo - IIIIIII */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-1 h-4 bg-gray-600" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
