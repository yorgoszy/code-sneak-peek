
import React from 'react';

interface ProgramBenefitsSectionProps {
  benefits: string[];
}

export const ProgramBenefitsSection: React.FC<ProgramBenefitsSectionProps> = ({ benefits }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-white mb-6">Οφέλη Προγράμματος</h3>
      <p className="text-gray-300 mb-6">
        Η συμμετοχή στο πρόγραμμά μας προσφέρει πολλά οφέλη που επεκτείνονται πέρα από τη σωματική κατάσταση. Εδώ είναι τα βασικά πλεονεκτήματα που θα βιώσετε:
      </p>
      <div className="grid grid-cols-2 gap-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-none border border-gray-700">
            <div className="text-white leading-relaxed">{benefit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
