
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
        
        <div className="max-w-sm mx-auto">
          <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
            <img 
              src="/lovable-uploads/730bb59d-9d4e-4475-84d4-52655d9c11a0.png" 
              alt="Θωμάς Γιαταγανάς στο WMC"
              className="w-full h-48 object-cover"
            />
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="text-sm text-[#00ffba] mb-2">15 Ιαν 2025</div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                Σημαντική εμφάνιση του αθλητή Θωμά Γιαταγανά στο WMC
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                Παρά την ήττα, κλέψαμε τις εντυπώσεις απέναντι στον πρωταθλητή Ελλάδος. 
                Η προπόνηση και η αφοσίωση φάνηκαν σε κάθε χτύπημα. Υπερήφανοι για την απόδοση 
                του αθλητή μας που έδειξε χαρακτήρα και τεχνική στο ρινγκ.
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#WMC</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#MuayThai</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#HyperKids</span>
              </div>
              
              <button className="text-[#00ffba] hover:text-[#00cc96] font-semibold transition-colors mt-auto text-left">
                Διαβάστε περισσότερα →
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
