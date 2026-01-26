import React from 'react';
import trainingFighters from '@/assets/training-fighters.png';
import trainingLogo from '@/assets/training-logo.png';

const TrainingSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[900px]">
      {/* Vertical line at X:1370, Y:0 */}
      <div 
        className="absolute bg-white"
        style={{ 
          left: '1370px',
          top: '0px',
          width: '2px',
          height: '200px'
        }}
      />
      
      {/* Grouped: Fighters image + Logo */}
      <div 
        className="absolute"
        style={{ 
          left: '1081px', 
          top: '364px'
        }}
      >
        {/* Fighters image */}
        <div className="relative">
          <img 
            src={trainingFighters} 
            alt="Fighters Training" 
            className="w-auto object-contain opacity-60"
            style={{ height: '550px' }}
          />
          {/* Intense bottom gradient */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
            style={{ height: '150px' }}
          />
        </div>
        
        {/* Logo - positioned relative to the group (offset 120px from left, 486px from top of image) */}
        <div 
          className="absolute z-10"
          style={{ 
            left: '120px',
            top: '486px'
          }}
        >
          <img 
            src={trainingLogo} 
            alt="Athletes Logo" 
            style={{ width: '130px' }}
          />
        </div>
      </div>

      {/* Bottom gradient for section */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
        style={{ height: '150px' }}
      />
    </section>
  );
};

export default TrainingSection;
