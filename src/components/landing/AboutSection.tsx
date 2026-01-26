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
          <p className="text-sm font-medium mb-4" style={{ color: '#cb8954' }}>
            {translations.aboutSection?.toUpperCase() || 'ΣΧΕΤΙΚΑ ΜΕ ΕΜΑΣ'}
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            <span style={{ color: '#aca097' }}>{translations.supportingYour}</span><br />
            <span style={{ color: '#cb8954' }}>{translations.athleticJourney}</span>
          </h2>
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

          {/* Right - Content */}
          <div className={`${isMobile ? 'w-full' : 'w-1/2 lg:w-3/5'} flex flex-col`}>
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 lg:gap-8 mb-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onSetActiveAboutSection(section.id)}
                  className="flex items-center gap-3 transition-all duration-300 group"
                >
                  <span 
                    className="text-lg lg:text-xl font-bold"
                    style={{ color: activeAboutSection === section.id ? '#cb8954' : '#aca097' }}
                  >
                    {section.id.toString().padStart(2, '0')}
                  </span>
                  <span 
                    className={`text-sm lg:text-base font-medium pb-1 border-b-2 transition-all duration-300`}
                    style={{ 
                      color: activeAboutSection === section.id ? 'white' : '#aca097',
                      borderColor: activeAboutSection === section.id ? '#cb8954' : 'transparent'
                    }}
                  >
                    {section.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Section Content */}
            <div className="space-y-6">
              {/* Title & Description */}
              <div>
                <h3 className="text-xl lg:text-2xl font-bold mb-4" style={{ color: '#cb8954' }}>
                  {activeSection.title}
                </h3>
                <p className="text-sm lg:text-base leading-relaxed" style={{ color: '#aca097' }}>
                  {activeSection.description}
                </p>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-4">
                {activeSection.cards.map((card, index) => (
                  <div 
                    key={index}
                    className="p-4 lg:p-5 border-l-2 transition-all duration-300"
                    style={{ 
                      borderColor: '#cb8954',
                      backgroundColor: 'rgba(172, 160, 151, 0.1)'
                    }}
                  >
                    <h4 className="font-bold mb-2" style={{ color: '#cb8954' }}>
                      {card.title}
                    </h4>
                    {typeof card.description === 'string' ? (
                      <p className="text-sm" style={{ color: '#aca097' }}>
                        {card.description}
                      </p>
                    ) : (
                      <div style={{ color: '#aca097' }}>{card.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
