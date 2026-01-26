import React from 'react';
import planningBg from '@/assets/section-4.png';

const PlanningSection: React.FC = () => {
  return (
    <section className="relative">
      <img 
        src={planningBg} 
        alt="Planning" 
        className="w-full h-auto"
      />
    </section>
  );
};

export default PlanningSection;
