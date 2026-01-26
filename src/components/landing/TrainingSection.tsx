import React from 'react';
import trainingFighters from '@/assets/training-fighters.png';

const TrainingSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[700px]">
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

export default TrainingSection;
