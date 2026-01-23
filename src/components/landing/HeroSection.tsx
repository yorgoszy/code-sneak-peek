import React from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import healthyLogo from '@/assets/healthy-logo.png';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative min-h-screen">
      {/* Background image - full screen */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Logo overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-8 md:pt-16">
        <img 
          src={healthyLogo} 
          alt="Healthy Kids" 
          className="w-64 md:w-80 lg:w-96 h-auto"
        />
      </div>
    </section>
  );
};

export default HeroSection;
