import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hyperkidsLogoBlack from "@/assets/hyperkids-logo-black.png";

interface GiftCard {
  id: string;
  code: string;
  card_type: string;
  amount: number | null;
  subscription_type_id: string | null;
  sender_name: string | null;
  expires_at: string | null;
}

interface Props {
  giftCards: GiftCard[];
}

export const GiftCardBulkPDFButton: React.FC<Props> = ({ giftCards }) => {
  const [generating, setGenerating] = useState(false);
  const [renderList, setRenderList] = useState<GiftCard[]>([]);
  const [subscriptionNames, setSubscriptionNames] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload subscription names whenever we are about to render
  useEffect(() => {
    if (renderList.length === 0) return;
    const ids = Array.from(
      new Set(
        renderList
          .filter(g => g.card_type === 'subscription' && g.subscription_type_id)
          .map(g => g.subscription_type_id as string)
      )
    );
    if (ids.length === 0) return;
    supabase
      .from('subscription_types')
      .select('id, name')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((row: any) => { map[row.id] = row.name; });
        setSubscriptionNames(map);
      });
  }, [renderList]);

  const handleDownloadAll = async () => {
    if (giftCards.length === 0) {
      toast.error('Δεν υπάρχουν gift cards');
      return;
    }
    setGenerating(true);
    setRenderList(giftCards);
    const toastId = toast.loading(`Προετοιμασία ${giftCards.length} gift cards...`);

    try {
      // Wait for React to mount the offscreen tree
      await new Promise(r => setTimeout(r, 300));

      const container = containerRef.current;
      if (!container) throw new Error('container missing');

      // Wait for ALL images to be fully decoded
      const imgs = Array.from(container.querySelectorAll('img'));
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
      // Extra paint settle
      await new Promise(r => setTimeout(r, 200));

      const cardEls = container.querySelectorAll<HTMLDivElement>('[data-bulk-card]');
      if (cardEls.length === 0) throw new Error('no cards rendered');

      const pdf = new jsPDF('l', 'mm', [90, 50]);

      for (let i = 0; i < cardEls.length; i++) {
        const el = cardEls[i];
        toast.loading(`Δημιουργία PDF... ${Math.floor(i / 2) + 1}/${giftCards.length}`, { id: toastId });

        const canvas = await html2canvas(el, {
          scale: 1.5,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        if (i > 0) pdf.addPage([90, 50], 'l');
        pdf.addImage(imgData, 'JPEG', 0, 0, 90, 50);

        // Yield to keep UI responsive
        await new Promise(r => setTimeout(r, 0));
      }

      pdf.save(`gift-cards-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`Δημιουργήθηκε PDF με ${giftCards.length} gift cards`, { id: toastId });
    } catch (err) {
      console.error('Bulk PDF error:', err);
      toast.error('Σφάλμα δημιουργίας PDF', { id: toastId });
    } finally {
      setRenderList([]);
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleDownloadAll}
        disabled={generating || giftCards.length === 0}
        variant="outline"
        className="rounded-none"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        Λήψη όλων ({giftCards.length})
      </Button>

      {/* Offscreen render container */}
      {renderList.length > 0 && (
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '900px',
            zIndex: -1,
          }}
        >
          {renderList.map(gc => {
            const expiryDate = gc.expires_at
              ? new Date(gc.expires_at).toLocaleDateString('el-GR')
              : '';
            const subName = gc.subscription_type_id
              ? subscriptionNames[gc.subscription_type_id]
              : null;
            return (
              <React.Fragment key={gc.id}>
                {/* Front */}
                <div
                  data-bulk-card
                  className="relative border border-gray-800 px-8 py-6 flex flex-col justify-between overflow-hidden"
                  style={{
                    width: '900px',
                    height: '500px',
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
                      src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/branding/hyperkids-logo-white.png"
                      alt="HYPERKIDS"
                      style={{ height: '64px', objectFit: 'contain' }}
                      crossOrigin="anonymous"
                    />
                    <div className="text-right">
                      <p className="text-white font-bold leading-none" style={{ fontSize: '40px' }}>€{gc.amount || 0}</p>
                      <p style={{ fontSize: '16px', marginTop: '6px', color: '#d4d1c9' }}>
                        {gc.card_type === 'subscription'
                          ? `Συνδρομή${subName ? ` · ${subName}` : ''}`
                          : 'Δωροκάρτα'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center relative z-10">
                    <p className="text-white font-mono text-center" style={{ fontSize: '52px', letterSpacing: '0.4em' }}>
                      {gc.code}
                    </p>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <p className="text-white font-bold tracking-widest" style={{ fontSize: '18px' }}>GIFT CARD</p>
                      {gc.sender_name && (
                        <p style={{ fontSize: '16px', marginTop: '8px', color: '#d4d1c9' }}>Από: {gc.sender_name}</p>
                      )}
                      {expiryDate && (
                        <p style={{ fontSize: '16px', color: '#d4d1c9' }}>Ισχύει έως: {expiryDate}</p>
                      )}
                    </div>
                    <div className="bg-white" style={{ padding: '8px' }}>
                      <QRCodeSVG
                        value={`https://hyperkids.lovable.app/redeem?code=${gc.code}`}
                        size={110}
                        level="M"
                      />
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div
                  data-bulk-card
                  className="relative px-8 py-6 overflow-hidden"
                  style={{
                    width: '900px',
                    height: '500px',
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
                    className="absolute text-black leading-none"
                    style={{ fontFamily: "'UnifrakturMaguntia', cursive", fontSize: '56px', top: '40px', right: '40px' }}
                  >
                    trust the process
                  </div>

                  <img
                    src={hyperkidsLogoBlack}
                    alt="Hyperkids"
                    className="absolute"
                    style={{ height: '64px', objectFit: 'contain', top: '40px', left: '40px' }}
                  />

                  <img
                    src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/branding/icon-black.png"
                    alt="Icon"
                    crossOrigin="anonymous"
                    className="absolute"
                    style={{ height: '80px', objectFit: 'contain', bottom: '40px', left: '40px' }}
                  />

                  <div className="absolute text-right text-black leading-snug" style={{ fontSize: '16px', bottom: '40px', right: '40px' }}>
                    <p>Αν. Γεωργίου 46, Θεσσαλονίκη 54627</p>
                    <p>Τηλ: +30 2310 529104</p>
                    <p>info@hyperkids.gr</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </>
  );
};
