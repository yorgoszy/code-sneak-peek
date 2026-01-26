import React from 'react';

const TrainingSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[700px]">
      {/* Vertical line at X:1370, Y:326 */}
      <div 
        className="absolute bg-white"
        style={{ 
          left: '1370px',
          top: '326px',
          width: '2px',
          height: '200px'
        }}
      />
    </section>
  );
};

export default TrainingSection;
