import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import coachPhoto from '@/assets/coach-photo.png';

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
    <section id="about" className="py-20 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center lg:text-left">
          <p className="text-sm font-medium mb-4 text-white">
            {translations.aboutSection?.toUpperCase() || 'ΣΧΕΤΙΚΑ ΜΕ ΕΜΑΣ'}
          </p>
        </div>

        {/* Main Content */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8 lg:gap-12`}>
          {/* Left - Photo */}
          <div className={`${isMobile ? 'w-full' : 'w-1/2 lg:w-2/5'} flex-shrink-0`}>
            <div className="relative">
              <img
                src={coachPhoto}
                alt="Γεώργιος Ζυγούρης - Κύριος Προπονητής"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Right - Content (placeholder for future content) */}
          <div className={`${isMobile ? 'w-full' : 'w-1/2 lg:w-3/5'} flex flex-col`}>
            {/* Content will be added later */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
