
import React from 'react';
import { Lock } from "lucide-react";

interface SubscriptionRequiredProps {
  isMobile: boolean;
}

export const SubscriptionRequired: React.FC<SubscriptionRequiredProps> = ({ isMobile }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-md">
        <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Απαιτείται Ενεργή Συνδρομή
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Για να έχεις πρόσβαση στον **RID AI**, χρειάζεσαι ενεργή συνδρομή. 
          Επικοινώνησε με τον διαχειριστή για να ενεργοποιήσεις τη συνδρομή σου.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-none">
          <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Τι περιλαμβάνει η συνδρομή:</h4>
          <ul className="text-xs sm:text-sm text-blue-800 text-left space-y-1">
            <li>• Απεριόριστη πρόσβαση στον RID AI</li>
            <li>• Εξατομικευμένες συμβουλές διατροφής</li>
            <li>• Ανάλυση προόδου και τεστ</li>
            <li>• Υπολογισμοί θερμίδων και μακροθρεπτικών</li>
            <li>• Προσαρμοσμένες προτάσεις προπόνησης</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
