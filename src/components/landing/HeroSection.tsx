import React from 'react';
import heroWins from '@/assets/hero-wins.jpg';
import sloganTrust from '@/assets/slogan-trust.png';
import hyperkidsIcon from '@/assets/hyperkids-icon-white.png';

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
        className="w-full h-full object-cover absolute inset-0 opacity-50"
      />
      
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-[5]" />
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[5]" />
      
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img 
          src={hyperkidsIcon} 
          alt="HyperKids Icon" 
          className="h-24 md:h-40 w-auto"
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
  );
};

export default HeroSection;
