import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

export const AboutSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Υποστηρίζοντας το
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-[#00ffba]">
            Αθλητικό σας ταξίδι
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-none shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-gray-900">Κύριος Προπονητής</h4>
              <p className="text-gray-600">Ο Γιώργος Ζυγούρης είναι πιστοποιημένος προπονητής με πολυετή εμπειρία.</p>
            </div>
            <div className="bg-white p-6 rounded-none shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-gray-900">Το Όραμά μας</h4>
              <p className="text-gray-600">Δημιουργούμε τους αθλητές του αύριο με επιστημονικά τεκμηριωμένες μεθόδους.</p>
            </div>
            <div className="bg-white p-6 rounded-none shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-gray-900">Μεθοδολογία</h4>
              <p className="text-gray-600">Επιστημονικά τεκμηριωμένη προσέγγιση στην αθλητική ανάπτυξη.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

AboutSectionComponent.craft = {
  displayName: 'About Section',
  props: {},
  related: {}
};
