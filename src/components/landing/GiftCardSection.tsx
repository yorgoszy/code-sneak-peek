import React from 'react';
import { Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GiftCardSectionProps {
  translations: Record<string, string>;
}

const GiftCardSection: React.FC<GiftCardSectionProps> = ({ translations }) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ffba] opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#cb8954] opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Gift Card Visual */}
          <div className="flex-1 w-full">
            <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 p-6 md:p-8 flex flex-col justify-between shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffba] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-[#00ffba] text-lg md:text-xl font-bold tracking-wider">GIFT CARD</h3>
                  <p className="text-gray-500 text-xs mt-1">HYPERKIDS ATHLETICS</p>
                </div>
                <Gift className="h-8 w-8 text-[#cb8954]" />
              </div>

              <div className="relative z-10">
                <p className="text-gray-500 text-xs mb-1">ΚΩΔΙΚΟΣ</p>
                <p className="text-white text-lg md:text-xl font-mono tracking-widest">XXXX-XXXX-XXXX</p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <p className="text-gray-500 text-xs">Χάρισε αθλητισμό</p>
                <p className="text-[#cb8954] text-2xl md:text-3xl font-bold">€50+</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Χάρισε την εμπειρία<br />
              <span className="text-[#00ffba]">HYPERKIDS</span>
            </h2>
            <p className="text-gray-400 mb-6 text-lg">
              Το τέλειο δώρο για κάθε αθλητή. Αγόρασε ένα Gift Card 
              και χάρισε αθλητισμό, υγεία και πρόοδο.
            </p>
            <ul className="text-gray-300 space-y-2 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00ffba] rounded-full" />
                Διαθέσιμο σε χρηματικό ποσό ή συνδρομή
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00ffba] rounded-full" />
                Εκτυπώσιμη κάρτα PDF με QR code
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00ffba] rounded-full" />
                Εξαργύρωση online ή στο γυμναστήριο
              </li>
            </ul>
            <button
              onClick={() => navigate('/auth?redirect=shop')}
              className="bg-[#00ffba] text-black px-8 py-4 text-lg font-semibold hover:bg-[#00ffba]/90 transition-colors inline-flex items-center gap-2"
            >
              Αγόρασε Gift Card
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftCardSection;
