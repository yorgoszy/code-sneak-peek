
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
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const isMobile = useIsMobile();

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile || isAutoplayPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000); // 3 δευτερόλεπτα

    return () => clearInterval(interval);
  }, [api, isMobile, isAutoplayPaused]);

  const handleTouchStart = () => {
    if (isMobile) {
      setIsAutoplayPaused(true);
    }
  };

  const handleTouchEnd = () => {
    // Δεν επανεκκινούμε το autoplay πια
  };

  const handleScreenClick = () => {
    if (isMobile) {
      setIsAutoplayPaused(true);
    }
  };

  return (
    <section id="programs" className="py-20 bg-black text-white" onClick={handleScreenClick}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="relative">
          {/* Header with navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              {translations.language === 'en' ? (
                <>
                  <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Robert, sans-serif', color: '#ACA097' }}>
                    Explore all
                  </h3>
                  <h4 className="text-3xl font-bold" style={{ fontFamily: 'Robert, sans-serif', color: '#ACA097' }}>
                    services
                  </h4>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Robert, sans-serif', color: '#ACA097' }}>
                    Υπηρεσίες
                  </h3>
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
            {/* Navigation buttons positioned absolutely in top right - only show if more than 3 programs */}
            {programs.length > 3 && (
              <div className="absolute -top-16 right-0 flex gap-2 z-10">
                <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </div>
            )}

            <CarouselContent 
              className="-ml-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
            >
              {programs.map((program) => (
                <CarouselItem 
                  key={program.id} 
                  className={`pl-4 ${isMobile ? 'basis-full' : 'basis-1/3'}`}
                >
                  <ProgramCard program={program} translations={translations} />
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
