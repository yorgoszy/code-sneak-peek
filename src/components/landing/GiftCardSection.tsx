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
  const isEn = (translations as any)?.language === 'en';

  const t = {
    cardTagline: isEn ? 'Give the gift of sport' : 'Χάρισε αθλητισμό',
    titleLine1: isEn ? 'Give the experience' : 'Χάρισε την εμπειρία',
    titleLine2: isEn ? 'of sport' : 'του αθλητισμού',
    description: isEn
      ? 'The perfect gift for every athlete. Buy a Gift Card and give sport, health and progress.'
      : 'Το τέλειο δώρο για κάθε αθλητή. Αγόρασε ένα Gift Card και χάρισε αθλητισμό, υγεία και πρόοδο.',
    feature1: isEn ? 'Available as subscription' : 'Διαθέσιμο σε συνδρομή',
    feature2: isEn ? 'Printable PDF card with QR code' : 'Εκτυπώσιμη κάρτα PDF με QR code',
    feature3: isEn ? 'Redeem online or at the gym' : 'Εξαργύρωση online ή στο γυμναστήριο',
    cta: isEn ? 'Buy Gift Card' : 'Αγόρασε Gift Card',
  };

  return (
    <>
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            {/* Gift Card Visual */}
            <div className="flex-1 w-full">
              <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                <div className="relative z-10">
                  <div>
                    <img src={headerLogo} alt="HyperKids Logo" className="h-8 w-auto mb-2" />
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center relative z-10">
                  <p className="text-gray-500 text-sm tracking-[0.3em] font-mono font-['Roobert_Pro',sans-serif]">XXXX-XXXX-XXXX-XXXX</p>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-gray-500 text-xs mb-1 font-['Roobert_Pro',sans-serif]">GIFT CARD</p>
                    <p className="text-gray-400 text-xs font-['Roobert_Pro',sans-serif]">{t.cardTagline}</p>
                  </div>
                  <img src={sloganLogo} alt="Trust The Process" className="h-8 w-auto" />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Roobert_Pro',sans-serif]">
                {t.titleLine1}<br />
                <span className="text-white">{t.titleLine2}</span>
              </h2>
              <p className="text-gray-400 mb-6 text-lg font-['Roobert_Pro',sans-serif]">
                {t.description}
              </p>
              <ul className="text-gray-300 space-y-2 mb-8 text-sm font-['Roobert_Pro',sans-serif]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {t.feature1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {t.feature2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {t.feature3}
                </li>
              </ul>
              <button
                onClick={() => setPurchaseOpen(true)}
                className="bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-200 transition-colors inline-flex items-center gap-2 font-['Roobert_Pro',sans-serif]"
              >
                {t.cta}
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
