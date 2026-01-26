import React, { useEffect, useState } from 'react';
import heroSlide1 from '@/assets/hero-slide-1.svg';
import heroSlide2 from '@/assets/hero-slide-2.svg';
import heroSlide3 from '@/assets/hero-slide-3.svg';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const slides = [heroSlide1, heroSlide2, heroSlide3];

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black pt-16">
      {/* Desktop: Use background-image */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${slides[currentSlide]})` }}
      />
      {/* Mobile: Scale to fill screen properly */}
      <div className="md:hidden absolute inset-0 flex items-center justify-center overflow-hidden">
        <img 
          src={slides[currentSlide]} 
          alt="Hero" 
          className="min-w-full min-h-full object-cover"
        />
      </div>
    </section>
  );
};

export default HeroSection;
