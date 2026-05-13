import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  createAmountImage,
  createTrustMarkImage,
  GiftCardPreviewBack,
  GiftCardPreviewFront,
  type PreviewImageAsset,
} from './GiftCardPreviewCards';

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
  const [renderAssets, setRenderAssets] = useState<Record<string, { amountImage: PreviewImageAsset | null }>>({});
  const [trustMarkImage, setTrustMarkImage] = useState<PreviewImageAsset | null>(null);
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
    const subscriptionIds = Array.from(
      new Set(
        giftCards
          .filter(g => g.card_type === 'subscription' && g.subscription_type_id)
          .map(g => g.subscription_type_id as string)
      )
    );
    if (subscriptionIds.length > 0) {
      const { data } = await supabase
        .from('subscription_types')
        .select('id, name')
        .in('id', subscriptionIds);
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => { map[row.id] = row.name; });
      setSubscriptionNames(map);
    }
    const [trustImage, amountImages] = await Promise.all([
      createTrustMarkImage(),
      Promise.all(giftCards.map(async gc => [gc.id, await createAmountImage(gc.amount)] as const)),
    ]);
    setTrustMarkImage(trustImage);
    setRenderAssets(Object.fromEntries(amountImages.map(([id, amountImage]) => [id, { amountImage }])));
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
          scale: 3,
          backgroundColor: 'transparent',
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([90, 50], 'l');
        pdf.addImage(imgData, 'PNG', 0, 0, 90, 50);

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
      setRenderAssets({});
      setTrustMarkImage(null);
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
            width: '480px',
            zIndex: -1,
          }}
        >
          {renderList.map(gc => {
            const subName = gc.subscription_type_id
              ? subscriptionNames[gc.subscription_type_id]
              : null;
            return (
              <React.Fragment key={gc.id}>
                <GiftCardPreviewFront
                  giftCard={gc}
                  subscriptionName={subName}
                  amountImage={renderAssets[gc.id]?.amountImage ?? null}
                  capture
                />
                <GiftCardPreviewBack trustMarkImage={trustMarkImage} capture />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </>
  );
};
