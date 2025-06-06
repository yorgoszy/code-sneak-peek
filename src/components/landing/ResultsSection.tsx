
import React from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Result Card 1 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">85%</div>
              <h3 className="text-lg font-semibold mb-2">Improvement in Athletic Performance</h3>
              <p className="text-gray-300 text-sm">
                Athletes showed significant improvements in speed, agility, and overall performance metrics after 3 months of training.
              </p>
            </div>
          </div>

          {/* Result Card 2 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">92%</div>
              <h3 className="text-lg font-semibold mb-2">Client Satisfaction Rate</h3>
              <p className="text-gray-300 text-sm">
                Our clients consistently rate their experience highly, citing personalized attention and effective training methods.
              </p>
            </div>
          </div>

          {/* Result Card 3 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">78%</div>
              <h3 className="text-lg font-semibold mb-2">Injury Prevention Success</h3>
              <p className="text-gray-300 text-sm">
                Reduction in training-related injuries through proper movement patterns and progressive training protocols.
              </p>
            </div>
          </div>

          {/* Result Card 4 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">150+</div>
              <h3 className="text-lg font-semibold mb-2">Athletes Trained</h3>
              <p className="text-gray-300 text-sm">
                Successfully trained over 150 athletes across various sports and age groups, from youth to professional level.
              </p>
            </div>
          </div>

          {/* Result Card 5 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">95%</div>
              <h3 className="text-lg font-semibold mb-2">Goal Achievement Rate</h3>
              <p className="text-gray-300 text-sm">
                Athletes consistently achieve their performance goals through our systematic and scientific approach to training.
              </p>
            </div>
          </div>

          {/* Result Card 6 */}
          <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00ffba] mb-2">3+</div>
              <h3 className="text-lg font-semibold mb-2">Years of Excellence</h3>
              <p className="text-gray-300 text-sm">
                Consistent delivery of high-quality training programs with proven results and continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
