
import React from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  return (
    <section id="results" className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            Αποτελέσματα
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <img 
              src="/lovable-uploads/730bb59d-9d4e-4475-84d4-52655d9c11a0.png" 
              alt="Θωμάς Γιαταγανάς στο WMC"
              className="w-full h-auto rounded-none mb-8"
            />
            
            <div className="bg-gray-800 p-8 rounded-none border border-gray-700">
              <p className="text-xl text-white leading-relaxed" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                🥊 <strong className="text-[#00ffba]">Σημαντική εμφάνιση</strong> του αθλητή μας <strong>Θωμά Γιαταγανά</strong> στο WMC!
                <br /><br />
                Παρά την ήττα, <strong className="text-[#00ffba]">κλέψαμε τις εντυπώσεις</strong> απέναντι στον πρωταθλητή Ελλάδος. 
                <br /><br />
                Η προπόνηση και η αφοσίωση φάνηκαν σε κάθε χτύπημα. Υπερήφανοι για την απόδοση! 💪
                <br /><br />
                <span className="text-[#00ffba]">#WMC #MuayThai #HyperKids #ProudCoach #NeverGiveUp</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
