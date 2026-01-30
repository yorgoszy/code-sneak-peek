
import React from 'react';
import { Check } from 'lucide-react';

interface EliteTrainingSectionProps {
  translations: any;
}

const EliteTrainingSection: React.FC<EliteTrainingSectionProps> = ({ translations }) => {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              {translations.eliteTrainingMethodology}
            </h2>
            <div className="w-16 h-1 bg-white mb-8"></div>
            
            <p className="text-lg text-white mb-8">
              {translations.eliteTrainingDesc}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-white" />
                <span className="text-white">{translations.accentuatedEccentric}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-white" />
                <span className="text-white">{translations.accommodatingResistance}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-white" />
                <span className="text-white">{translations.velocityBasedTraining}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-white" />
                <span className="text-white">{translations.specificEnergySystem}</span>
              </div>
            </div>

            <p className="text-white mb-6">
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
            <div className="absolute bottom-2 -left-4 bg-white text-black p-6 max-w-xs -ml-4">
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
