
import React from 'react';

interface FooterProps {
  translations: any;
}

const Footer: React.FC<FooterProps> = ({ translations }) => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-400">{translations.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
