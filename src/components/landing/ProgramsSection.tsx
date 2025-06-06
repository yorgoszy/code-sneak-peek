
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ProgramDetailsDialog } from './ProgramDetailsDialog';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface ProgramsSectionProps {
  programs: Program[];
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ programs, translations }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProgram = () => {
    setCurrentIndex((prev) => (prev + 1) % programs.length);
  };

  const prevProgram = () => {
    setCurrentIndex((prev) => (prev - 1 + programs.length) % programs.length);
  };

  return (
    <>
      <section id="programs" className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
              {translations.ourPrograms}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {translations.programsDescription}
            </p>
          </div>

          {/* Desktop View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div 
                key={program.id}
                className="bg-white rounded-none overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => setSelectedProgram(program)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded-none">
                      {program.id}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert, sans-serif' }}>
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {program.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[#00ffba] font-semibold text-sm">
                      {translations.learnMore}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#00ffba] flex items-center justify-center">
                      <span className="text-black text-xs font-bold">→</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {programs.map((program) => (
                  <div 
                    key={program.id}
                    className="w-full flex-shrink-0 px-4"
                    onClick={() => setSelectedProgram(program)}
                  >
                    <div className="bg-white rounded-none overflow-hidden shadow-lg cursor-pointer">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={program.image} 
                          alt={program.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded-none">
                            {program.id}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert, sans-serif' }}>
                          {program.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {program.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[#00ffba] font-semibold text-sm">
                            {translations.learnMore}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-[#00ffba] flex items-center justify-center">
                            <span className="text-black text-xs font-bold">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
              onClick={prevProgram}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
              onClick={nextProgram}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {programs.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-[#00ffba]' : 'bg-gray-600'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProgramDetailsDialog
        program={selectedProgram}
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </>
  );
};

export default ProgramsSection;
