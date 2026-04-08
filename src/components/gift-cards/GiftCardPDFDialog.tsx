import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface GiftCardPDFDialogProps {
  giftCard: {
    code: string;
    card_type: string;
    amount: number | null;
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
      const pdf = new jsPDF('l', 'mm', [210, 100]);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 100);
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

        {/* Gift Card Visual */}
        <div
          ref={cardRef}
          className="relative w-full aspect-[21/10] bg-gradient-to-br from-black via-gray-900 to-black p-8 flex flex-col justify-between overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ffba] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#cb8954] opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Top section */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h2 className="text-[#00ffba] text-2xl font-bold tracking-wider">GIFT CARD</h2>
              <p className="text-gray-400 text-xs mt-1">HYPERKIDS ATHLETICS</p>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl font-bold">
                €{giftCard.amount || 0}
              </p>
              <p className="text-gray-400 text-xs">
                {giftCard.card_type === 'subscription' ? 'Συνδρομή' : 'Δωροκάρτα'}
              </p>
            </div>
          </div>

          {/* Middle - code & QR */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-xs mb-1">ΚΩΔΙΚΟΣ</p>
              <p className="text-white text-xl font-mono tracking-widest">{giftCard.code}</p>
              {giftCard.recipient_name && (
                <p className="text-[#cb8954] text-sm mt-2">
                  Προς: {giftCard.recipient_name}
                </p>
              )}
              {giftCard.message && (
                <p className="text-gray-400 text-xs mt-1 max-w-[250px] italic">
                  "{giftCard.message}"
                </p>
              )}
            </div>
            <div className="bg-white p-2 rounded-sm">
              <QRCodeSVG
                value={`https://hyperkids.lovable.app/redeem?code=${giftCard.code}`}
                size={64}
                level="M"
              />
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between relative z-10">
            <div>
              {giftCard.sender_name && (
                <p className="text-gray-500 text-xs">Από: {giftCard.sender_name}</p>
              )}
            </div>
            {expiryDate && (
              <p className="text-gray-500 text-xs">Ισχύει έως: {expiryDate}</p>
            )}
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
