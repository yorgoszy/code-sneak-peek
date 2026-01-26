import React from 'react';
import servicesAlina from '@/assets/services-alina.jpg';
import programsLogo from '@/assets/programs-logo.png';

interface ProgramsSectionProps {
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ translations }) => {
  return (
    <section id="programs" className="relative bg-black min-h-[700px]">
      {/* Logo positioned at X:320, Y:660 - first in order, above photo */}
      <img 
        src={programsLogo} 
        alt="Programs Logo" 
        className="absolute z-10"
        style={{ 
          left: '320px', 
          top: '660px',
          width: '5%'
        }}
      />
      
      {/* Horizontal line at X:750, Y:490 */}
      <div 
        className="absolute bg-white z-10"
        style={{ 
          left: '750px', 
          top: '490px',
          width: '200px',
          height: '3px'
        }}
      />
      
      {/* Text content at X:1200, Y:470 */}
      <div 
        className="absolute z-10"
        style={{ 
          left: '1200px', 
          top: '402px'
        }}
      >
        <h2 
          className="text-white mb-4"
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '34px'
          }}
        >
          Δεξιότητες ή σπορ;
        </h2>
        <p 
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '15px',
            color: '#9fa0a4',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}
        >
          Τα παιδιά πρέπει να είναι επιδέξια. Η κίνηση είναι<br />
          ένα φυσικό προβάδισμα που δεν πρέπει να χάσουν.<br />
          Εμείς τους δίνουμε τα εργαλεία να το αξιοποιήσουν.
        </p>
      </div>
      
      {/* Image positioned at X:300, Y:232 */}
      <div 
        className="absolute"
        style={{ 
          left: '300px', 
          top: '232px'
        }}
      >
        <div className="relative">
          <img 
            src={servicesAlina} 
            alt="Alina Training" 
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

export default ProgramsSection;
