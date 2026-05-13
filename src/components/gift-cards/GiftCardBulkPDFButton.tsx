import React, { useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
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

const PDF_WIDTH_MM = 72;
const PDF_HEIGHT_MM = 40;
const BULK_RENDER_WIDTH_PX = 288;
const BULK_JPEG_QUALITY = 0.45;

const waitForPaint = () =>
  new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

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
    const trustImage = await createTrustMarkImage();
    flushSync(() => setTrustMarkImage(trustImage));
    const toastId = toast.loading(`Προετοιμασία ${giftCards.length} gift cards...`);

    try {
      const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [PDF_WIDTH_MM, PDF_HEIGHT_MM], compress: true });
      let pageIndex = 0;

      for (let giftCardIndex = 0; giftCardIndex < giftCards.length; giftCardIndex++) {
        const giftCard = giftCards[giftCardIndex];
        toast.loading(`Δημιουργία PDF... ${giftCardIndex + 1}/${giftCards.length}`, { id: toastId });

        const amountImage = await createAmountImage(giftCard.amount);
        flushSync(() => {
          setRenderAssets({ [giftCard.id]: { amountImage } });
          setRenderList([giftCard]);
        });

        await waitForPaint();

        const container = containerRef.current;
        if (!container) throw new Error('container missing');

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

        const cardEls = container.querySelectorAll<HTMLDivElement>('[data-bulk-card]');
        if (cardEls.length !== 2) throw new Error('card sides missing');

        for (const el of Array.from(cardEls)) {
          const canvas = await html2canvas(el, {
            scale: 1,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
          });
          const imgData = canvas.toDataURL('image/jpeg', BULK_JPEG_QUALITY);
          if (pageIndex > 0) pdf.addPage([PDF_WIDTH_MM, PDF_HEIGHT_MM], 'l');
          pdf.addImage(imgData, 'JPEG', 0, 0, PDF_WIDTH_MM, PDF_HEIGHT_MM, undefined, 'FAST');
          canvas.width = 0;
          canvas.height = 0;
          pageIndex++;
        }

        flushSync(() => {
          setRenderList([]);
          setRenderAssets({});
        });
        await new Promise(r => setTimeout(r, 10));
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
            width: `${BULK_RENDER_WIDTH_PX}px`,
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
