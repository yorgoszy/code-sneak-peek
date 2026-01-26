import React from 'react';
import heroWins from '@/assets/hero-wins.jpg';
import sloganTrust from '@/assets/slogan-trust.png';

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
      
      {/* Centered content */}
      <div className="relative z-10 text-left px-8">
        <p className="text-white text-2xl md:text-4xl font-roobert tracking-wide mb-6">
          Το ταξίδι του πρωταθλητή ξεκινάει εδώ
        </p>
        <button 
          onClick={onGetStarted}
          className="bg-[#00ffba] text-black px-8 py-3 font-semibold hover:bg-[#00ffba]/90 transition-colors rounded-none"
        >
          Ξεκίνα τώρα
        </button>
      </div>
      
      {/* Slogan bottom-right */}
      <div className="absolute bottom-8 right-8">
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
