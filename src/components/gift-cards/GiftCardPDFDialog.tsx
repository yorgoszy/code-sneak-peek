import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import {
  createAmountImage,
  createTrustMarkImage,
  GiftCardPreviewBack,
  GiftCardPreviewFront,
  type PreviewImageAsset,
} from './GiftCardPreviewCards';

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
  const backRef = useRef<HTMLDivElement>(null);
  const [subscriptionName, setSubscriptionName] = useState<string | null>(null);
  const [trustMarkImage, setTrustMarkImage] = useState<PreviewImageAsset | null>(null);
  const [amountImage, setAmountImage] = useState<PreviewImageAsset | null>(null);

  useEffect(() => {
    if (giftCard.card_type === 'subscription' && giftCard.subscription_type_id) {
      supabase
        .from('subscription_types')
        .select('name')
        .eq('id', giftCard.subscription_type_id)
        .maybeSingle()
        .then(({ data }) => setSubscriptionName(data?.name || null));
    } else {
      setSubscriptionName(null);
    }
  }, [giftCard.card_type, giftCard.subscription_type_id]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.all([
      createTrustMarkImage(),
      createAmountImage(giftCard.amount),
    ]).then(([trustImage, amountImg]) => {
      if (!cancelled) {
        setTrustMarkImage(trustImage);
        setAmountImage(amountImg);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, giftCard.amount]);

  const handleDownloadPDF = async () => {
    const frontEl = cardRef.current;
    const backEl = backRef.current;
    if (!frontEl || !backEl) return;

    try {
      const imgs = [
        ...Array.from(frontEl.querySelectorAll('img')),
        ...Array.from(backEl.querySelectorAll('img')),
      ];
      await Promise.all(
        imgs.map(img =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );

      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontEl, { scale: 3, backgroundColor: 'transparent', useCORS: true, logging: false }),
        html2canvas(backEl, { scale: 3, backgroundColor: 'transparent', useCORS: true, logging: false }),
      ]);

      const pdf = new jsPDF('l', 'mm', [90, 50]);
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 90, 50);
      pdf.addPage([90, 50], 'l');
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 90, 50);
      pdf.save(`gift-card-${giftCard.code}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            Gift Card Preview
          </DialogTitle>
        </DialogHeader>

        {/* Front side */}
        <GiftCardPreviewFront
          ref={cardRef}
          giftCard={giftCard}
          subscriptionName={subscriptionName}
          amountImage={amountImage}
        />

        {/* Back side */}
        <GiftCardPreviewBack
          ref={backRef}
          trustMarkImage={trustMarkImage}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Κλείσιμο
          </Button>
          <Button onClick={handleDownloadPDF} disabled={!trustMarkImage || !amountImage} className="bg-black text-white hover:bg-gray-800 rounded-none">
            <Download className="h-4 w-4 mr-2" />
            Λήψη PDF
          </Button>
        </div>
      </DialogContent>

    </Dialog>
  );
};
