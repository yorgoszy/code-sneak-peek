
import React from 'react';

interface ContactSectionProps {
  translations: any;
}

const ContactSection: React.FC<ContactSectionProps> = ({ translations }) => {
  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{translations.contactSection}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {translations.contactDescription}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
