import React from 'react';
import servicesAlina from '@/assets/services-alina.jpg';

interface ProgramsSectionProps {
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ translations }) => {
  return (
    <section id="programs" className="relative bg-black min-h-[500px]">
      {/* Image positioned at X:100, Y:232, height: 178px (410-232) */}
      <div 
        className="absolute"
        style={{ 
          left: '100px', 
          top: '232px', 
          height: '178px',
          width: 'auto'
        }}
      >
        <div className="relative h-full">
          <img 
            src={servicesAlina} 
            alt="Alina Training" 
            className="h-full w-auto object-cover"
          />
          {/* Intense bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/90 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
