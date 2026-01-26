import React from 'react';
import sessionServicesBg from '@/assets/session-services-bg.png';

interface ProgramsSectionProps {
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ translations }) => {
  return (
    <section id="programs" className="relative">
      <img 
        src={sessionServicesBg} 
        alt="Session Services" 
        className="w-full h-auto"
      />
    </section>
  );
};

export default ProgramsSection;
