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
      <div className="absolute top-[152px] right-8 md:top-[152px] md:right-12">
        <div className="text-left text-white max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Δεξιότητες ή σπορ
          </h2>
          <p className="text-base md:text-lg leading-relaxed">
            Τα παιδιά πρέπει να είναι επιδέξια. Η κίνηση είναι ένα φυσικό προβάδισμα που δεν πρέπει να χάσουν.
          </p>
          <p className="text-base md:text-lg mt-4 font-medium">
            Εμείς τους δίνουμε τα εργαλεία να το αξιοποιήσουν.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
