
import React from 'react';
import { Check } from 'lucide-react';

interface EliteTrainingSectionProps {
  translations: any;
}

const EliteTrainingSection: React.FC<EliteTrainingSectionProps> = ({ translations }) => {
  return (
    <section className="py-8" style={{ backgroundColor: '#aca097' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold text-black mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              {translations.eliteTrainingMethodology}
            </h2>
            <div className="w-16 h-1 bg-[#cb8954] mb-8"></div>
            
            <p className="text-lg text-gray-600 mb-8">
              {translations.eliteTrainingDesc}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#cb8954]" />
                <span className="text-gray-700">{translations.accentuatedEccentric}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#cb8954]" />
                <span className="text-gray-700">{translations.accommodatingResistance}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#cb8954]" />
                <span className="text-gray-700">{translations.velocityBasedTraining}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#cb8954]" />
                <span className="text-gray-700">{translations.specificEnergySystem}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              {translations.cuttingEdgeTech}
            </p>
          </div>

          {/* Right Content - Image with overlay */}
          <div className="relative mt-8 mb-8">
            <img 
              src="/elite_tr.png"
              alt="Elite Training Technology"
              className="w-full h-auto rounded-lg"
              style={{ marginTop: '0px', marginBottom: '0px' }}
            />
            <div className="absolute bottom-2 -left-4 bg-[#cb8954] text-black p-6 max-w-xs -ml-4">
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                {translations.advancedTechnology}
              </h3>
              <p className="text-sm">
                {translations.realTimeTracking}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EliteTrainingSection;
