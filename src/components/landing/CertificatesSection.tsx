import React from 'react';

// Import certificates
import certNasm from '@/assets/certificates/cert-nasm.png';
import certBioforce from '@/assets/certificates/cert-bioforce.png';
import certIsss from '@/assets/certificates/cert-isss.png';
import certDaru from '@/assets/certificates/cert-daru.png';
import certBarca from '@/assets/certificates/cert-barca.png';
import certFms from '@/assets/certificates/cert-fms.png';

interface CertificatesSectionProps {
  translations: Record<string, string>;
}

const certificates = [
  { src: certNasm, alt: 'NASM Certified', name: 'NASM' },
  { src: certBioforce, alt: 'Bioforce Certified Conditioning Coach', name: 'Bioforce CCC' },
  { src: certIsss, alt: 'SOXS Certification', name: 'SOXS' },
  { src: certDaru, alt: 'Daru Strong Performance', name: 'Daru Strong' },
  { src: certBarca, alt: 'FC Barcelona Innovation Hub', name: 'Barça Innovation Hub' },
  { src: certFms, alt: 'Functional Movement Screen', name: 'FMS' },
];

const CertificatesSection: React.FC<CertificatesSectionProps> = ({ translations }) => {
  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          {translations.certificates || 'Πιστοποιήσεις'}
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          {translations.certificatesDesc || 'Διεθνώς αναγνωρισμένες πιστοποιήσεις που εγγυώνται την ποιότητα της προπόνησης'}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {certificates.map((cert, index) => (
            <div 
              key={index} 
              className="group flex flex-col items-center justify-center p-4 transition-all duration-300 hover:scale-110"
            >
              <img 
                src={cert.src} 
                alt={cert.alt}
                className="h-20 md:h-24 lg:h-28 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
              <span className="mt-2 text-xs text-gray-500 group-hover:text-[#00ffba] transition-colors text-center">
                {cert.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CertificatesSection;
