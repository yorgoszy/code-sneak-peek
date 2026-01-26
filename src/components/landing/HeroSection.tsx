import React, { useState, useEffect } from 'react';
import heroKids from '@/assets/hero-kids.png';
import heroAthletes from '@/assets/hero-athletes.png';
import heroSync from '@/assets/hero-sync.png';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const logos = [heroKids, heroAthletes, heroSync];

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logos.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black pt-[84px] pb-5 flex items-center justify-center">
      <img 
        src={logos[currentIndex]} 
        alt="HyperKids" 
        className="max-w-md w-full px-4"
      />
    </section>
  );
};

export default HeroSection;
