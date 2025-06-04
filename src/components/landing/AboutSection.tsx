
import React from 'react';

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
  return (
    <section id="about" className="py-20 bg-black relative overflow-hidden">
      <style>{`
        .about-nav-item {
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
        }
        .about-nav-item.active {
          border-bottom-color: #00ffba;
        }
        .about-nav-item:hover {
          border-bottom-color: #00ffba;
        }
      `}</style>
      
      <div className="w-full">
        <div className="flex flex-col lg:flex-row min-h-[80vh]">
          <div className="lg:w-3/5 flex flex-col px-8 lg:px-16 xl:px-24" style={{ paddingTop: '80px' }}>
            <div className="mb-12">
              <p className="text-sm font-medium mb-4" style={{ color: '#00ffba' }}>
                {translations.aboutSection.toUpperCase()}
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {translations.supportingYour}<br />
                <span style={{ color: '#00ffba' }}>{translations.athleticJourney}</span>
              </h2>
            </div>

            <div className="space-y-8">
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 1 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(1)}
              >
                <span className="text-2xl font-bold mr-6" style={{ color: activeAboutSection === 1 ? '#00ffba' : '#6b7280' }}>01</span>
                <h3 className={`text-xl font-bold ${activeAboutSection === 1 ? 'text-white' : 'text-gray-400'}`}>{translations.headCoach}</h3>
              </div>
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 2 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(2)}
              >
                <span className="text-2xl font-bold mr-6" style={{ color: activeAboutSection === 2 ? '#00ffba' : '#6b7280' }}>02</span>
                <h3 className={`text-xl ${activeAboutSection === 2 ? 'text-white font-bold' : 'text-gray-400'}`}>{translations.ourVision}</h3>
              </div>
              <div 
                className={`flex items-center about-nav-item ${activeAboutSection === 3 ? 'active' : ''}`}
                onClick={() => onSetActiveAboutSection(3)}
              >
                <span className="text-2xl font-bold mr-6" style={{ color: activeAboutSection === 3 ? '#00ffba' : '#6b7280' }}>03</span>
                <h3 className={`text-xl ${activeAboutSection === 3 ? 'text-white font-bold' : 'text-gray-400'}`}>{translations.trainingMethodology}</h3>
              </div>
            </div>
          </div>

          <div className="lg:w-2/5 relative flex flex-col items-center" style={{ paddingTop: '80px' }}>
            <div className="relative mb-8">
              <img
                src="/lovable-uploads/b715161c-3987-4d67-a2d3-54c3faf97d12.png"
                alt="Georgios Zygouris - Head Coach"
                className="max-w-full h-auto filter grayscale"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center">
                <span className="text-4xl font-bold mr-6 ml-8" style={{ color: '#00ffba' }}>
                  {activeAboutSection.toString().padStart(2, '0')}
                </span>
                <div 
                  className="flex-1 mr-8"
                  style={{ backgroundColor: '#00ffba', height: '2px' }}
                ></div>
              </div>
            </div>

            <div className="bg-black bg-opacity-90 p-8 w-full max-w-2xl">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {activeAboutSection === 1 && translations.headCoach}
                  {activeAboutSection === 2 && translations.ourVision}
                  {activeAboutSection === 3 && translations.trainingMethodology}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {activeAboutSection === 1 && translations.coachDescription}
                  {activeAboutSection === 2 && "Το όραμά μας είναι να δημιουργήσουμε ένα περιβάλλον όπου κάθε άτομο μπορεί να ανακαλύψει και να αναπτύξει τις φυσικές του ικανότητες μέσω επιστημονικά τεκμηριωμένων μεθόδων προπόνησης."}
                  {activeAboutSection === 3 && "Η μεθοδολογία μας βασίζεται στην ολιστική προσέγγιση της αθλητικής ανάπτυξης, συνδυάζοντας σύγχρονες επιστημονικές μεθόδους με εξατομικευμένη προσέγγιση για κάθε αθλητή."}
                </p>
              </div>

              {activeAboutSection === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="p-4 border-l-2"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.academicBackground}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.academicDescription}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.professionalAthlete}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.professionalDescription}
                    </p>
                  </div>
                  <div 
                    className="p-4 border-l-2"
                    style={{ backgroundColor: '#171e2c', borderColor: '#00ffba' }}
                  >
                    <h4 className="text-white font-bold mb-2">{translations.coreValues}</h4>
                    <p className="text-gray-400 text-sm">
                      {translations.coreValuesDescription}
                    </p>
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
