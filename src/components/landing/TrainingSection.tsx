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
      
      {/* Fighters image at X:1200, Y:364 */}
      <div 
        className="absolute"
        style={{ 
          left: '1200px', 
          top: '364px'
        }}
      >
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
      </div>
      {/* Logo at X:1320, Y:850 */}
      <div 
        className="absolute z-10"
        style={{ 
          left: '1320px',
          top: '850px'
        }}
      >
        <img 
          src={trainingLogo} 
          alt="Athletes Logo" 
          style={{ width: '110px' }}
        />
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
