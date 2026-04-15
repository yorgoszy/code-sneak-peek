import React, { useState } from 'react';
import { ArrowRight } from "lucide-react";
import headerLogo from '@/assets/header-logo.png';
import sloganLogo from '@/assets/trust-the-process.png';
import { GiftCardPurchaseDialog } from '@/components/gift-cards/GiftCardPurchaseDialog';

interface GiftCardSectionProps {
  translations: Record<string, string>;
}

const GiftCardSection: React.FC<GiftCardSectionProps> = ({ translations }) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  return (
    <>
      <section className="py-20 bg-black relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            {/* Gift Card Visual */}
            <div className="flex-1 w-full">
              <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <img src={headerLogo} alt="HyperKids Logo" className="h-8 w-auto mb-2" />
                    <p className="text-gray-500 text-xs mt-1 font-['Roobert_Pro',sans-serif]">GIFT CARD</p>
                  </div>
                  <img src={sloganLogo} alt="Trust The Process" className="h-10 w-auto" />
                </div>

                <div className="relative z-10">
                  <p className="text-gray-500 text-xs mb-1 font-['Roobert_Pro',sans-serif]">ΚΩΔΙΚΟΣ</p>
                  <p className="text-white text-lg md:text-xl font-mono tracking-widest">XXXX-XXXX-XXXX</p>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  <p className="text-gray-500 text-xs font-['Roobert_Pro',sans-serif]">Χάρισε αθλητισμό</p>
                  <p className="text-white text-2xl md:text-3xl font-bold font-['Roobert_Pro',sans-serif]">€50+</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Roobert_Pro',sans-serif]">
                Χάρισε την εμπειρία<br />
                <span className="text-white">του αθλητισμού</span>
              </h2>
              <p className="text-gray-400 mb-6 text-lg font-['Roobert_Pro',sans-serif]">
                Το τέλειο δώρο για κάθε αθλητή. Αγόρασε ένα Gift Card 
                και χάρισε αθλητισμό, υγεία και πρόοδο.
              </p>
              <ul className="text-gray-300 space-y-2 mb-8 text-sm font-['Roobert_Pro',sans-serif]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  Διαθέσιμο σε χρηματικό ποσό ή συνδρομή
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  Εκτυπώσιμη κάρτα PDF με QR code
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  Εξαργύρωση online ή στο γυμναστήριο
                </li>
              </ul>
              <button
                onClick={() => setPurchaseOpen(true)}
                className="bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-200 transition-colors inline-flex items-center gap-2 font-['Roobert_Pro',sans-serif]"
              >
                Αγόρασε Gift Card
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <GiftCardPurchaseDialog
        isOpen={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
      />
    </>
  );
};

export default GiftCardSection;
