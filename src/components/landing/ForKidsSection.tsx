import React from 'react';
import forKidsBg from '@/assets/for-kids-bg.jpg';

interface ForKidsSectionProps {
  translations: any;
}

const ForKidsSection: React.FC<ForKidsSectionProps> = ({ translations }) => {
  return (
    <section className="relative min-h-screen">
      {/* Background image - full screen */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${forKidsBg})` }}
      />
    </section>
  );
};

export default ForKidsSection;
