import React from 'react';
import servicesBg from '@/assets/services-bg.png';

interface ProgramsSectionProps {
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ translations }) => {
  return (
    <section id="programs" className="relative">
      <img 
        src={servicesBg} 
        alt="Services" 
        className="w-full h-auto"
      />
    </section>
  );
};

export default ProgramsSection;
