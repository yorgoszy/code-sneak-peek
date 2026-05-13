import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";

interface GiftCardPDFDialogProps {
  giftCard: {
    code: string;
    card_type: string;
    amount: number | null;
    subscription_type_id?: string | null;
    recipient_name: string | null;
    sender_name: string | null;
    message: string | null;
    expires_at: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const GiftCardPDFDialog: React.FC<GiftCardPDFDialogProps> = ({
  giftCard,
  isOpen,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', [90, 50]);
      pdf.addImage(imgData, 'PNG', 0, 0, 90, 50);
      pdf.save(`gift-card-${giftCard.code}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const expiryDate = giftCard.expires_at 
    ? new Date(giftCard.expires_at).toLocaleDateString('el-GR')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Card Preview
          </DialogTitle>
        </DialogHeader>

        {/* Gift Card Visual - matches landing page */}
        <div
          ref={cardRef}
          className="relative w-full aspect-[9/5] bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 p-4 flex flex-col justify-between overflow-hidden shadow-2xl"
        >
          {/* Top: logo */}
          <div className="flex items-start justify-between relative z-10">
            <img
              src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/branding/hyperkids-logo-white.png"
              alt="HYPERKIDS"
              className="h-8 object-contain"
              crossOrigin="anonymous"
            />
            <div className="text-right">
              <p className="text-white text-2xl font-bold leading-none">€{giftCard.amount || 0}</p>
              <p className="text-gray-400 text-[10px] mt-1">
                {giftCard.card_type === 'subscription' ? 'Συνδρομή' : 'Δωροκάρτα'}
              </p>
            </div>
          </div>

          {/* Middle: code (XXXX-XXXX-XXXX) */}
          <div className="flex items-center justify-center relative z-10">
            <p className="text-white text-2xl md:text-3xl font-mono tracking-[0.4em] text-center">
              {giftCard.code}
            </p>
          </div>

          {/* Bottom row: GIFT CARD label + tagline + QR */}
          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-white text-xs font-bold tracking-widest">GIFT CARD</p>
              {giftCard.sender_name && (
                <p className="text-gray-500 text-[10px] mt-2">Από: {giftCard.sender_name}</p>
              )}
              {expiryDate && (
                <p className="text-gray-500 text-[10px]">Ισχύει έως: {expiryDate}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-white p-1.5">
                <QRCodeSVG
                  value={`https://hyperkids.lovable.app/redeem?code=${giftCard.code}`}
                  size={56}
                  level="M"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Κλείσιμο
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-black text-white hover:bg-gray-800 rounded-none">
            <Download className="h-4 w-4 mr-2" />
            Λήψη PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
