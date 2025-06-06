
import React, { useState } from 'react';
import { ProgramDetailsDialog } from './ProgramDetailsDialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(0);

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
    setIsDialogOpen(true);
  };

  // Διαιρούμε τα προγράμματα σε ομάδες των 3
  const programsPerPage = 3;
  const totalPages = Math.ceil(programs.length / programsPerPage);
  
  const getCurrentPagePrograms = () => {
    const startIndex = currentPage * programsPerPage;
    const endIndex = startIndex + programsPerPage;
    return programs.slice(startIndex, endIndex);
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const currentPrograms = getCurrentPagePrograms();

  return (
    <>
      <section id="programs" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 text-left" style={{ fontFamily: 'Robert, sans-serif' }}>
              {translations.language === 'el' ? (
                <>
                  <div>Εξερεύνηση Όλων</div>
                  <div>των Προγραμμάτων</div>
                </>
              ) : (
                <>
                  <div>Explore All</div>
                  <div>Programs</div>
                </>
              )}
            </h2>
          </div>

          <div className="relative">
            {/* Navigation Buttons - Far Right */}
            <div className="flex justify-end mb-8 space-x-4">
              <button
                onClick={prevPage}
                className="flex items-center justify-center w-10 h-10 bg-transparent border border-white text-white hover:border-[#00ffba] hover:text-[#00ffba] transition-all duration-300"
                disabled={totalPages <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextPage}
                className="flex items-center justify-center w-10 h-10 bg-transparent border border-white text-white hover:border-[#00ffba] hover:text-[#00ffba] transition-all duration-300"
                disabled={totalPages <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Programs Grid */}
            <div className="min-h-[500px] flex items-center justify-center">
              <div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 ease-in-out">
                {currentPrograms.map((program) => (
                  <div 
                    key={program.id}
                    className="group cursor-pointer"
                    onClick={() => handleProgramClick(program)}
                  >
                    <div className="bg-white border-2 border-black overflow-hidden h-full">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={program.image}
                          alt={program.title}
                          className="w-full h-full object-cover grayscale brightness-100 contrast-100 saturate-0 transition-all duration-300 group-hover:grayscale-0 group-hover:saturate-100 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4">
                          <span 
                            className="text-2xl font-bold text-white bg-black/70 px-2 py-1"
                            style={{ color: '#00ffba' }}
                          >
                            {program.id}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-black mb-3">
                          {program.title}
                        </h3>
                        <p className="text-black text-sm leading-relaxed mb-4">
                          {program.description}
                        </p>
                        <div className="text-white bg-[#00ffba] px-4 py-2 text-sm font-semibold hover:bg-[#00ffba]/90 transition-colors duration-300 inline-block">
                          Κλικ για περισσότερες λεπτομέρειες →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-3 h-3 transition-colors ${
                    currentPage === index ? 'bg-[#00ffba]' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
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
