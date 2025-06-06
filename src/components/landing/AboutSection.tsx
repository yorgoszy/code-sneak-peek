
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  translations: any;
}

const AboutSection: React.FC<AboutSectionProps> = ({ translations }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const aboutItems = [
    {
      number: "01",
      title: translations.personalizedTraining || "Personalized Training",
      description: translations.personalizedDescription || "Every athlete is unique. Our approach begins with comprehensive assessment and creates individualized training programs."
    },
    {
      number: "02", 
      title: translations.scientificApproach || "Scientific Approach",
      description: translations.scientificDescription || "We use evidence-based methods and continuous monitoring to ensure optimal progress and performance gains."
    },
    {
      number: "03",
      title: translations.holisticDevelopment || "Holistic Development", 
      description: translations.holisticDescription || "Beyond physical training, we focus on mental preparation, nutrition guidance, and injury prevention."
    }
  ];

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % aboutItems.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + aboutItems.length) % aboutItems.length);
  };

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.aboutUs}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.aboutDescription}
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-12">
          {aboutItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#00ffba] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">{item.number}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
                {item.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {aboutItems.map((item, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#00ffba] rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl font-bold text-black">{item.number}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
            onClick={prevItem}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
            onClick={nextItem}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {aboutItems.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#00ffba]' : 'bg-gray-400'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
