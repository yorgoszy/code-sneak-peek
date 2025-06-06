
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
  const aboutSections = [
    {
      id: 1,
      title: translations.headCoach,
      image: "/lovable-uploads/b715161c-3987-4d67-a2d3-54c3faf97d12.png",
      alt: "Georgios Zygouris - Head Coach"
    },
    {
      id: 2,
      title: translations.ourVision,
      image: "/lovable-uploads/cc86deac-b92b-4ae6-8f5d-1e5f2bd096c2.png",
      alt: "Our Vision"
    },
    {
      id: 3,
      title: translations.trainingMethodology,
      image: "/lovable-uploads/9aed48c1-1ec9-4f35-9648-0329d5152c4a.png",
      alt: "Training Methodology"
    }
  ];

  const nextSection = () => {
    const nextIndex = activeAboutSection === 3 ? 1 : activeAboutSection + 1;
    onSetActiveAboutSection(nextIndex);
  };

  const prevSection = () => {
    const prevIndex = activeAboutSection === 1 ? 3 : activeAboutSection - 1;
    onSetActiveAboutSection(prevIndex);
  };

  const currentSection = aboutSections.find(section => section.id === activeAboutSection);

  return (
    <section id="about" className="py-20 bg-black relative overflow-hidden">
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
          border-bottom-color: #00ffba;
        }
        .about-nav-item:hover .about-nav-title {
          border-bottom-color: #00ffba;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row min-h-[56vh]">
          <div className="lg:w-2/5 flex flex-col" style={{ paddingTop: '80px' }}>
            <div className="mb-12">
              <p className="text-sm font-medium mb-4" style={{ color: '#00ffba' }}>
                {translations.aboutSection.toUpperCase()}
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {translations.supportingYour}<br />
                <span style={{ color: '#00ffba' }}>{translations.athleticJourney}</span>
              </h2>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block space-y-8">
              {aboutSections.map((section) => (
                <div 
                  key={section.id}
                  className={`flex items-center about-nav-item ${activeAboutSection === section.id ? 'active' : ''}`}
                  onClick={() => onSetActiveAboutSection(section.id)}
                >
                  <span className="text-2xl font-bold mr-6" style={{ color: activeAboutSection === section.id ? '#00ffba' : '#6b7280' }}>
                    {section.id.toString().padStart(2, '0')}
                  </span>
                  <h3 className={`text-xl about-nav-title ${activeAboutSection === section.id ? 'text-white font-bold' : 'text-gray-400'}`}>
                    {section.title}
                  </h3>
                </div>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#00ffba] hover:text-white"
                onClick={prevSection}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <div className="text-center">
                <span className="text-2xl font-bold mr-4" style={{ color: '#00ffba' }}>
                  {activeAboutSection.toString().padStart(2, '0')}
                </span>
                <h3 className="text-lg text-white font-bold">
                  {currentSection?.title}
                </h3>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-[#00ffba] hover:text-white"
                onClick={nextSection}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="lg:w-3/5 relative flex flex-col" style={{ paddingTop: '80px' }}>
            <div className="relative mb-8">
              <img
                src={currentSection?.image}
                alt={currentSection?.alt}
                className="w-full h-[420px] object-cover filter grayscale"
              />
              <div className="absolute flex items-center" style={{ bottom: '40px', left: '20px', right: '0px' }}>
                <span className="text-4xl font-bold mr-6" style={{ color: '#00ffba' }}>
                  {activeAboutSection.toString().padStart(2, '0')}
                </span>
                <div 
                  className="flex-1 mr-8"
                  style={{ backgroundColor: '#00ffba', height: '1px' }}
                ></div>
              </div>
            </div>

            <div className="bg-black bg-opacity-90 w-full">
              <div className="p-0 mb-6">
                <div className="px-0 py-8">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {activeAboutSection === 1 && translations.headCoach}
                    {activeAboutSection === 2 && translations.ourVision}
                    {activeAboutSection === 3 && translations.trainingMethodology}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {activeAboutSection === 1 && translations.coachDescription}
                    {activeAboutSection === 2 && translations.visionDescription}
                    {activeAboutSection === 3 && translations.trainingMethodologyDescription}
                  </p>
                </div>
              </div>

              {activeAboutSection === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.academicBackground}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.academicDescription}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.professionalAthlete}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.professionalDescription}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.coreValues}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.coreValuesDescription}
                    </p>
                  </div>
                </div>
              )}

              {activeAboutSection === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.moreThanPhysical}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.moreThanPhysicalDesc}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.buildingCharacter}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.buildingCharacterDesc}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.trustTheProcess}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.trustTheProcessDesc}
                    </p>
                  </div>
                </div>
              )}

              {activeAboutSection === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.movementSkills}</h4>
                    <div className="text-gray-400 text-sm">
                      <p className="mb-2">• Ανάπτυξη Αθλητικών Δεξιοτήτων</p>
                      <p className="mb-2">• Κατάλληλα για την Ηλικία</p>
                      <p>• Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Ευκινησία, Τρέξιμο, Συντονισμός</p>
                    </div>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.assessment}</h4>
                    <div className="text-gray-400 text-sm">
                      <p className="mb-2">• Κίνηση & Στάση</p>
                      <p className="mb-2">• Προφίλ φορτίου - ταχύτητας</p>
                      <p className="mb-2">• Προφίλ άλματος</p>
                      <p>• Αντοχή</p>
                    </div>
                  </div>
                  <div 
                    className="p-4 border-l-2 rounded-md"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.resultsFocused}</h4>
                    <div className="text-gray-400 text-sm">
                      <p className="mb-2">• Παρακολούθηση Αποτελεσμάτων</p>
                      <p className="mb-2">• Καθοδήγηση Απόδοσης</p>
                      <p>• Ανάπτυξη Προσαρμοσμένου Προγράμματος</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
