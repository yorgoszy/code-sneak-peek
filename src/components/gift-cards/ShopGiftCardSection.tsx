import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { GiftCardRedeemDialog } from './GiftCardRedeemDialog';

export const ShopGiftCardSection: React.FC = () => {
  const [redeemOpen, setRedeemOpen] = useState(false);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gift Cards
        </h2>
        <Card className="rounded-none bg-gradient-to-r from-black to-gray-900 text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Έχεις Gift Card;</h3>
              <p className="text-gray-400 text-sm">
                Εξαργύρωσε τον κωδικό σου και απόλαυσε τις υπηρεσίες μας
              </p>
            </div>
            <Button
              onClick={() => setRedeemOpen(true)}
              className="bg-[#00ffba] text-black hover:bg-[#00ffba]/90 rounded-none font-semibold"
            >
              <Gift className="h-4 w-4 mr-2" />
              Εξαργύρωση
            </Button>
          </CardContent>
        </Card>
      </div>

      <GiftCardRedeemDialog
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
      />
    </>
  );
};
