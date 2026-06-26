import React, { useState } from 'react';
import theCoachBg from '@/assets/the-coach-bg.png.asset.json';
import theVisionBg from '@/assets/the-vision-bg.png.asset.json';
import theMethodBg from '@/assets/the-method-bg.png.asset.json';
import coachPhoto from '@/assets/coa3.png.asset.json';
import coachGridBg from '@/assets/coa4.png.asset.json';
import visionPhoto from '@/assets/vis3.png.asset.json';
import visionGridBg from '@/assets/vis4.png.asset.json';
import methodPhoto from '@/assets/meth3.png.asset.json';
import methodGridBg from '@/assets/meth4.png.asset.json';
import { iconBlack } from '@/assets/iconBlack';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AboutSectionProps {
  translations: any;
}

const AboutSection: React.FC<AboutSectionProps> = ({ translations }) => {
  const [api, setApi] = useState<any>();

  const slides = [
    {
      id: 1,
      label: "the coach",
      image: theCoachBg.url,
      leftPhoto: coachPhoto.url,
      rightPhoto: coachGridBg.url,
      titleKey: "headCoach",
      bodyKey: "coachDescription",
    },
    {
      id: 2,
      label: "the vision",
      image: theVisionBg.url,
      leftPhoto: visionPhoto.url,
      rightPhoto: visionGridBg.url,
      titleKey: "ourVision",
      bodyKey: "visionDescription",
    },
    {
      id: 3,
      label: "the method",
      image: theMethodBg.url,
      leftPhoto: methodPhoto.url,
      rightPhoto: methodGridBg.url,
      titleKey: "ourMethodology",
      bodyKey: "trainingMethodologyDescription",
    },
  ];

  return (
    <section id="about" className="bg-white relative overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="basis-full">
              {/* Banner */}
              <div
                className="relative w-full overflow-hidden flex items-center justify-center h-[18vw] min-h-[90px] md:h-[12vw] lg:h-[calc(10vw-1px)]"
              >
                <div
                  className="absolute inset-0 bg-cover"
                  style={{ backgroundImage: `url(${slide.image})`, opacity: 0.6, backgroundPosition: 'center center' }}
                />
                <div className="absolute inset-0 bg-black/30" />

                <button
                  onClick={() => api?.scrollPrev()}
                  aria-label="Previous slide"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <h3
                  className="relative z-10 text-white text-center px-4 text-[14vw] md:text-[14vw] lg:text-[15.6vw] leading-none"
                  style={{ fontFamily: '"Roobert Pro", sans-serif', fontWeight: 500 }}
                >
                  {slide.label}
                </h3>

                <button
                  onClick={() => api?.scrollNext()}
                  aria-label="Next slide"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Responsive Grid: stacked on mobile, 40/60 on desktop */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 lg:pt-20 pb-10 md:pb-16 lg:pb-20">
                <div className="w-full min-h-[40vh] md:min-h-[50vh] grid grid-cols-1 md:grid-cols-[40%_60%]">
                  {/* Left — photo + icon */}
                  <div
                    className="relative bg-white h-48 md:h-auto"
                    style={{
                      backgroundImage: `url(${slide.leftPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 20%',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/60" />
                    <img
                      src={iconBlack}
                      alt=""
                      className="absolute top-3 left-3 md:top-4 md:left-4 w-12 h-12 md:w-16 md:h-16 z-10 brightness-0 invert"
                    />
                  </div>

                  {/* Right — text over photo */}
                  <div
                    className="relative flex flex-col justify-start px-5 py-8 sm:px-6 md:px-8 md:pt-10 md:pb-8 bg-black"
                    style={{
                      backgroundImage: `url(${slide.rightPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/70" />
                    <div className="relative z-10 w-full">
                      <h4
                        className="text-white mb-3 md:mb-4 text-xl md:text-2xl"
                        style={{
                          fontFamily: '"Roobert Pro", sans-serif',
                          fontWeight: 600,
                        }}
                      >
                        {translations[slide.titleKey]}
                      </h4>
                      <p
                        className="text-white leading-relaxed whitespace-pre-line text-sm md:text-base"
                        style={{
                          fontFamily: '"Roobert Pro", sans-serif',
                          lineHeight: 1.7,
                        }}
                      >
                        {translations[slide.bodyKey]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default AboutSection;
