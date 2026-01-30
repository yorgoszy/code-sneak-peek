
import React from 'react';
import { Button } from "@/components/ui/button";
import heroRing from "@/assets/hero-ring.png";

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const handleContactClick = () => {
    const footerSection = document.getElementById('footer');
    if (footerSection) {
      footerSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section id="home" className="relative pt-16 min-h-screen flex items-center">
      <style>{`
        .get-started-btn {
          background-color: white !important;
          color: black !important;
        }
        .get-started-btn:hover {
          background-color: #e5e5e5 !important;
        }
        .contact-btn:hover {
          border-color: #aca097 !important;
          color: #aca097 !important;
          background-color: transparent !important;
        }
      `}</style>
      
      {/* Black background */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Boxing ring image with 7% opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroRing})`,
          opacity: 0.07
        }}
      ></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 text-white">
            {translations.heroTitle}<br />
            <span className="text-white">{translations.heroSubtitle}</span>
          </h1>
          <div className="flex flex-wrap gap-4">
            <Button 
              className="get-started-btn rounded-none transition-colors duration-200" 
              onClick={onGetStarted}
            >
              {translations.getStarted}
            </Button>
            <Button 
              variant="outline" 
              className="contact-btn rounded-none bg-transparent text-white border-white"
              onClick={handleContactClick}
            >
              {translations.contactBtn}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
