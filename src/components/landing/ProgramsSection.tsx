
import React, { useState } from 'react';
import { ProgramDetailsDialog } from './ProgramDetailsDialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  const programPages = Array.from({ length: totalPages }, (_, index) =>
    programs.slice(index * programsPerPage, (index + 1) * programsPerPage)
  );

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <>
      <section id="programs" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
              {translations.explorePrograms}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ανακαλύψτε τα προγράμματα προπόνησής μας που έχουν σχεδιαστεί για να σας βοηθήσουν να επιτύχετε τους στόχους σας
            </p>
          </div>

          <div className="relative">
            {/* Navigation Buttons */}
            <div className="flex justify-center mb-8 space-x-4">
              <button
                onClick={prevPage}
                className="flex items-center justify-center w-12 h-12 rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 transition-colors"
                disabled={totalPages <= 1}
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button
                onClick={nextPage}
                className="flex items-center justify-center w-12 h-12 rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 transition-colors"
                disabled={totalPages <= 1}
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden h-[400px]">
              <div 
                className="flex flex-col transition-transform duration-500 ease-in-out h-full"
                style={{ 
                  transform: `translateY(-${currentPage * 100}%)`,
                  height: `${totalPages * 100}%`
                }}
              >
                {programPages.map((pagePrograms, pageIndex) => (
                  <div key={pageIndex} className="flex-shrink-0 h-[400px] flex items-center">
                    <div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {pagePrograms.map((program) => (
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
                ))}
              </div>
            </div>

            {/* Page Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-3 h-3 rounded-none transition-colors ${
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
