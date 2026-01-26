import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Zap, Target, Activity, BarChart3 } from 'lucide-react';

const methods = [
  { icon: Zap, title: 'Accentuated Eccentric Training', desc: 'Μέγιστη μυϊκή ανάπτυξη' },
  { icon: Target, title: 'Accommodating Resistance', desc: 'Προσαρμοζόμενη αντίσταση' },
  { icon: Activity, title: 'Velocity Based Training', desc: 'Προπόνηση βασισμένη στην ταχύτητα' },
  { icon: BarChart3, title: 'Specific Energy System', desc: 'Εξειδικευμένη ανάπτυξη ενέργειας' }
];

export const EliteTrainingSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
            Elite Training Methodology
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Χρησιμοποιούμε τις πιο σύγχρονες μεθόδους προπόνησης για μέγιστα αποτελέσματα
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methods.map((method, i) => (
              <div key={i} className="bg-gray-900 p-6 rounded-none border border-gray-800">
                <method.icon className="w-10 h-10 text-[#00ffba] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
                <p className="text-gray-400 text-sm">{method.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

EliteTrainingSectionComponent.craft = {
  displayName: 'Elite Training Section',
  props: {},
  related: {}
};
