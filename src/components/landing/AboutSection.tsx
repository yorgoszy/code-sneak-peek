import React, { useState } from 'react';
import theCoachBg from '@/assets/the-coach-bg-v2.png.asset.json';
import theVisionBg from '@/assets/the-vision-bg.png.asset.json';
import theMethodBg from '@/assets/the-method-bg.png.asset.json';
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
      title: translations.headCoach,
      description: translations.coachDescription,
      image: theCoachBg.url,
      cards: [
        { title: translations.academicBackground, description: translations.academicDescription },
        { title: translations.professionalAthlete, description: translations.professionalDescription },
        { title: translations.coreValues, description: translations.coreValuesDescription },
      ]
    },
    {
      id: 2,
      label: "the vision",
      title: translations.ourVision,
      description: translations.visionDescription,
      image: theVisionBg.url,
      cards: [
        { title: translations.moreThanPhysical, description: translations.moreThanPhysicalDesc },
        { title: translations.buildingCharacter, description: translations.buildingCharacterDesc },
        { title: translations.trustTheProcess, description: translations.trustTheProcessDesc },
      ]
    },
    {
      id: 3,
      label: "the method",
      title: translations.trainingMethodology,
      description: translations.trainingMethodologyDescription,
      image: theMethodBg.url,
      cards: [
        { title: translations.movementSkills, description: translations.language === 'en' ? 'Athletic Skills Development\nAge Appropriate\nThrowing & Catching, Climbing Skills, Jumping & Landing, Agility, Running, Coordination' : 'Ανάπτυξη Αθλητικών Δεξιοτήτων\nΚατάλληλα για την Ηλικία\nΡίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Ευκινησία, Τρέξιμο, Συντονισμός' },
        { title: translations.assessment, description: translations.language === 'en' ? 'Movement & Posture\nLoad-velocity profile\nJump profile\nEndurance' : 'Κίνηση & Στάση\nΠροφίλ φορτίου - ταχύτητας\nΠροφίλ άλματος\nΑντοχή' },
        { title: translations.resultsFocused, description: translations.language === 'en' ? 'Results Tracking\nPerformance Guidance\nCustomized Program Development' : 'Παρακολούθηση Αποτελεσμάτων\nΚαθοδήγηση Απόδοσης\nΑνάπτυξη Προσαρμοσμένου Προγράμματος' },
      ]
    },
  ];

  const renderCardDescription = (desc: string) => {
    const lines = desc.split('\n');
    return (
      <div className="text-sm" style={{ color: 'black' }}>
        {lines.map((line, i) => (
          <p key={i} className={i < lines.length - 1 ? 'mb-2' : ''}>• {line}</p>
        ))}
      </div>
    );
  };

  return (
    <section id="about" className="pb-20 bg-white relative overflow-hidden">
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
              {/* Banner with background + who we are */}
              <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 'calc(10vw - 1px)' }}>
                <div
                  className="absolute inset-0 bg-cover"
                  style={{ backgroundImage: `url(${slide.image})`, opacity: 0.6, backgroundPosition: 'center center' }}
                />
                <div className="absolute inset-0 bg-black/30" />

                {/* Left arrow */}
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

                {/* Right arrow */}
                <button
                  onClick={() => api?.scrollNext()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Content area */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="relative">
                  <div className="relative flex flex-col" style={{ paddingTop: '80px' }}>
                    <div className="relative mb-8">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-[500px] object-cover filter grayscale"
                        style={{ opacity: 0.4 }}
                      />

                      {/* Gradient overlays */}
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
                      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
                      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

                      {/* Content overlay */}
                      <div className="absolute inset-0 p-8 flex flex-col justify-center">
                        <h3 className="text-xl font-bold mb-4 text-black">{slide.title}</h3>
                        <p className="text-sm leading-relaxed text-black mb-6">{slide.description}</p>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {slide.cards.map((card, index) => (
                            <div key={index} className="p-4 border-2 rounded-none bg-transparent border-black">
                              <h4 className="font-bold mb-2 text-black">{card.title}</h4>
                              {typeof card.description === 'string' && card.description.includes('\n')
                                ? renderCardDescription(card.description)
                                : <p className="text-sm text-black">{card.description}</p>
                              }
                            </div>
                          ))}
                        </div>
                      </div>
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
