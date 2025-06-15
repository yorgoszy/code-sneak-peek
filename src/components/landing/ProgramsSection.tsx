
import React, { useState, useEffect } from 'react';
import { ProgramDetailsDialog } from './ProgramDetailsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [api, setApi] = useState<any>();
  const isMobile = useIsMobile();

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 1500);

    return () => clearInterval(interval);
  }, [api, isMobile]);

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
            {/* Header with navigation */}
            <div className="flex justify-between items-center mb-8">
              <div className="text-left">
                {translations.language === 'en' ? (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
                      Explore all
                    </h3>
                    <h4 className="text-3xl font-bold text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
                      programs
                    </h4>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
                      Εξερεύνηση όλων
                    </h3>
                    <h4 className="text-3xl font-bold text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
                      των προγραμμάτων
                    </h4>
                  </>
                )}
              </div>
            </div>

            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              {/* Navigation buttons positioned absolutely in top right */}
              <div className="absolute -top-16 right-0 flex gap-2 z-10">
                <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </div>

              <CarouselContent className="-ml-4">
                {programs.map((program) => (
                  <CarouselItem 
                    key={program.id} 
                    className={`pl-4 ${isMobile ? 'basis-full' : 'basis-1/3'}`}
                  >
                    <div 
                      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group h-[400px] flex flex-col"
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
                          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded">
                            {program.id}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col relative">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 min-h-[3rem] flex items-start" style={{ fontFamily: 'Robert, sans-serif' }}>
                          {program.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed flex-1 overflow-hidden">
                          {program.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[#00ffba] font-semibold text-sm">
                            {translations.learnMore}
                          </span>
                          <div className="absolute bottom-6 right-6 w-6 h-6 rounded-full bg-[#00ffba] flex items-center justify-center">
                            <span className="text-black text-xs font-bold">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
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
