
import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

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
  return (
    <section id="programs" className="py-20 bg-black relative">
      <style>{`
        .carousel-btn {
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          background: transparent !important;
        }
        .carousel-btn:hover {
          background: transparent !important;
          border: 1px solid #00ffba !important;
        }
        .carousel-btn:hover svg {
          color: #00ffba !important;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {translations.explorePrograms}
            </h2>
          </div>
          <div className="flex space-x-4">
            <button 
              className="carousel-btn text-white transition-colors duration-200 h-8 w-8 flex items-center justify-center"
              onClick={() => {
                const carousel = document.querySelector('[data-carousel="previous"]') as HTMLButtonElement;
                if (carousel) {
                  carousel.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  }));
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="carousel-btn text-white transition-colors duration-200 h-8 w-8 flex items-center justify-center"
              onClick={() => {
                const carousel = document.querySelector('[data-carousel="next"]') as HTMLButtonElement;
                if (carousel) {
                  carousel.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  }));
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {programs.map((program) => (
              <CarouselItem key={program.id} className="pl-0 md:basis-1/2 lg:basis-1/4">
                <div className="group cursor-pointer">
                  <div 
                    className="border-l-2 border-gray-500 pl-6"
                    style={{ paddingTop: '20px' }}
                  >
                    <div className="flex items-start mb-2">
                      <span 
                        className="text-2xl font-bold mr-4 flex-shrink-0"
                        style={{ color: program.color }}
                      >
                        {program.id}
                      </span>
                      <h3 className="text-white text-lg font-bold leading-tight">{program.title}</h3>
                    </div>
                    
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.title}
                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                        style={{ opacity: '0.7' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className="text-white text-sm mb-2">{program.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious 
            data-carousel="previous"
            className="hidden"
          />
          <CarouselNext 
            data-carousel="next"
            className="hidden"
          />
        </Carousel>
      </div>
    </section>
  );
};

export default ProgramsSection;
