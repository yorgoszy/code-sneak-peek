
import React from 'react';
import { Check } from 'lucide-react';
import eliteTrainingBg from '@/assets/elite-training-bg.png.asset.json';

interface EliteTrainingSectionProps {
  translations: any;
}

const EliteTrainingSection: React.FC<EliteTrainingSectionProps> = ({ translations }) => {
  return (
    <section className="relative py-24 bg-white" style={{ fontFamily: '"Roobert Pro", sans-serif' }}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${eliteTrainingBg.url})` }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold text-black mb-4">
              {translations.eliteTrainingMethodology}
            </h2>
            <div className="w-16 h-1 bg-[#f4f1ea] mb-8"></div>
            
            <p className="text-lg text-black mb-8">
              {translations.eliteTrainingDesc}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-black" />
                <span className="text-black">{translations.accentuatedEccentric}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-black" />
                <span className="text-black">{translations.accommodatingResistance}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-black" />
                <span className="text-black">{translations.velocityBasedTraining}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-black" />
                <span className="text-black">{translations.specificEnergySystem}</span>
              </div>
            </div>

            <p className="text-black mb-6">
              {translations.cuttingEdgeTech}
            </p>
          </div>

          {/* Right Content - Image with overlay */}
          <div className="relative mt-8 mb-8">
            <img 
              src="/elite_tr.png"
              alt="Elite Training Technology"
              className="w-full h-auto rounded-lg grayscale"
              style={{ marginTop: '0px', marginBottom: '0px' }}
            />
            <div className="absolute bottom-2 -left-4 bg-white text-black p-6 max-w-xs -ml-4">
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Roobert Pro, sans-serif' }}>
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
