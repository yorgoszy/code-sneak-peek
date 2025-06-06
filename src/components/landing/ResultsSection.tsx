
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const results = [
    {
      percentage: "85%",
      title: "Improvement in Athletic Performance",
      description: "Athletes showed significant improvements in speed, agility, and overall performance metrics after 3 months of training."
    },
    {
      percentage: "92%",
      title: "Client Satisfaction Rate",
      description: "Our clients consistently rate their experience highly, citing personalized attention and effective training methods."
    },
    {
      percentage: "78%",
      title: "Injury Prevention Success",
      description: "Reduction in training-related injuries through proper movement patterns and progressive training protocols."
    },
    {
      percentage: "150+",
      title: "Athletes Trained",
      description: "Successfully trained over 150 athletes across various sports and age groups, from youth to professional level."
    },
    {
      percentage: "95%",
      title: "Goal Achievement Rate",
      description: "Athletes consistently achieve their performance goals through our systematic and scientific approach to training."
    },
    {
      percentage: "3+",
      title: "Years of Excellence",
      description: "Consistent delivery of high-quality training programs with proven results and continuous improvement."
    }
  ];

  const nextResult = () => {
    setCurrentIndex((prev) => (prev + 1) % results.length);
  };

  const prevResult = () => {
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  return (
    <section id="results" className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            {translations.realResults}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {translations.resultsDescription}
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-none border border-gray-700">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00ffba] mb-2">{result.percentage}</div>
                <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                <p className="text-gray-300 text-sm">
                  {result.description}
                </p>
              </div>
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
              {results.map((result, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#00ffba] mb-2">{result.percentage}</div>
                      <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                      <p className="text-gray-300 text-sm">
                        {result.description}
                      </p>
                    </div>
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
            onClick={prevResult}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
            onClick={nextResult}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {results.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#00ffba]' : 'bg-gray-600'
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

export default ResultsSection;
