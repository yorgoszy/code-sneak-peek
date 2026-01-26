import React from 'react';
import servicesAlina from '@/assets/services-alina.jpg';

interface ProgramsSectionProps {
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ translations }) => {
  return (
    <section id="programs" className="relative bg-black min-h-[700px]">
      {/* Image positioned at X:300, Y:232 */}
      <div 
        className="absolute"
        style={{ 
          left: '300px', 
          top: '232px'
        }}
      >
        <div className="relative">
          <img 
            src={servicesAlina} 
            alt="Alina Training" 
            className="w-auto object-contain"
            style={{ height: '500px' }}
          />
          {/* Intense bottom gradient */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent"
            style={{ height: '250px' }}
          />
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
