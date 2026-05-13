import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { hyperkidsLogoBlack } from "@/assets/hyperkidsLogoBlack";
import { hyperkidsLogoWhite } from "@/assets/hyperkidsLogoWhite";
import { iconBlack } from "@/assets/iconBlack";

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

  const handleDownloadPDF = async () => {
    if (!cardRef.current || !backRef.current) return;

    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true }),
        html2canvas(backRef.current, { scale: 2, backgroundColor: null, useCORS: true }),
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

  const expiryDate = giftCard.expires_at
    ? new Date(giftCard.expires_at).toLocaleDateString('el-GR')
    : '';

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
        <div
          ref={cardRef}
          className="relative w-full aspect-[9/5] border border-gray-800 px-5 py-4 flex flex-col justify-between overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#000',
            backgroundImage: `
              radial-gradient(ellipse at 20% 10%, rgba(180, 180, 180, 0.35) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 25%, rgba(120, 120, 120, 0.3) 0%, transparent 55%),
              radial-gradient(ellipse at 70% 90%, rgba(200, 200, 200, 0.25) 0%, transparent 55%),
              radial-gradient(ellipse at 10% 80%, rgba(90, 90, 90, 0.3) 0%, transparent 55%),
              linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 40%, #050505 100%)
            `,
          }}
        >
          <div className="flex items-start justify-between relative z-10">
            <img
              src={hyperkidsLogoWhite}
              alt="HYPERKIDS"
              className="h-8 object-contain"
            />
            <div className="text-right" style={{ marginTop: '5px' }}>
              <p className="text-white text-2xl font-bold leading-none">€{giftCard.amount || 0}</p>
            </div>
          </div>

          <div className="flex items-center justify-center relative z-10">
            <p className="text-white text-2xl md:text-3xl font-mono tracking-[0.4em] text-center">
              {giftCard.code}
            </p>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-white text-xs font-bold tracking-widest">GIFT CARD</p>
              {giftCard.sender_name && (
                <p className="text-[10px] mt-0.5" style={{ color: '#d4d1c9' }}>Από: {giftCard.sender_name}</p>
              )}
              {giftCard.card_type === 'subscription' && subscriptionName && (
                <p className="text-[10px]" style={{ color: '#d4d1c9' }}>Συνδρομή · {subscriptionName}</p>
              )}
              {expiryDate && (
                <p className="text-[10px]" style={{ color: '#d4d1c9' }}>Ισχύει έως: {expiryDate}</p>
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

        {/* Back side */}
        <div
          ref={backRef}
          className="relative w-full aspect-[9/5] px-5 py-4 flex items-end justify-between overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#d4d1c9',
            backgroundImage: `
              radial-gradient(ellipse at 20% 10%, rgba(60, 60, 60, 0.25) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 25%, rgba(60, 60, 60, 0.18) 0%, transparent 55%),
              radial-gradient(ellipse at 70% 90%, rgba(60, 60, 60, 0.22) 0%, transparent 55%),
              radial-gradient(ellipse at 10% 80%, rgba(60, 60, 60, 0.15) 0%, transparent 55%),
              linear-gradient(135deg, #e0ddd5 0%, #c8c5bd 50%, #b0ada5 100%)
            `,
          }}
        >
          <div
            className="absolute right-5 text-black text-2xl leading-none"
            style={{ fontFamily: "'UnifrakturMaguntia', cursive", top: '14px' }}
          >
            trust the process
          </div>

          <img
            src={hyperkidsLogoBlack}
            alt="Hyperkids"
            className="absolute left-5 h-7 object-contain"
            style={{ top: '14px' }}
          />

          <img
            src={iconBlack}
            alt="Icon"
            className="absolute left-5 h-8 object-contain"
            style={{ bottom: '14px' }}
          />

          <div className="ml-auto text-right text-black text-[10px] leading-snug">
            <p>Αν. Γεωργίου 46, Θεσσαλονίκη 54627</p>
            <p>Τηλ: +30 2310 529104</p>
            <p>info@hyperkids.gr</p>
          </div>
        </div>

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
