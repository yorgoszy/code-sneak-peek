
import React from 'react';
import { Button } from "@/components/ui/button";

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
          background-color: #cf8d54 !important;
          color: black !important;
        }
        .get-started-btn:hover {
          background-color: #b5794a !important;
        }
        .contact-btn:hover {
          border-color: #cf8d54 !important;
          color: #cf8d54 !important;
          background-color: transparent !important;
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6" style={{ color: '#ACA097' }}>
            {translations.heroTitle}<br />
            <span style={{ color: '#cf8d54' }}>{translations.heroSubtitle}</span>
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
              className="contact-btn rounded-none bg-transparent"
              style={{ color: '#ACA097', borderColor: '#ACA097' }}
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
