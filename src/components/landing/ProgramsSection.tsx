
import React, { useState } from 'react';
import { ProgramDetailsDialog } from './ProgramDetailsDialog';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
  details?: {
    ages: string;
    duration: string;
    frequency: string;
    schedule: string;
    benefits: string[];
    weeklySchedule: string[];
    pricing: {
      title: string;
      price: string;
      features: string[];
    }[];
  };
}

interface ProgramsSectionProps {
  programs: Program[];
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ programs, translations }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
    setIsDialogOpen(true);
  };

  return (
    <>
      <section id="programs" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
              {translations.explorePrograms}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ανακαλύψτε τα προγράμματα προπόνησής μας που έχουν σχεδιαστεί για να σας βοηθήσουν να επιτύχετε τους στόχους σας
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div 
                key={program.id}
                className="group cursor-pointer transition-transform duration-300 hover:scale-105"
                onClick={() => handleProgramClick(program)}
              >
                <div className="bg-white border border-gray-200 rounded-none shadow-lg overflow-hidden h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute top-4 left-4">
                      <span 
                        className="text-2xl font-bold text-white bg-black/50 px-2 py-1 rounded-none"
                        style={{ color: '#00ffba' }}
                      >
                        {program.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#00ffba] transition-colors duration-300">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {program.description}
                    </p>
                    <div className="text-[#00ffba] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Κλικ για περισσότερες λεπτομέρειες →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProgramDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        program={selectedProgram}
      />
    </>
  );
};

export default ProgramsSection;
