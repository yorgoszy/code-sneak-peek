
import React, { useState, useEffect } from 'react';
import { ProgramCard } from './ProgramCard';
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
                  className={`pl-4 ${isMobile ? 'basis-full' : 'basis-1/2'}`}
                >
                  <ProgramCard program={program} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
