import React from 'react';
import trainingBg from '@/assets/section-3.png';

const TrainingSection: React.FC = () => {
  return (
    <section className="relative">
      <img 
        src={trainingBg} 
        alt="Training" 
        className="w-full h-auto"
      />
    </section>
  );
};

export default TrainingSection;
