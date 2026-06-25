import React, { useState, useEffect } from 'react';
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
import coachBg from '@/assets/the-coach-bg.png.asset.json';

const WhoWeAreBanner: React.FC = () => (
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
      who we are
    </h3>
  </div>
);

interface AboutSectionProps {
  translations: any;
  activeAboutSection: number;
  onSetActiveAboutSection: (section: number) => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({ 
  translations, 
  activeAboutSection, 
  onSetActiveAboutSection 
}) => {
  const [api, setApi] = useState<any>();
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const isMobile = useIsMobile();

  const aboutSections = [
    {
      id: 1,
      title: translations.headCoach,
      description: translations.coachDescription,
      image: "/lovable-uploads/b715161c-3987-4d67-a2d3-54c3faf97d12.png",
      cards: [
        {
          title: translations.academicBackground,
          description: translations.academicDescription
        },
        {
          title: translations.professionalAthlete,
          description: translations.professionalDescription
        },
        {
          title: translations.coreValues,
          description: translations.coreValuesDescription
        }
      ]
    },
    {
      id: 2,
      title: translations.ourVision,
      description: translations.visionDescription,
      image: "/lovable-uploads/cc86deac-b92b-4ae6-8f5d-1e5f2bd096c2.png",
      cards: [
        {
          title: translations.moreThanPhysical,
          description: translations.moreThanPhysicalDesc
        },
        {
          title: translations.buildingCharacter,
          description: translations.buildingCharacterDesc
        },
        {
          title: translations.trustTheProcess,
          description: translations.trustTheProcessDesc
        }
      ]
    },
    {
      id: 3,
      title: translations.trainingMethodology,
      description: translations.trainingMethodologyDescription,
      image: "/lovable-uploads/9aed48c1-1ec9-4f35-9648-0329d5152c4a.png",
      cards: [
        {
          title: translations.movementSkills,
          description: (
            <div className="text-sm" style={{ color: 'black' }}>
              <p className="mb-2">• Ανάπτυξη Αθλητικών Δεξιοτήτων</p>
              <p className="mb-2">• Κατάλληλα για την Ηλικία</p>
              <p>• Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Ευκινησία, Τρέξιμο, Συντονισμός</p>
            </div>
          )
        },
        {
          title: translations.assessment,
          description: (
            <div className="text-sm" style={{ color: 'black' }}>
              <p className="mb-2">• Κίνηση & Στάση</p>
              <p className="mb-2">• Προφίλ φορτίου - ταχύτητας</p>
              <p className="mb-2">• Προφίλ άλματος</p>
              <p>• Αντοχή</p>
            </div>
          )
        },
        {
          title: translations.resultsFocused,
          description: (
            <div className="text-sm" style={{ color: 'black' }}>
              <p className="mb-2">• Παρακολούθηση Αποτελεσμάτων</p>
              <p className="mb-2">• Καθοδήγηση Απόδοσης</p>
              <p>• Ανάπτυξη Προσαρμοσμένου Προγράμματος</p>
            </div>
          )
        }
      ]
    }
  ];

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile || isAutoplayPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 1500);

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

