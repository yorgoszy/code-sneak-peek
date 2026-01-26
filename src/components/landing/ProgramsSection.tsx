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
          left: '320px', 
          top: '660px'
        }}
      >
        <div className="relative">
          <img 
            src={servicesAlina} 
            alt="Alina Training" 
            className="w-auto object-contain opacity-60"
            style={{ height: '500px' }}
          />
          {/* Intense bottom gradient */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
            style={{ height: '150px' }}
          />
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
