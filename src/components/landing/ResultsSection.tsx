
import React from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  return (
    <section id="results" className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            Αποτελέσματα
          </h2>
        </div>
        
        <div className="max-w-sm mx-auto">
          <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
            <img 
              src="/lovable-uploads/c5d227a2-165a-4a56-b58c-b21e219312bd.png" 
              alt="Θωμάς Γιαταγανάς στο WMC"
              className="w-full h-48 object-cover -mt-2"
            />
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="text-sm text-[#00ffba] mb-2">29 Ιουν 2025</div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                Σημαντική εμφάνιση του αθλητή Θωμά Γιαταγανά στο WMC
              </h3>
              
              <p className="text-gray-600 mb-4 flex-grow">
                Παρά την ήττα, κλέψαμε τις εντυπώσεις απέναντι στον πρωταθλητή Ελλάδος. 
                Η προπόνηση και η αφοσίωση φάνηκαν σε κάθε χτύπημα. Υπερήφανοι για την απόδοση 
                του αθλητή μας που έδειξε χαρακτήρα και τεχνική στο ρινγκ.
              </p>
              
              <div className="flex flex-wrap gap-1">
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#WMC</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#MuayThai</span>
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">#HyperKids</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
