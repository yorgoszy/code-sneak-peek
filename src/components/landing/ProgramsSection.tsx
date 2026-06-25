
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
import whatWeDoBg from '@/assets/what-we-do-bg.png.asset.json';

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
    <section id="programs" className="bg-white text-black" onClick={handleScreenClick}>
      {/* What We Do Banner */}
      <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 'calc(10vw - 1px)' }}>
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${whatWeDoBg.url})`, opacity: 0.6, backgroundPosition: 'center -45px' }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <h3
          className="relative z-10 text-white text-center px-4"
          style={{ fontFamily: '"Roobert Pro", sans-serif', fontWeight: 500, fontSize: '15.6vw', lineHeight: 1 }}
        >
          {translations?.whatWeDo ?? 'what we do'}
        </h3>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative">

          {/* Mobile & Tablet: Carousel */}
          <div className="lg:hidden">
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
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
                    className="pl-4 basis-full"
                  >
                    <ProgramCard program={program} translations={translations} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-3 gap-6">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} translations={translations} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
