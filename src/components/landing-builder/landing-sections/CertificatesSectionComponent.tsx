import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

export const CertificatesSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Πιστοποιήσεις
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Logo {i}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

CertificatesSectionComponent.craft = {
  displayName: 'Certificates Section',
  props: {},
  related: {}
};