  if (isMobile) {
    return (
      <section id="about" className="pb-20 bg-white relative overflow-hidden" onClick={handleScreenClick}>
        <WhoWeAreBanner />
        <div className="h-12" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium mb-4 text-black">
              {translations.aboutSection.toUpperCase()}
            </p>
            <h2 className="text-4xl font-bold text-black leading-tight">
              <span className="text-black">{translations.supportingYour}</span><br />
              <span className="text-black">{translations.athleticJourney}</span>
            </h2>
          </div>

          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              {/* Navigation buttons */}
              <div className="absolute -top-16 right-0 flex gap-2 z-10">
                <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-black hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-black hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </div>

              <CarouselContent 
                className="-ml-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
              >
                {aboutSections.map((section) => (
                  <CarouselItem key={section.id} className="pl-4 basis-full">
                    <div className="space-y-6">
                      {/* Section Header */}
                      <div className="flex items-center mb-6">
                        <span className="text-2xl font-bold mr-6 text-black">
                          {section.id.toString().padStart(2, '0')}
                        </span>
                        <h3 className="text-xl text-black font-bold">{section.title}</h3>
                      </div>

                      {/* Image */}
                      <div className="relative mb-6">
                        <img
                          src={section.image}
                          alt={section.title}
                          className="w-full h-[300px] object-cover filter grayscale rounded-none"
                        />
                        <div className="absolute flex items-center" style={{ bottom: '20px', left: '20px', right: '20px' }}>
                          <span className="text-2xl font-bold mr-4 text-black">
                            {section.id.toString().padStart(2, '0')}
                          </span>
                          <div 
                            className="flex-1 bg-black"
                            style={{ height: '1px' }}
                          ></div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <p className="text-sm leading-relaxed text-black">
                          {section.description}
                        </p>
                      </div>

                      {/* Cards */}
                      <div className="space-y-4">
                        {section.cards.map((card, index) => (
                          <div 
                            key={index}
                            className="p-4 border-l-2 rounded-none bg-black/5 border-black"
                          >
                            <h4 className="font-bold mb-2 text-black">{card.title}</h4>
                            {typeof card.description === 'string' ? (
                              <p className="text-sm text-black">{card.description}</p>
                            ) : (
                              <div className="text-black">{card.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </section>
    );
  }

  // Desktop version - keep existing sidebar style
  return (
    <section id="about" className="pb-20 bg-white relative overflow-hidden">
      <WhoWeAreBanner />
      <div className="h-12" />
      <style>{`
        .about-nav-item {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .about-nav-title {
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .about-nav-item.active .about-nav-title {
          border-bottom-color: white;
        }
        .about-nav-item:hover .about-nav-title {
          border-bottom-color: white;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row min-h-[56vh]">
          <div className="lg:w-2/5 flex flex-col" style={{ paddingTop: '80px' }}>
            <div className="mb-12">
              <p className="text-sm font-medium mb-4 text-black">
                {translations.aboutSection.toUpperCase()}
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-black leading-tight">
                <span className="text-black">{translations.supportingYour}</span><br />
                <span className="text-black">{translations.athleticJourney}</span>
              </h2>
            </div>

            <div className="space-y-8">
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 1 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(1)}
              >
                <span className="text-2xl font-bold mr-6 text-black">01</span>
                <h3 className={`text-xl about-nav-title text-black ${activeAboutSection === 1 ? 'font-bold' : ''}`}>{translations.headCoach}</h3>
              </div>
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 2 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(2)}
              >
                <span className="text-2xl font-bold mr-6 text-black">02</span>
                <h3 className={`text-xl about-nav-title text-black ${activeAboutSection === 2 ? 'font-bold' : ''}`}>{translations.ourVision}</h3>
              </div>
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 3 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(3)}
              >
                <span className="text-2xl font-bold mr-6 text-black">03</span>
                <h3 className={`text-xl about-nav-title text-black ${activeAboutSection === 3 ? 'font-bold' : ''}`}>{translations.trainingMethodology}</h3>
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 relative flex flex-col" style={{ paddingTop: '80px' }}>
            <div className="relative mb-8">
              <img
                src={
                  activeAboutSection === 2 ? "/lovable-uploads/cc86deac-b92b-4ae6-8f5d-1e5f2bd096c2.png" : 
                  activeAboutSection === 3 ? "/lovable-uploads/9aed48c1-1ec9-4f35-9648-0329d5152c4a.png" :
                  "/lovable-uploads/b715161c-3987-4d67-a2d3-54c3faf97d12.png"
                }
                alt={
                  activeAboutSection === 2 ? "Our Vision" : 
                  activeAboutSection === 3 ? "Training Methodology" :
                  "Georgios Zygouris - Head Coach"
                }
                className="w-full h-[500px] object-cover filter grayscale"
                style={{ opacity: 0.4 }}
              />
              
              {/* Gradient overlays */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
              <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
              <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
              
              {/* Content overlay for all sections */}
              <div className="absolute inset-0 p-8 flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-4 text-black">
                  {activeAboutSection === 1 && translations.headCoach}
                  {activeAboutSection === 2 && translations.ourVision}
                  {activeAboutSection === 3 && translations.trainingMethodology}
                </h3>
                <p className="text-sm leading-relaxed text-black mb-6">
                  {activeAboutSection === 1 && translations.coachDescription}
                  {activeAboutSection === 2 && translations.visionDescription}
                  {activeAboutSection === 3 && translations.trainingMethodologyDescription}
                </p>
                
                {/* Cards for section 1 */}
                {activeAboutSection === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.academicBackground}</h4>
                      <p className="text-sm text-black">
                        {translations.academicDescription}
                      </p>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.professionalAthlete}</h4>
                      <p className="text-sm text-black">
                        {translations.professionalDescription}
                      </p>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.coreValues}</h4>
                      <p className="text-sm text-black">
                        {translations.coreValuesDescription}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Cards for section 2 */}
                {activeAboutSection === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.moreThanPhysical}</h4>
                      <p className="text-sm text-black">
                        {translations.moreThanPhysicalDesc}
                      </p>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.buildingCharacter}</h4>
                      <p className="text-sm text-black">
                        {translations.buildingCharacterDesc}
                      </p>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.trustTheProcess}</h4>
                      <p className="text-sm text-black">
                        {translations.trustTheProcessDesc}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Cards for section 3 */}
                {activeAboutSection === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.movementSkills}</h4>
                      <div className="text-sm text-black">
                        <p className="mb-2">• {translations.language === 'en' ? 'Athletic Skills Development' : 'Ανάπτυξη Αθλητικών Δεξιοτήτων'}</p>
                        <p className="mb-2">• {translations.language === 'en' ? 'Age Appropriate' : 'Κατάλληλα για την Ηλικία'}</p>
                        <p>• {translations.language === 'en' ? 'Throwing & Catching, Climbing Skills, Jumping & Landing, Agility, Running, Coordination' : 'Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Ευκινησία, Τρέξιμο, Συντονισμός'}</p>
                      </div>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.assessment}</h4>
                      <div className="text-sm text-black">
                        <p className="mb-2">• {translations.language === 'en' ? 'Movement & Posture' : 'Κίνηση & Στάση'}</p>
                        <p className="mb-2">• {translations.language === 'en' ? 'Load-velocity profile' : 'Προφίλ φορτίου - ταχύτητας'}</p>
                        <p className="mb-2">• {translations.language === 'en' ? 'Jump profile' : 'Προφίλ άλματος'}</p>
                        <p>• {translations.language === 'en' ? 'Endurance' : 'Αντοχή'}</p>
                      </div>
                    </div>
                    <div 
                      className="p-4 border-2 rounded-md bg-transparent border-black"
                    >
                      <h4 className="font-bold mb-2 text-black">{translations.resultsFocused}</h4>
                      <div className="text-sm text-black">
                        <p className="mb-2">• {translations.language === 'en' ? 'Results Tracking' : 'Παρακολούθηση Αποτελεσμάτων'}</p>
                        <p className="mb-2">• {translations.language === 'en' ? 'Performance Guidance' : 'Καθοδήγηση Απόδοσης'}</p>
                        <p>• {translations.language === 'en' ? 'Customized Program Development' : 'Ανάπτυξη Προσαρμοσμένου Προγράμματος'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
