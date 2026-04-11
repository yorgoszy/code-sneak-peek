import React from 'react';
import { Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import headerLogo from '@/assets/header-logo.png';

interface GiftCardSectionProps {
  translations: Record<string, string>;
}

const GiftCardSection: React.FC<GiftCardSectionProps> = ({ translations }) => {
  const navigate = useNavigate();

  return (
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
                  <p className="text-gray-500 text-xs mt-1 font-['Robert_Pro']">GIFT CARD</p>
                </div>
                <Gift className="h-8 w-8 text-white" />
              </div>

              <div className="relative z-10">
                <p className="text-gray-500 text-xs mb-1 font-['Robert_Pro']">ΚΩΔΙΚΟΣ</p>
                <p className="text-white text-lg md:text-xl font-mono tracking-widest">XXXX-XXXX-XXXX</p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <p className="text-gray-500 text-xs font-['Robert_Pro']">Χάρισε αθλητισμό</p>
                <p className="text-white text-2xl md:text-3xl font-bold font-['Robert_Pro']">€50+</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Robert_Pro']">
              Χάρισε την εμπειρία<br />
              <span className="text-white">του αθλητισμού</span>
            </h2>
            <p className="text-gray-400 mb-6 text-lg font-['Robert_Pro']">
              Το τέλειο δώρο για κάθε αθλητή. Αγόρασε ένα Gift Card 
              και χάρισε αθλητισμό, υγεία και πρόοδο.
            </p>
            <ul className="text-gray-300 space-y-2 mb-8 text-sm font-['Robert_Pro']">
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
              onClick={() => navigate('/auth?redirect=shop')}
              className="bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-200 transition-colors inline-flex items-center gap-2 font-['Robert_Pro']"
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
