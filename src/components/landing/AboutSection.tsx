import React, { useState } from 'react';
import theCoachBg from '@/assets/the-coach-bg.png.asset.json';
import theVisionBg from '@/assets/the-vision-bg.png.asset.json';
import theMethodBg from '@/assets/the-method-bg.png.asset.json';
import coachPhoto from '@/assets/coa3.png.asset.json';
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
    },
    {
      id: 2,
      label: "the vision",
      image: theVisionBg.url,
    },
    {
      id: 3,
      label: "the method",
      image: theMethodBg.url,
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
              <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 'calc(10vw - 1px)' }}>
                <div
                  className="absolute inset-0 bg-cover"
                  style={{ backgroundImage: `url(${slide.image})`, opacity: 0.6, backgroundPosition: 'center center' }}
                />
                <div className="absolute inset-0 bg-black/30" />

                <button
                  onClick={() => api?.scrollPrev()}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <h3
                  className="relative z-10 text-white text-center px-4"
                  style={{ fontFamily: '"Roobert Pro", sans-serif', fontWeight: 500, fontSize: '15.6vw', lineHeight: 1 }}
                >
                  {slide.label}
                </h3>

                <button
                  onClick={() => api?.scrollNext()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* 40/60 Grid */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
                <div className="w-full min-h-[50vh] grid grid-cols-[40%_60%]">
                  {slide.id === 1 ? (
                    <div
                      className="relative bg-white"
                      style={{
                        backgroundImage: `url(${coachPhoto.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-white/60" />
                      <img
                        src={iconBlack}
                        alt=""
                        className="absolute top-4 left-4 w-16 h-16 z-10 brightness-0 invert"
                      />
                      <div className="absolute inset-0 flex items-end justify-center pb-8 z-10">
                        <span
                          className="text-white lowercase"
                          style={{
                            fontFamily: '"UnifrakturMaguntia", cursive',
                            fontSize: '1.75rem',
                          }}
                        >
                          our coach
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white" />
                  )}
                  <div className="bg-white" />
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
