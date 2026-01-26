import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Trophy } from 'lucide-react';

const results = [
  { title: '500+', desc: 'Αθλητές' },
  { title: '15+', desc: 'Χρόνια εμπειρίας' },
  { title: '50+', desc: 'Διακρίσεις' },
  { title: '100%', desc: 'Αφοσίωση' }
];

export const ResultsSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section id="results" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
            <Trophy className="inline-block w-8 h-8 mr-2 text-[#cb8954]" />
            Αποτελέσματα
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Τα αποτελέσματά μας μιλούν από μόνα τους
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {results.map((result, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#00ffba] mb-2">
                  {result.title}
                </div>
                <div className="text-gray-400">{result.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

ResultsSectionComponent.craft = {
  displayName: 'Results Section',
  props: {},
  related: {}
};
