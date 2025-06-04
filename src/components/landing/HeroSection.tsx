
import React from 'react';
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  return (
    <section id="home" className="relative pt-16 min-h-screen flex items-center">
      <style>{`
        .get-started-btn {
          background-color: #00ffba !important;
          color: black !important;
        }
        .get-started-btn:hover {
          background-color: #00cc99 !important;
        }
      `}</style>
      
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/7d78ce26-3ce9-488f-9948-1cb90eac5b9e.png')`
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {translations.heroTitle}<br />
            <span style={{ color: '#00ffba' }}>{translations.heroSubtitle}</span>
          </h1>
          <div className="flex space-x-4">
            <Button 
              className="get-started-btn rounded-none transition-colors duration-200" 
              onClick={onGetStarted}
            >
              {translations.getStarted}
            </Button>
            <Button 
              variant="outline" 
              className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
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
