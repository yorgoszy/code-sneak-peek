import React from 'react';

// Import certificate logos
import barcaLogo from '@/assets/certificates/barca.png';
import cccLogo from '@/assets/certificates/ccc.png';
import daruLogo from '@/assets/certificates/daru.png';
import exosLogo from '@/assets/certificates/exos.png';
import fcsLogo from '@/assets/certificates/fcs.png';
import fmsLogo from '@/assets/certificates/fms.png';
import nasmLogo from '@/assets/certificates/nasm.png';
import sfLogo from '@/assets/certificates/sf.png';
import aythLogo from '@/assets/certificates/ayth.png';

interface CertificatesSectionProps {
  translations: Record<string, string>;
}

const certificates = [
  { id: 1, src: aythLogo, alt: 'Aristotle University of Thessaloniki' },
  { id: 2, src: barcaLogo, alt: 'Barça Innovation Hub' },
  { id: 3, src: nasmLogo, alt: 'NASM' },
  { id: 4, src: fmsLogo, alt: 'FMS - Functional Movement Screen' },
  { id: 5, src: fcsLogo, alt: 'FCS - Fundamental Capacity Screen' },
  { id: 6, src: exosLogo, alt: 'EXOS' },
  { id: 7, src: cccLogo, alt: 'Bioforce Certified Conditioning Coach' },
  { id: 8, src: daruLogo, alt: 'Daru Strong Performance' },
  { id: 9, src: sfLogo, alt: 'StrongFirst' },
];

const CertificatesSection: React.FC<CertificatesSectionProps> = ({ translations }) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
          {translations.language === 'el' ? 'Πιστοποιήσεις & Συνεργασίες' : 'Certifications & Partnerships'}
        </h3>
        
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-8 items-center justify-items-center">
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <img
                src={cert.src}
                alt={cert.alt}
                className="max-h-16 md:max-h-20 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CertificatesSection;
