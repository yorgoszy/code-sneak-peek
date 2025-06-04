
import React from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  return (
    <section id="results" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{translations.resultsSection}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {translations.resultsDescription}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
