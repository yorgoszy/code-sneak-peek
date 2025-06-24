
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, AlertTriangle } from "lucide-react";

interface SubscriptionRequiredProps {
  isMobile?: boolean;
}

export const SubscriptionRequired: React.FC<SubscriptionRequiredProps> = ({ isMobile = false }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#00ffba]" />
          Απαιτείται Συνδρομή RID
        </DialogTitle>
      </DialogHeader>
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-700">Πρόσβαση Απαγορευμένη</h3>
        <p className="text-gray-600 mb-4">
          Ο έξυπνος AI προπονητής είναι διαθέσιμος μόνο για συνδρομητές RID.
        </p>
        <div className="bg-blue-50 p-4 rounded-none mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Τι περιλαμβάνει η συνδρομή:</h4>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Απεριόριστη πρόσβαση στον RID AI</li>
            <li>• Εξατομικευμένες συμβουλές διατροφής</li>
            <li>• Ανάλυση προόδου και τεστ</li>
            <li>• Υπολογισμοί θερμίδων και μακροθρεπτικών</li>
            <li>• Προσαρμοσμένες προτάσεις προπόνησης</li>
          </ul>
        </div>
        <p className="text-sm text-gray-500">
          Επικοινωνήστε με τον διαχειριστή για να ενεργοποιήσετε τη συνδρομή σας.
        </p>
      </div>
    </>
  );
};
