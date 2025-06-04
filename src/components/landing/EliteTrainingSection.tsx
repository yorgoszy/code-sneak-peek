
import React from 'react';
import { Check } from 'lucide-react';

interface EliteTrainingSectionProps {
  translations: any;
}

const EliteTrainingSection: React.FC<EliteTrainingSectionProps> = ({ translations }) => {
  return (
    <section className="py-16 bg-white">
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
                <span className="text-gray-700">accentuated eccentric loading</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">accommodating resistance</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">velocity based training</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00ffba]" />
                <span className="text-gray-700">specific energy system development</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              We utilize cutting-edge technology to track performance metrics in real-time, 
              allowing for precise adjustments and optimal training outcomes.
            </p>
          </div>

          {/* Right Content - Image with overlay */}
          <div className="relative">
            <img 
              src="/lovable-uploads/87da9025-650f-4202-b262-5d56a1eb12e6.png"
              alt="Elite Training Technology"
              className="w-full h-auto rounded-lg"
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
