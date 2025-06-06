
import React, { useState } from 'react';
import { ProgramDetailsDialog } from './ProgramDetailsDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {programs.map((program) => (
                  <CarouselItem key={program.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div 
                      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group h-full"
                      onClick={() => setSelectedProgram(program)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={program.image} 
                          alt={program.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 filter grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold">
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
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20" />
              <CarouselNext className="rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20" />
            </Carousel>
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
