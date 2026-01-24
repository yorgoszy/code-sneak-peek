import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

const defaultTranslations = {
  readyQuestion: 'Είστε έτοιμοι;',
  journeyText: 'Ξεκινήστε το αθλητικό σας ταξίδι σήμερα.',
  startNow: 'Ξεκινήστε τώρα'
};

export const CTASectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="py-20 bg-[#cb8954]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-black mb-6">
            {defaultTranslations.readyQuestion}
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto mb-8">
            {defaultTranslations.journeyText}
          </p>
          <button 
            className="bg-black px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors rounded-none text-[#cb8954]"
          >
            {defaultTranslations.startNow}
          </button>
        </div>
      </section>
    </div>
  );
};

CTASectionComponent.craft = {
  displayName: 'CTA Section',
  props: {},
  related: {}
};
