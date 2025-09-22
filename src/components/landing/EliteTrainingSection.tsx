
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
              Elite Training Methodology
            </h2>
            <div className="w-16 h-1 bg-[#00ffba] mb-8"></div>
            
            <p className="text-lg text-gray-600 mb-8">
              Our training methodology is based on scientific principles and years of 
              experience working with athletes. We focus on developing all 
              aspects of athletic performance
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">Accentuated Eccentric Loading</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">Accommodating Resistance</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">Velocity Based Training</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">Specific Energy System Development</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              We utilize cutting-edge technology to track performance metrics in real-time, 
              allowing for precise adjustments and optimal training outcomes.
            </p>
          </div>

          {/* Right Content - Image with overlay */}
          <div className="relative mt-8 mb-8">
            <img 
              src="/lovable-uploads/8b3f087c-b412-4ec3-87f3-f4c486a00625.png"
              alt="Elite Training Technology"
              className="w-full h-auto rounded-lg"
              style={{ marginTop: '0px', marginBottom: '0px' }}
            />
            <div className="absolute bottom-2 -left-4 bg-[#00ffba] text-black p-6 max-w-xs -ml-4">
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                Advanced Technology
              </h3>
              <p className="text-sm">
                Real-time performance tracking for optimal results
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EliteTrainingSection;
