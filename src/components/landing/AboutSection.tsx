import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import aboutBg from '@/assets/about-bg.png';

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
  const isMobile = useIsMobile();

  const sections = [
    {
      id: 1,
      title: translations.headCoach,
      description: translations.coachDescription,
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
      cards: [
        {
          title: translations.movementSkills,
          description: (
            <div className="text-sm text-white">
              <p className="mb-1">• Ανάπτυξη Αθλητικών Δεξιοτήτων</p>
              <p className="mb-1">• Κατάλληλα για την Ηλικία</p>
              <p>• Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις</p>
            </div>
          )
        },
        {
          title: translations.assessment,
          description: (
            <div className="text-sm text-white">
              <p className="mb-1">• Κίνηση & Στάση</p>
              <p className="mb-1">• Προφίλ φορτίου - ταχύτητας</p>
              <p className="mb-1">• Προφίλ άλματος</p>
              <p>• Αντοχή</p>
            </div>
          )
        },
        {
          title: translations.resultsFocused,
          description: (
            <div className="text-sm text-white">
              <p className="mb-1">• Παρακολούθηση Αποτελεσμάτων</p>
              <p className="mb-1">• Καθοδήγηση Απόδοσης</p>
              <p>• Ανάπτυξη Προσαρμοσμένου Προγράμματος</p>
            </div>
          )
        }
      ]
    }
  ];

  const activeSection = sections.find(s => s.id === activeAboutSection) || sections[0];

  return (
    <section 
      id="about" 
      className="relative w-full min-h-screen bg-black"
      style={{
        backgroundImage: `url(${aboutBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Optional overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content container - currently empty as per request */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Content will be added later */}
      </div>
    </section>
  );
};

export default AboutSection;
