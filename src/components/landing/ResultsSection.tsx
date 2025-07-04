
import React from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  return (
    <section id="results" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            Αποτελέσματα
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-none shadow-lg overflow-hidden border border-gray-200">
            <div className="aspect-video overflow-hidden">
              <img 
                src="/lovable-uploads/730bb59d-9d4e-4475-84d4-52655d9c11a0.png" 
                alt="Θωμάς Γιαταγανάς στο WMC"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-[#00ffba] font-medium">15 Ιαν 2025</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">Muay Thai</span>
              </div>
              
              <h3 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                Σημαντική εμφάνιση του αθλητή Θωμά Γιαταγανά στο WMC
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-6">
                Παρά την ήττα, κλέψαμε τις εντυπώσεις απέναντι στον πρωταθλητή Ελλάδος. 
                Η προπόνηση και η αφοσίωση φάνηκαν σε κάθε χτύπημα. Υπερήφανοι για την απόδοση 
                του αθλητή μας που έδειξε χαρακτήρα και τεχνική στο ρινγκ.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full">#WMC</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full">#MuayThai</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full">#HyperKids</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full">#ProudCoach</span>
              </div>
              
              <div className="flex items-center text-[#00ffba] font-medium hover:underline cursor-pointer">
                <span>Διαβάστε περισσότερα</span>
                <span className="ml-2">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
